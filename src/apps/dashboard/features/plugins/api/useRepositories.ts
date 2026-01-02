import type { Api } from '@jellyfin/sdk';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from '@/hooks/useApi';
import { QueryKey } from './queryKey';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';

const fetchRepositories = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getPackageApi(api)
        .getRepositories(options);
    return response.data;
};

const getRepositoriesQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QueryKey.Repositories ],
    queryFn: ({ signal }) => fetchRepositories(api!, { signal }),
    enabled: !!api
});

export const useRepositories = () => {
    const { api } = useApi();
    return useQuery(getRepositoriesQuery(api));
};

