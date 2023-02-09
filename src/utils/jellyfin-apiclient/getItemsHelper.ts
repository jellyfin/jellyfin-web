import type {BaseItemDtoQueryResult} from '@jellyfin/sdk/lib/generated-client';
import {ApiClient} from 'jellyfin-apiclient';

const idsPerItemRequestLimit = 25;

function getItemsSplit(apiClient: ApiClient, userId: string, options: any) {
    const optionsTemplate = {...options};
    const ids = options.Ids.split(',');
    const results = [];

    let nextI;
    for (let i = 0; i < ids.length && i < options.Limit; i = nextI) {
        nextI = i + idsPerItemRequestLimit;
        if (nextI > options.Limit) {
            nextI = options.Limit;
        }
        const idsSlice = ids.slice(i, nextI);
        console.log(idsSlice);
        optionsTemplate.Ids = idsSlice.join(',');
        results.push(apiClient.getItems(userId, optionsTemplate));
    }

    return results;
}

function mergeResults(results: BaseItemDtoQueryResult[]) {
    const merged: BaseItemDtoQueryResult = {};
    merged.Items = [];
    merged.TotalRecordCount = 0;
    merged.StartIndex = 0;

    for (const result of results) {
        if (result.Items == null) {
            console.log(`Retrieved Items array is invalid: ${result.Items}`);
            continue;
        }
        if (result.TotalRecordCount == null) {
            console.log(`Retrieved TotalRecordCount is invalid: ${
                result.TotalRecordCount}`);
            continue;
        }
        if (result.StartIndex == null) {
            console.log(
                `Retrieved StartIndex is invalid: ${result.StartIndex}`);
            continue;
        }
        merged.Items = merged.Items.concat(result.Items);
        merged.TotalRecordCount += result.TotalRecordCount;
        merged.StartIndex = Math.min(merged.StartIndex, result.StartIndex);
    }
    return merged;
}

export function getItems(apiClient: ApiClient, userId: string, options?: any):
    Promise<BaseItemDtoQueryResult> {
    if (options.Ids === undefined ||
        options.Ids.split(',').ength <= idsPerItemRequestLimit) {
        return apiClient.getItems(apiClient.getCurrentUserId(), options);
    }
    const results = getItemsSplit(apiClient, userId, options);

    return Promise.all(results).then(mergeResults);
}
