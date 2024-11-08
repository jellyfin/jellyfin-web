import type { AxiosRequestConfig } from 'axios';
import type { ConfigurationApiGetNamedConfigurationRequest } from '@jellyfin/sdk/lib/generated-client';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getNamedConfiguration = async (
    apiContext: JellyfinApiContext,
    params: ConfigurationApiGetNamedConfigurationRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getNamedConfiguration] No API instance available');

    const response = await getConfigurationApi(api).getNamedConfiguration(
        params,
        options
    );
    return response.data;
};

export const getNamedConfigurationQuery = (
    apiContext: JellyfinApiContext,
    params: ConfigurationApiGetNamedConfigurationRequest
) =>
    queryOptions({
        queryKey: ['NamedConfiguration', params],
        queryFn: ({ signal }) =>
            getNamedConfiguration(apiContext, params, {
                signal
            }),
        enabled: !!apiContext.api && !!params.key
    });

export const useGetNamedConfiguration = (
    params: ConfigurationApiGetNamedConfigurationRequest
) => {
    const apiContext = useApi();
    return useQuery(getNamedConfigurationQuery(apiContext, params));
};
