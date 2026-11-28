import type { Api } from '@jellyfin/sdk';
import type { ConfigurationPageInfo } from '@jellyfin/sdk/lib/generated-client/models/configuration-page-info';
import type { PluginApiGetConfigurationPagesRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

import { QueryKey } from './queryKey';

export const fetchConfigurationPages = async (
    api: Api,
    params?: PluginApiGetConfigurationPagesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPluginApi(api)
        .getConfigurationPages(params, options);

    // A 200 with an empty or non-JSON body comes back from axios as a string.
    // Throw so it is not cached (and persisted) as the page list.
    if (!Array.isArray(response.data)) {
        throw new TypeError('Invalid configuration pages response: expected an array');
    }

    return response.data;
};

// Data restored from the persisted cache does not pass through the query function,
// so a value cached by an older version can still be invalid.
export const selectConfigurationPages = (data: unknown): ConfigurationPageInfo[] => (
    Array.isArray(data) ? data as ConfigurationPageInfo[] : []
);

const getConfigurationPagesQuery = (
    api?: Api,
    params?: PluginApiGetConfigurationPagesRequest
) => queryOptions({
    queryKey: [ QueryKey.ConfigurationPages, params?.enableInMainMenu ],
    queryFn: ({ signal }) => fetchConfigurationPages(api!, params, { signal }),
    select: selectConfigurationPages,
    enabled: !!api
});

export const useConfigurationPages = (
    params?: PluginApiGetConfigurationPagesRequest
) => {
    const { api } = useApi();
    return useQuery(getConfigurationPagesQuery(api, params));
};
