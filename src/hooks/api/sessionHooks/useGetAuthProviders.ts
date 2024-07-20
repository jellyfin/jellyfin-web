import type { AxiosRequestConfig } from 'axios';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getAuthProviders = async (
    currentApi: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getSessionApi(api).getAuthProviders(options);
        return response.data;
    }
};

export const useGetAuthProviders = () => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['AuthProviders'],
        queryFn: ({ signal }) => getAuthProviders(currentApi, { signal })
    });
};
