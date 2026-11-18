import { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const QUERY_KEY = 'Configuration';

export const fetchConfiguration = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getSystemApi(api).getConfiguration(options);

    return response.data;
};

export const useConfiguration = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchConfiguration(api!, { signal }),
        enabled: !!api
    });
};
