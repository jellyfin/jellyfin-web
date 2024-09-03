import type { AxiosRequestConfig } from 'axios';
import type { LiveTvApiGetTimersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getTimers = async (
    apiContext: JellyfinApiContext,
    params?: LiveTvApiGetTimersRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;
    if (!api) throw new Error('No API instance available');
    const response = await getLiveTvApi(api).getTimers(params, options);

    return response.data;
};

export const getTimersQuery = (
    apiContext: JellyfinApiContext,
    params?: LiveTvApiGetTimersRequest
) =>
    queryOptions({
        queryKey: ['Timers', params],
        queryFn: ({ signal }) => getTimers(apiContext, params, { signal }),
        enabled: !!apiContext.api
    });

export const useGetTimers = (params?: LiveTvApiGetTimersRequest) => {
    const apiContext = useApi();
    return useQuery(getTimersQuery(apiContext, params));
};
