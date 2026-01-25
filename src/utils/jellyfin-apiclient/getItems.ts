import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import { type ApiClient } from 'jellyfin-apiclient';
import { logger } from '../logger';

interface GetItemsRequest {
    Ids?: string;
    Limit?: number;
}

const ITEMS_PER_REQUEST_LIMIT = 40;

function getItemsSplit(apiClient: ApiClient, userId: string, options: GetItemsRequest) {
    const optionsTemplate = { ...options };
    const ids = options.Ids?.split(',') || [];
    const results = [];
    const limit = options.Limit ?? Infinity;

    let end;
    for (let start = 0; start < ids.length && start < limit; start = end) {
        end = start + ITEMS_PER_REQUEST_LIMIT;
        if (end > limit) {
            end = limit;
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
        StartIndex: 0
    };
    // set TotalRecordCount separately so TS knows it is defined
    merged.TotalRecordCount = 0;

    for (const result of results) {
        if (!result.Items) {
            logger.warn('[getItems] Retrieved Items array is invalid', { component: 'GetItems', items: result.Items });
            continue;
        }
        if (!result.TotalRecordCount) {
            logger.warn('[getItems] Retrieved TotalRecordCount is invalid', {
                component: 'GetItems',
                totalRecordCount: result.TotalRecordCount
            });
            continue;
        }
        if (typeof result.StartIndex === 'undefined') {
            logger.warn('[getItems] Retrieved StartIndex is invalid', {
                component: 'GetItems',
                startIndex: result.StartIndex
            });
            continue;
        }
        merged.Items = merged.Items?.concat(result.Items);
        merged.TotalRecordCount += result.TotalRecordCount;
        merged.StartIndex = Math.min(merged.StartIndex || 0, result.StartIndex);
    }
    return merged;
}

/**
 * Transparently handles the call to apiClient.getItems splitting the
 * call into multiple ones if the URL might get too long.
 * @param apiClient The ApiClient to use
 * @param userId User id to pass to actual getItems call
 * @param options Options object to specify getItems option. This includes a possibly long Items list that will be split up.
 * @returns A promise that resolves to the merged result of all getItems calls
 */
export function getItems(apiClient: ApiClient, userId: string, options?: GetItemsRequest) {
    const ids = options?.Ids?.split(',');
    if (!options || !ids || ids.length <= ITEMS_PER_REQUEST_LIMIT) {
        return apiClient.getItems(userId, options);
    }
    const results = getItemsSplit(apiClient, userId, options);

    return Promise.all(results).then(mergeResults);
}
