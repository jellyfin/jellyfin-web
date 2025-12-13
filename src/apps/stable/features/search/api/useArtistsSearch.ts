import { Api } from '@jellyfin/sdk';
import { ArtistsApiGetArtistsRequest } from '@jellyfin/sdk/lib/generated-client/api/artists-api';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from '@/hooks/useApi';
import { QUERY_OPTIONS } from '@/apps/stable/features/search/constants/queryOptions';
import { isMusic } from '@/apps/stable/features/search/utils/search';

const fetchArtists = async (
    api: Api,
    userId: string,
    params?: ArtistsApiGetArtistsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getArtistsApi(api).getArtists(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};

export const useArtistsSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['Search', 'Artists', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) => fetchArtists(
            api!,
            userId!,
            {
                parentId,
                searchTerm
            },
            { signal }
        ),
        enabled: !!api && !!userId && (!collectionType || isMusic(collectionType))
    });
};
