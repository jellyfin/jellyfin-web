import type { Api } from '@jellyfin/sdk';
import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto-query-result';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { chunk } from 'utils/array';

const ITEMS_PER_REQUEST_LIMIT = 40;

/**
 * Fetches items directly from the server, bypassing the query cache. Playback needs current data
 * (shuffle must produce a new order every time), and caching those requests would persist
 * one-off random queries.
 */
async function fetchItems(api: Api, params: LibraryApiGetItemsRequest) {
    const response = await getLibraryApi(api).getItems(params);
    return response.data;
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
            console.warn('[getItems] Retrieved Items array is invalid', result.Items);
            continue;
        }
        if (!result.TotalRecordCount) {
            console.warn('[getItems] Retrieved TotalRecordCount is invalid', result.TotalRecordCount);
            continue;
        }
        if (typeof result.StartIndex === 'undefined') {
            console.warn('[getItems] Retrieved StartIndex is invalid', result.StartIndex);
            continue;
        }
        merged.Items = merged.Items?.concat(result.Items);
        merged.TotalRecordCount += result.TotalRecordCount;
        merged.StartIndex = Math.min(merged.StartIndex || 0, result.StartIndex);
    }
    return merged;
}

/**
 * Transparently handles the call to the library API's getItems, splitting the
 * call into multiple ones if the URL might get too long.
 * @param api The SDK Api instance to use.
 * @param params The getItems request parameters. This includes a possibly long `ids` array that will be split up.
 * @returns A promise that resolves to the merged result of all getItems calls.
 */
export async function getItems(api: Api, params: LibraryApiGetItemsRequest): Promise<BaseItemDtoQueryResult> {
    let { ids = [] } = params;
    const { limit } = params;

    // Verify the number of ids is below the limit (if specified)
    if (limit && ids.length > limit) {
        ids = ids.slice(0, limit);
    }

    // Skip chunking and merging if the number of ids is below the limit
    if (ids.length <= ITEMS_PER_REQUEST_LIMIT) {
        return fetchItems(api, params);
    }

    // Split the ids into chunks and fetch items in parallel
    const requests = chunk(ids, ITEMS_PER_REQUEST_LIMIT)
        .map(chunkedIds => fetchItems(api, { ...params, ids: chunkedIds }));
    const results = await Promise.all(requests);
    return mergeResults(results);
}
