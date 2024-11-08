import type { AxiosRequestConfig } from 'axios';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getAuthProviders = async (
    apiContext: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getAuthProviders] No API instance available');

    const response = await getSessionApi(api).getAuthProviders(options);
    return response.data;
};

export const getAuthProvidersQuery = (apiContext: JellyfinApiContext) =>
    queryOptions({
        queryKey: ['AuthProviders'],
        queryFn: ({ signal }) => getAuthProviders(apiContext, { signal }),
        enabled: !!apiContext.api
    });

export const useGetAuthProviders = () => {
    const apiContext = useApi();
    return useQuery(getAuthProvidersQuery(apiContext));
};
