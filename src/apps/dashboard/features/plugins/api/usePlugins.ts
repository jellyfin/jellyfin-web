import type { Api } from '@jellyfin/sdk';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

import { QueryKey } from './queryKey';

const fetchPlugins = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getPluginApi(api).getPlugins(options);
    return response.data;
};

const getPluginsQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QueryKey.Plugins ],
    queryFn: ({ signal }) => fetchPlugins(api!, { signal }),
    enabled: !!api
});

export const usePlugins = () => {
    const { api } = useApi();
    return useQuery(getPluginsQuery(api));
};
