import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { StudioApiGetStudiosRequest } from '@jellyfin/sdk/lib/generated-client/api/studio-api';
import { getStudioApi } from '@jellyfin/sdk/lib/utils/api/studio-api';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { isMovies, isTVShows } from '../utils/search';

const fetchStudios = async (
    api: Api,
    userId: string,
    params?: StudioApiGetStudiosRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getStudioApi(api).getStudios(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};

export const useStudiosSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    const isStudiosEnabled = (!collectionType || isMovies(collectionType) || isTVShows(collectionType));

    return useQuery({
        queryKey: ['Search', 'Studios', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) => fetchStudios(
            api!,
            userId!,
            {
                parentId,
                searchTerm
            },
            { signal }
        ),
        enabled: !!api && !!userId && isStudiosEnabled
    });
};
