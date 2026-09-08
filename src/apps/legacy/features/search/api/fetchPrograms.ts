import { Api } from '@jellyfin/sdk';
import { AxiosRequestConfig } from 'axios';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { fetchItemsByType } from './fetchItemsByType';

export const fetchPrograms = async (
    api: Api,
    userId: string,
    params?: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await fetchItemsByType(
        api,
        userId,
        {
            includeItemTypes: [BaseItemKind.LiveTvProgram],
            ...params
        },
        options
    );

    return response;
};
