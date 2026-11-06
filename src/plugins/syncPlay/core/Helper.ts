/**
 * Module that offers some utility functions.
 * @module plugins/syncPlay/core/Helper
 */

import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto-query-result';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import type { ApiClient } from 'jellyfin-apiclient';

import { ServerConnections } from '@/lib/jellyfin-apiclient';
import { getItems } from '@/lib/jellyfin-apiclient/utils/getItems';
import { toItemsRequest } from '@/lib/jellyfin-apiclient/utils/legacyItemsQuery';
import type { PlayOptions } from '@/types/playOptions';

import Events, { type Event as EmitterEvent } from '@/utils/events';

/**
 * Constants
 */
export const WaitForEventDefaultTimeout = 30000; // milliseconds
export const WaitForPlayerEventTimeout = 500; // milliseconds
export const TicksPerMillisecond = 10000.0;

/**
 * Waits for an event to be triggered on an object. An optional timeout can be specified after which the promise is rejected.
 * @param emitter Object on which to listen for events.
 * @param eventType Event name to listen for.
 * @param timeout Optional; time before rejecting the promise if the event does not trigger, in milliseconds.
 * @param rejectEventTypes Optional; event names to listen for that abort the waiting.
 * @returns A promise that resolves with the arguments of this call when the event is triggered. It rejects with an
 * Error on timeout, or with the event type when one of the reject events is triggered.
 */
export function waitForEventOnce(
    emitter: object,
    eventType: string,
    timeout?: number,
    rejectEventTypes?: string[]
): Promise<IArguments> {
    // NOTE: The arrow functions below always referenced the arguments of waitForEventOnce itself.
    // They are captured here because TS does not allow `arguments` in arrow functions when targeting ES5.
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;

    return new Promise((resolve, reject) => {
        let rejectTimeout: ReturnType<typeof setTimeout> | undefined;
        if (timeout) {
            rejectTimeout = setTimeout(() => {
                reject(new Error('Timed out.'));
            }, timeout);
        }

        const clearAll = () => {
            Events.off(emitter, eventType, callback);

            if (rejectTimeout) {
                clearTimeout(rejectTimeout);
            }

            if (Array.isArray(rejectEventTypes)) {
                rejectEventTypes.forEach(eventName => {
                    Events.off(emitter, eventName, rejectCallback);
                });
            }
        };

        const callback = () => {
            clearAll();
            resolve(args);
        };

        const rejectCallback = (event: EmitterEvent) => {
            clearAll();
            reject(event.type);
        };

        Events.on(emitter, eventType, callback);

        if (Array.isArray(rejectEventTypes)) {
            rejectEventTypes.forEach(eventName => {
                Events.on(emitter, eventName, rejectCallback);
            });
        }
    });
}

/**
 * Converts a given string to a Guid string.
 * @param input The input string.
 * @returns The Guid string.
 */
export function stringToGuid(input: string): string {
    return input.replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Gets the items to play.
 * @param apiClient The legacy ApiClient for the server.
 * @param query The getItems request parameters.
 * @returns A promise that resolves to the items to play. It rejects when no Api instance is available for the server.
 */
export function getItemsForPlayback(
    apiClient: ApiClient,
    query: LibraryApiGetItemsRequest
): Promise<BaseItemDtoQueryResult> {
    if (query.ids?.length === 1) {
        return apiClient.getItem(apiClient.getCurrentUserId(), query.ids[0]).then(function (item) {
            return {
                Items: [item]
            };
        });
    } else {
        const api = ServerConnections.getApi(apiClient.serverId());
        if (!api) return Promise.reject(new Error('No Api instance available'));

        return getItems(api, {
            ...query,
            userId: apiClient.getCurrentUserId(),
            limit: query.limit || 300,
            fields: [ItemFields.Chapters, ItemFields.Trickplay],
            excludeLocationTypes: [LocationType.Virtual],
            enableTotalRecordCount: false,
            collapseBoxSetItems: false
        });
    }
}

/**
 * Merges SDK-shaped playback query parameters with the (legacy-shaped) `queryOptions` passed to play/queue.
 * TODO: Remove the legacy conversion with the legacy query inputs.
 */
function mergePlaybackQueries(
    params: LibraryApiGetItemsRequest,
    legacyQueryOptions: Record<string, unknown>
): LibraryApiGetItemsRequest {
    const query = { ...params, ...toItemsRequest(legacyQueryOptions) };

    if (!query.filters?.includes(ItemFilter.IsNotFolder)) {
        query.filters = [...(query.filters || []), ItemFilter.IsNotFolder];
    }
    return query;
}

/**
 * Translates the requested items into the list of items to play, e.g. by expanding playlists, folders, artists and
 * genres into their contents, or by adding the following episodes when next episode autoplay is enabled.
 * @param apiClient The legacy ApiClient for the server.
 * @param items The requested items. They are sorted in place to match the order of `options.ids`.
 * @param options The play/queue options. `startIndex` is updated for photo playback.
 * @returns A promise that resolves to the items to play.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function translateItemsForPlayback(
    apiClient: ApiClient,
    items: BaseItemDto[],
    options: PlayOptions
): Promise<BaseItemDto[] | undefined> {
    const ids = options?.ids;
    if (items.length > 1 && ids) {
        // Use the original request id array for sorting the result in the proper order.
        items.sort(function (a, b) {
            return ids.indexOf(a.Id!) - ids.indexOf(b.Id!);
        });
    }

    const firstItem = items[0];
    let promise: Promise<BaseItemDtoQueryResult | null> | undefined;

    const queryOptions = options.queryOptions || {};

    if (firstItem.Type === 'Program') {
        promise = getItemsForPlayback(apiClient, {
            ids: firstItem.ChannelId ? [firstItem.ChannelId] : undefined
        });
    } else if (firstItem.Type === 'Playlist') {
        promise = getItemsForPlayback(apiClient, {
            parentId: firstItem.Id,
            sortBy: options.shuffle ? [ItemSortBy.Random] : undefined
        });
    } else if (firstItem.Type === 'MusicArtist') {
        promise = getItemsForPlayback(apiClient, {
            artistIds: [firstItem.Id!],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Audio]
        });
    } else if (firstItem.MediaType === 'Photo') {
        promise = getItemsForPlayback(apiClient, {
            parentId: firstItem.ParentId!,
            filters: [ItemFilter.IsNotFolder],
            // Setting this to true may cause some incorrect sorting.
            recursive: false,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Photo, MediaType.Video]
        }).then(function (result) {
            let index = result.Items!.map(function (i) {
                return i.Id;
            }).indexOf(firstItem.Id);

            if (index === -1) {
                index = 0;
            }

            options.startIndex = index;

            return Promise.resolve(result);
        });
    } else if (firstItem.Type === 'PhotoAlbum') {
        promise = getItemsForPlayback(apiClient, {
            parentId: firstItem.Id,
            filters: [ItemFilter.IsNotFolder],
            // Setting this to true may cause some incorrect sorting.
            recursive: false,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Photo, MediaType.Video],
            limit: 1000
        });
    } else if (firstItem.Type === 'MusicGenre') {
        promise = getItemsForPlayback(apiClient, {
            genreIds: [firstItem.Id!],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Audio]
        });
    } else if (firstItem.IsFolder) {
        let sortBy: ItemSortBy[] | undefined;
        if (options.shuffle) {
            sortBy = [ItemSortBy.Random];
        } else if (firstItem.Type === 'BoxSet') {
            sortBy = [ItemSortBy.SortName];
        }
        promise = getItemsForPlayback(apiClient, mergePlaybackQueries({
            parentId: firstItem.Id,
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            // These are pre-sorted.
            sortBy,
            mediaTypes: [MediaType.Audio, MediaType.Video]
        }, queryOptions));
    } else if (firstItem.Type === 'Episode' && items.length === 1) {
        promise = new Promise<BaseItemDtoQueryResult | null>(function (resolve, reject) {
            void apiClient.getCurrentUser().then(function (user) {
                if (!user.Configuration!.EnableNextEpisodeAutoPlay || !firstItem.SeriesId) {
                    resolve(null);
                    return;
                }

                apiClient.getEpisodes(firstItem.SeriesId, {
                    IsVirtualUnaired: false,
                    IsMissing: false,
                    UserId: apiClient.getCurrentUserId(),
                    Fields: ['Chapters', 'Trickplay']
                }).then(function (episodesResult) {
                    let foundItem = false;
                    episodesResult.Items = episodesResult.Items!.filter(function (e) {
                        if (foundItem) {
                            return true;
                        }
                        if (e.Id === firstItem.Id) {
                            foundItem = true;
                            return true;
                        }

                        return false;
                    });
                    episodesResult.TotalRecordCount = episodesResult.Items.length;
                    resolve(episodesResult);
                }, reject);
            });
        });
    }

    if (promise) {
        return promise.then(function (result) {
            return result ? result.Items : items;
        });
    } else {
        return Promise.resolve(items);
    }
}
