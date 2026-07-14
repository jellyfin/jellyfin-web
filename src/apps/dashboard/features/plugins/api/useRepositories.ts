import type { Api } from '@jellyfin/sdk';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';
import { QueryKey } from './queryKey';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';

const fetchRepositories = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getPluginApi(api)
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
