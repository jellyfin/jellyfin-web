import { Api } from '@jellyfin/sdk/lib/api';
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';

export const fetchItemsByType = async (
    api: Api,
    userId?: string,
    params?: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api).getItems(
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
