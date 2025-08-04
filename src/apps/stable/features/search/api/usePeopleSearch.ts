import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { isMovies, isTVShows } from '../utils/search';
import { PersonsApiGetPersonsRequest } from '@jellyfin/sdk/lib/generated-client/api/persons-api';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';

const fetchPeople = async (
    api: Api,
    userId: string,
    params?: PersonsApiGetPersonsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPersonsApi(api).getPersons(
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
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    const isPeopleEnabled =
        !collectionType ||
        isMovies(collectionType) ||
        isTVShows(collectionType);

    return useQuery({
        queryKey: ['Search', 'People', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) =>
            fetchPeople(
                api!,
                userId!,
                {
                    searchTerm
                },
                { signal }
            ),
        enabled: !!api && !!userId && isPeopleEnabled
    });
};
