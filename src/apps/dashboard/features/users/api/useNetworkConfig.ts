import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosRequestConfig } from 'axios';

const fetchNetworkConfig = async (api?: Api, options?: AxiosRequestConfig) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getConfigurationApi(api).getNamedConfiguration({ key: 'network' }, options);

    return response.data as NetworkConfiguration;
};

export const useNetworkConfig = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'NetConfig' ],
        queryFn: ({ signal }) => fetchNetworkConfig(api, { signal }),
        enabled: !!api
    });
};
