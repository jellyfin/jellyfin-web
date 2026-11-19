import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';

const fetchVideos = async (
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

export const useVideoSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['Search', 'Video', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) => fetchVideos(
            api!,
            userId!,
            {
                parentId,
                searchTerm
            },
            { signal }
        ),
        enabled: !!api && !!userId && !collectionType
    });
};
