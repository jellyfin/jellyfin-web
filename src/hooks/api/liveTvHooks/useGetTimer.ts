import type { AxiosRequestConfig } from 'axios';
import type { LiveTvApiGetTimerRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from '@/hooks/useApi';

const getTimer = async (
    currentApi: JellyfinApiContext,
    params: LiveTvApiGetTimerRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;

    if (!api) throw new Error('[getTimer] No API instance available');

    const response = await getLiveTvApi(api).getTimer(params, options);
    return response.data;
};

export const getTimerQuery = (
    apiContext: JellyfinApiContext,
    params: LiveTvApiGetTimerRequest
) =>
    queryOptions({
        queryKey: ['Timer', params.timerId],
        queryFn: ({ signal }) => getTimer(apiContext, params, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id && !!params.timerId
    });

export const useGetTimer = (requestParameters: LiveTvApiGetTimerRequest) => {
    const apiContext = useApi();
    return useQuery(getTimerQuery(apiContext, requestParameters));
};
