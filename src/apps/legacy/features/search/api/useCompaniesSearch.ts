import { Api } from '@jellyfin/sdk';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { CompanyApiGetCompaniesRequest } from '@jellyfin/sdk/lib/generated-client/api/company-api';
import { getCompanyApi } from '@jellyfin/sdk/lib/utils/api/company-api';
import { useQuery } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { isMovies, isTVShows } from '../utils/search';

const fetchCompanies = async (
    api: Api,
    userId: string,
    params?: CompanyApiGetCompaniesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getCompanyApi(api).getCompanies(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};

export const useCompaniesSearch = (
    parentId?: string,
    collectionType?: CollectionType,
    searchTerm?: string
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    const isCompaniesEnabled = (!collectionType || isMovies(collectionType) || isTVShows(collectionType));

    return useQuery({
        queryKey: ['Search', 'Companies', collectionType, parentId, searchTerm],
        queryFn: ({ signal }) => fetchCompanies(
            api!,
            userId!,
            {
                parentId,
                searchTerm
            },
            { signal }
        ),
        enabled: !!api && !!userId && isCompaniesEnabled
    });
};
