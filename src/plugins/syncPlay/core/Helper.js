/**
 * Module that offers some utility functions.
 * @module components/syncPlay/core/Helper
 */

import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getItems } from 'lib/jellyfin-apiclient/utils/getItems';
import { toItemsRequest } from 'lib/jellyfin-apiclient/utils/legacyItemsQuery';

import Events from '../../../utils/events.ts';

/**
 * Constants
 */
export const WaitForEventDefaultTimeout = 30000; // milliseconds
export const WaitForPlayerEventTimeout = 500; // milliseconds
export const TicksPerMillisecond = 10000.0;

/**
 * Waits for an event to be triggered on an object. An optional timeout can specified after which the promise is rejected.
 * @param {Object} emitter Object on which to listen for events.
 * @param {string} eventType Event name to listen for.
 * @param {number} timeout Time before rejecting promise if event does not trigger, in milliseconds.
 * @param {Array} rejectEventTypes Event names to listen for and abort the waiting.
 * @returns {Promise} A promise that resolves when the event is triggered.
 */
export function waitForEventOnce(emitter, eventType, timeout, rejectEventTypes) {
    return new Promise((resolve, reject) => {
        let rejectTimeout;
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
            resolve(arguments);
        };

        const rejectCallback = (event) => {
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
 * @param {string} input The input string.
 * @returns {string} The Guid string.
 */
export function stringToGuid(input) {
    return input.replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Gets the items to play.
 * @param {import('jellyfin-apiclient').ApiClient} apiClient The legacy ApiClient for the server.
 * @param {import('@jellyfin/sdk/lib/generated-client/api/library-api').LibraryApiGetItemsRequest} query The getItems request parameters.
 */
export function getItemsForPlayback(apiClient, query) {
    if (query.ids?.length === 1) {
        return apiClient.getItem(apiClient.getCurrentUserId(), query.ids[0]).then(function (item) {
            return {
                Items: [item]
            };
        });
    } else {
        return getItems(ServerConnections.getApi(apiClient.serverId()), {
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
function mergePlaybackQueries(params, legacyQueryOptions) {
    const query = { ...params, ...toItemsRequest(legacyQueryOptions) };

    if (!query.filters?.includes(ItemFilter.IsNotFolder)) {
        query.filters = [...(query.filters || []), ItemFilter.IsNotFolder];
    }
    return query;
}

export function translateItemsForPlayback(apiClient, items, options) {
    if (items.length > 1 && options?.ids) {
        // Use the original request id array for sorting the result in the proper order.
        items.sort(function (a, b) {
            return options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id);
        });
    }

    const firstItem = items[0];
    let promise;

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
            artistIds: [firstItem.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Audio]
        });
    } else if (firstItem.MediaType === 'Photo') {
        promise = getItemsForPlayback(apiClient, {
            parentId: firstItem.ParentId,
            filters: [ItemFilter.IsNotFolder],
            // Setting this to true may cause some incorrect sorting.
            recursive: false,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Photo, MediaType.Video]
        }).then(function (result) {
            let index = result.Items.map(function (i) {
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
            genreIds: [firstItem.Id],
            filters: [ItemFilter.IsNotFolder],
            recursive: true,
            sortBy: [options.shuffle ? ItemSortBy.Random : ItemSortBy.SortName],
            mediaTypes: [MediaType.Audio]
        });
    } else if (firstItem.IsFolder) {
        let sortBy;
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
        promise = new Promise(function (resolve, reject) {
            apiClient.getCurrentUser().then(function (user) {
                if (!user.Configuration.EnableNextEpisodeAutoPlay || !firstItem.SeriesId) {
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
                    episodesResult.Items = episodesResult.Items.filter(function (e) {
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
