import { Api } from '@jellyfin/sdk';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';

export const fetchVideos = async (
    api: Api,
    userId: string,
    params?: LibraryApiGetItemsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLibraryApi(api).getItems(
        {
            ...QUERY_OPTIONS,
            userId,
            recursive: true,
            mediaTypes: [MediaType.Video],
            excludeItemTypes: [
                BaseItemKind.Movie,
                BaseItemKind.Episode,
                BaseItemKind.TvChannel
            ],
            ...params
        },
        options
    );
    return response.data;
};
