import type { AxiosRequestConfig } from 'axios';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getPasswordResetProviders = async (
    apiContext: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getPasswordResetProviders] No API instance available');

    const response = await getSessionApi(api).getPasswordResetProviders(
        options
    );
    return response.data;
};

export const getPasswordResetProvidersQuery = (
    apiContext: JellyfinApiContext
) =>
    queryOptions({
        queryKey: ['PasswordResetProviders'],
        queryFn: ({ signal }) =>
            getPasswordResetProviders(apiContext, { signal }),
        enabled: !!apiContext.api
    });

export const useGetPasswordResetProviders = () => {
    const apiContext = useApi();
    return useQuery(getPasswordResetProvidersQuery(apiContext));
};
