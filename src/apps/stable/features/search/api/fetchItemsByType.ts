import { type Api } from '@jellyfin/sdk/lib/api';
import { type ItemsApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/items-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { type AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';

export const fetchItemsByType = async (
    api: Api,
    userId?: string,
    params?: ItemsApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getItemsApi(api).getItems(
        {
            ...QUERY_OPTIONS,
            userId,
            recursive: true,
            ...params
        },
        options
    );
    return response.data;
};
