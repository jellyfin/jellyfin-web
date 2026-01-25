import { type Api } from '@jellyfin/sdk';
import { type ArtistsApiGetArtistsRequest } from '@jellyfin/sdk/lib/generated-client/api/artists-api';
import { type CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { useQuery } from '@tanstack/react-query';
import { type AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { isMusic } from '../utils/search';

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

export const useArtistsSearch = (parentId?: string, collectionType?: CollectionType, searchTerm?: string) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery({
        queryKey: ['Search', 'Artists', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) =>
            fetchArtists(
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
