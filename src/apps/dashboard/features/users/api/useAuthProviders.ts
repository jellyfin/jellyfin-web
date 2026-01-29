import { type Api } from '@jellyfin/sdk';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

const fetchAuthProviders = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getSessionApi(api).getAuthProviders(options);

    return response.data;
};

export const useAuthProviders = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['AuthProviders'],
        queryFn: ({ signal }) => fetchAuthProviders(api!, { signal }),
        enabled: !!api
    });
};
