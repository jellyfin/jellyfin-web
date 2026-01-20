import Events from '../../../utils/events';
import { getItems } from '../../../utils/jellyfin-apiclient/getItems';

export const WaitForEventDefaultTimeout = 30000;
export const WaitForPlayerEventTimeout = 500;
export const TicksPerMillisecond = 10000.0;

export function waitForEventOnce(emitter: any, eventType: string, timeout?: number, rejectEventTypes?: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
        let rejectTimeout: any;
        if (timeout) {
            rejectTimeout = setTimeout(() => reject(new Error('Timed out.')), timeout);
        }

        const clearAll = () => {
            Events.off(emitter, eventType, callback);
            if (rejectTimeout) clearTimeout(rejectTimeout);
            if (Array.isArray(rejectEventTypes)) {
                rejectEventTypes.forEach(eventName => Events.off(emitter, eventName, rejectCallback));
            }
        };

        const callback = (...args: any[]) => { clearAll(); resolve(args); };
        const rejectCallback = (event: any) => { clearAll(); reject(event.type); };

        Events.on(emitter, eventType, callback);
        if (Array.isArray(rejectEventTypes)) {
            rejectEventTypes.forEach(eventName => Events.on(emitter, eventName, rejectCallback));
        }
    });
}

export function stringToGuid(input: string): string {
    return input.replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/, '$1-$2-$3-$4-$5');
}

export function getItemsForPlayback(apiClient: any, query: any): Promise<any> {
    if (query.Ids && query.Ids.split(',').length === 1) {
        const itemId = query.Ids.split(',');
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then((item: any) => ({ Items: [item] }));
    }
    query.Limit = query.Limit || 300;
    query.Fields = ['Chapters', 'Trickplay'];
    query.ExcludeLocationTypes = 'Virtual';
    query.EnableTotalRecordCount = false;
    query.CollapseBoxSetItems = false;
    return getItems(apiClient, apiClient.getCurrentUserId(), query);
}

function mergePlaybackQueries(obj1: any, obj2: any) {
    const query = { ...obj1, ...obj2 };
    const filters = query.Filters ? query.Filters.split(',') : [];
    if (!filters.includes('IsNotFolder')) filters.push('IsNotFolder');
    query.Filters = filters.join(',');
    return query;
}

export function translateItemsForPlayback(apiClient: any, items: any[], options: any): Promise<any[]> {
    if (items.length > 1 && options?.ids) {
        items.sort((a, b) => options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id));
    }

    const firstItem = items[0];
    let promise: Promise<any> | null = null;
    const queryOptions = options.queryOptions || {};

    if (firstItem.Type === 'Program') {
        promise = getItemsForPlayback(apiClient, { Ids: firstItem.ChannelId });
    } else if (firstItem.Type === 'Playlist') {
        promise = getItemsForPlayback(apiClient, { ParentId: firstItem.Id, SortBy: options.shuffle ? 'Random' : null });
    } else if (firstItem.Type === 'MusicArtist') {
        promise = getItemsForPlayback(apiClient, { ArtistIds: firstItem.Id, Filters: 'IsNotFolder', Recursive: true, SortBy: options.shuffle ? 'Random' : 'SortName', MediaTypes: 'Audio' });
    } else if (firstItem.IsFolder) {
        let sortBy = options.shuffle ? 'Random' : (firstItem.Type === 'BoxSet' ? 'SortName' : null);
        promise = getItemsForPlayback(apiClient, mergePlaybackQueries({ ParentId: firstItem.Id, Filters: 'IsNotFolder', Recursive: true, SortBy: sortBy, MediaTypes: 'Audio,Video' }, queryOptions));
    }

    if (promise) return promise.then(res => res ? res.Items : items);
    return Promise.resolve(items);
}