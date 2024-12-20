import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client';

const fetchNetworkConfig = async (api?: Api) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getConfigurationApi(api).getNamedConfiguration({ key: 'network' });

    return response.data as NetworkConfiguration;
};

export const useNetworkConfig = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'NetConfig' ],
        queryFn: () => fetchNetworkConfig(api),
        enabled: !!api
    });
};
