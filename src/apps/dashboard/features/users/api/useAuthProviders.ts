import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import type { AxiosRequestConfig } from 'axios';

const fetchAuthProviders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getSessionApi(api).getAuthProviders(options);

    return response.data;
};

export const useAuthProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'AuthProviders' ],
        queryFn: ({ signal }) => fetchAuthProviders(api!, { signal }),
        enabled: !!api
    });
};
