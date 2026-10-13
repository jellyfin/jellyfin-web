import { Api } from '@jellyfin/sdk';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const QUERY_KEY = 'StartupConfiguration';

export const fetchConfiguration = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getStartupApi(api).getStartupConfiguration(options);

    return response.data;
};

export const useStartupConfiguration = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchConfiguration(api!, { signal }),
        enabled: !!api
    });
};
