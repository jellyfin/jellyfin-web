import { type Api } from '@jellyfin/sdk';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

const fetchNetworkConfig = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getConfigurationApi(api).getNamedConfiguration(
        { key: 'network' },
        options
    );

    return response.data as NetworkConfiguration;
};

export const useNetworkConfig = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['NetConfig'],
        queryFn: ({ signal }) => fetchNetworkConfig(api!, { signal }),
        enabled: !!api
    });
};
