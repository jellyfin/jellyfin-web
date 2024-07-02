import type { AxiosRequestConfig } from 'axios';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getPasswordResetProviders = async (
    currentApi: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getSessionApi(api).getPasswordResetProviders(options);
        return response.data;
    }
};

export const useGetPasswordResetProviders = () => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['PasswordResetProviders'],
        queryFn: ({ signal }) =>
            getPasswordResetProviders(currentApi, { signal })
    });
};
