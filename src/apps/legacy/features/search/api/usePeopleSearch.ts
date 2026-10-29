import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { isMovies, isTVShows } from '../utils/search';
import { PersonApiGetPersonsRequest } from '@jellyfin/sdk/lib/generated-client/api/person-api';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';

const fetchPeople = async (
    api: Api,
    userId: string,
    params?: PersonApiGetPersonsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPersonApi(api).getPersons(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};

export const usePeopleSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string,
    params?: PersonApiGetPersonsRequest
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    const isPeopleEnabled = (!collectionType || isMovies(collectionType) || isTVShows(collectionType));

    return useQuery({
        queryKey: ['Search', 'People', collectionType, parentId, searchTerm, params],
        queryFn: ({ signal }) => fetchPeople(
            api!,
            userId!,
            {
                searchTerm,
                ...params
            },
            { signal }
        ),
        enabled: !!api && !!userId && isPeopleEnabled
    });
};
