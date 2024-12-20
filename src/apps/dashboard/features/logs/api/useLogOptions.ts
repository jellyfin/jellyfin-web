import { Api } from '@jellyfin/sdk';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const fetchLogOptions = async (api?: Api, options?: AxiosRequestConfig) => {
    if (!api) {
        console.error('[useLogOptions] No API instance available');
        return;
    }

    const response = await getConfigurationApi(api).getConfiguration(options);

    return response.data;
};

export const useLogOptions = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['LogOptions'],
        queryFn: ({ signal }) => fetchLogOptions(api, { signal }),
        enabled: !!api
    });
};
