/**
 * Module that offers some utility functions.
 * @module components/syncPlay/core/Helper
 */

import Events from '../../../utils/events.ts';
import { getItems } from '../../../utils/jellyfin-apiclient/getItems.ts';

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

export function getItemsForPlayback(apiClient, query) {
    if (query.Ids && query.Ids.split(',').length === 1) {
        const itemId = query.Ids.split(',');

        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then((item) => ({
            Items: [item]
        }));
    } else {
        query.Limit = query.Limit || 300;
        query.Fields = ['Chapters', 'Trickplay'];
        query.ExcludeLocationTypes = 'Virtual';
        query.EnableTotalRecordCount = false;
        query.CollapseBoxSetItems = false;

        return getItems(apiClient, apiClient.getCurrentUserId(), query);
    }
}

function mergePlaybackQueries(obj1, obj2) {
    const query = Object.assign(obj1, obj2);

    const filters = query.Filters ? query.Filters.split(',') : [];
    if (filters.indexOf('IsNotFolder') === -1) {
        filters.push('IsNotFolder');
    }
    query.Filters = filters.join(',');
    return query;
}

export function translateItemsForPlayback(apiClient, items, options) {
    if (items.length > 1 && options?.ids) {
        // Use the original request id array for sorting the result in the proper order.
        items.sort((a, b) => options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id));
    }

    const firstItem = items[0];
    let promise;

    const queryOptions = options.queryOptions || {};

    if (firstItem.Type === 'Program') {
        promise = getItemsForPlayback(apiClient, {
            Ids: firstItem.ChannelId
        });
    } else if (firstItem.Type === 'Playlist') {
        promise = getItemsForPlayback(apiClient, {
            ParentId: firstItem.Id,
            SortBy: options.shuffle ? 'Random' : null
        });
    } else if (firstItem.Type === 'MusicArtist') {
        promise = getItemsForPlayback(apiClient, {
            ArtistIds: firstItem.Id,
            Filters: 'IsNotFolder',
            Recursive: true,
            SortBy: options.shuffle ? 'Random' : 'SortName',
            MediaTypes: 'Audio'
        });
    } else if (firstItem.MediaType === 'Photo') {
        promise = getItemsForPlayback(apiClient, {
            ParentId: firstItem.ParentId,
            Filters: 'IsNotFolder',
            // Setting this to true may cause some incorrect sorting.
            Recursive: false,
            SortBy: options.shuffle ? 'Random' : 'SortName',
            MediaTypes: 'Photo,Video'
        }).then((result) => {
            let index = result.Items.map((i) => i.Id).indexOf(firstItem.Id);

            if (index === -1) {
                index = 0;
            }

            options.startIndex = index;

            return Promise.resolve(result);
        });
    } else if (firstItem.Type === 'PhotoAlbum') {
        promise = getItemsForPlayback(apiClient, {
            ParentId: firstItem.Id,
            Filters: 'IsNotFolder',
            // Setting this to true may cause some incorrect sorting.
            Recursive: false,
            SortBy: options.shuffle ? 'Random' : 'SortName',
            MediaTypes: 'Photo,Video',
            Limit: 1000
        });
    } else if (firstItem.Type === 'MusicGenre') {
        promise = getItemsForPlayback(apiClient, {
            GenreIds: firstItem.Id,
            Filters: 'IsNotFolder',
            Recursive: true,
            SortBy: options.shuffle ? 'Random' : 'SortName',
            MediaTypes: 'Audio'
        });
    } else if (firstItem.IsFolder) {
        let sortBy = null;
        if (options.shuffle) {
            sortBy = 'Random';
        } else if (firstItem.Type === 'BoxSet') {
            sortBy = 'SortName';
        }
        promise = getItemsForPlayback(apiClient, mergePlaybackQueries({
            ParentId: firstItem.Id,
            Filters: 'IsNotFolder',
            Recursive: true,
            // These are pre-sorted.
            SortBy: sortBy,
            MediaTypes: 'Audio,Video'
        }, queryOptions));
    } else if (firstItem.Type === 'Episode' && items.length === 1) {
        promise = new Promise((resolve, reject) => {
            apiClient.getCurrentUser().then((user) => {
                if (!user.Configuration.EnableNextEpisodeAutoPlay || !firstItem.SeriesId) {
                    resolve(null);
                    return;
                }

                apiClient.getEpisodes(firstItem.SeriesId, {
                    IsVirtualUnaired: false,
                    IsMissing: false,
                    UserId: apiClient.getCurrentUserId(),
                    Fields: ['Chapters', 'Trickplay']
                }).then((episodesResult) => {
                    let foundItem = false;
                    episodesResult.Items = episodesResult.Items.filter((e) => {
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
        return promise.then((result) => result ? result.Items : items);
    } else {
        return Promise.resolve(items);
    }
}
