import type {BaseItemDtoQueryResult} from '@jellyfin/sdk/lib/generated-client';
import {ApiClient} from 'jellyfin-apiclient';

const ITEMS_PER_REQUEST_LIMIT = 25;

function getItemsSplit(apiClient: ApiClient, userId: string, options: any) {
    const optionsTemplate = {...options};
    const ids = options.Ids.split(',');
    const results = [];

    let end;
    for (let start = 0; start < ids.length && start < options.Limit; start = end) {
        end = start + ITEMS_PER_REQUEST_LIMIT;
        if (end > options.Limit) {
            end = options.Limit;
        }
        const idsSlice = ids.slice(start, end);
        optionsTemplate.Ids = idsSlice.join(',');
        results.push(apiClient.getItems(userId, optionsTemplate));
    }

    return results;
}

function mergeResults(results: BaseItemDtoQueryResult[]) {
    const merged: BaseItemDtoQueryResult = {
        Items: [],
        TotalRecordCount: 0,
        StartIndex: 0
    };

    for (const result of results) {
        if (result.Items == null) {
            console.log('[getItems] Retrieved Items array is invalid', result.Items);
            continue;
        }
        if (result.TotalRecordCount == null) {
            console.log('[getItems] Retrieved TotalRecordCount is invalid', result.TotalRecordCount);
            continue;
        }
        if (result.StartIndex == null) {
            console.log('[getItems] Retrieved StartIndex is invalid', result.StartIndex);
            continue;
        }
        merged.Items = merged.Items.concat(result.Items);
        merged.TotalRecordCount += result.TotalRecordCount;
        merged.StartIndex = Math.min(merged.StartIndex, result.StartIndex);
    }
    return merged;
}

export function getItems(apiClient: ApiClient, userId: string, options?: any) {
    if (options.Ids === undefined ||
        options.Ids.split(',').length <= ITEMS_PER_REQUEST_LIMIT) {
        return apiClient.getItems(apiClient.getCurrentUserId(), options);
    }
    const results = getItemsSplit(apiClient, userId, options);

    return Promise.all(results).then(mergeResults);
}
