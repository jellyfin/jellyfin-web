import type { AxiosRequestConfig } from 'axios';
import type { ConfigurationApiGetNamedConfigurationRequest } from '@jellyfin/sdk/lib/generated-client';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getNamedConfiguration = async (
    currentApi: JellyfinApiContext,
    parametersOptions: ConfigurationApiGetNamedConfigurationRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getConfigurationApi(api).getNamedConfiguration(
            parametersOptions,
            options
        );
        return response.data;
    }
};

export const useGetNamedConfiguration = (
    parametersOptions: ConfigurationApiGetNamedConfigurationRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['NamedConfiguration', parametersOptions],
        queryFn: ({ signal }) =>
            getNamedConfiguration(currentApi, parametersOptions, {
                signal
            }),
        enabled: !!parametersOptions.key
    });
};
