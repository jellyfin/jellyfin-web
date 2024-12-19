import { Api } from '@jellyfin/sdk';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

export const fetchLogOptions = async (api?: Api) => {
    if (!api) {
        console.error('[useLogOptions] No API instance available');
        return;
    }

    const response = await getConfigurationApi(api).getConfiguration();

    return response.data;
};

export const useLogOptions = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['LogOptions'],
        queryFn: () => fetchLogOptions(api),
        enabled: !!api
    });
};
