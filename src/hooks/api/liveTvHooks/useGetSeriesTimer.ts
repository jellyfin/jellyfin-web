import type { LiveTvApiGetSeriesTimerRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getSeriesTimer = async (
    apiContext: JellyfinApiContext,
    params: LiveTvApiGetSeriesTimerRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getSeriesTimer] No API instance available');

    const response = await getLiveTvApi(api).getSeriesTimer(params, options);
    return response.data;
};

export const getSeriesTimerQuery = (
    apiContext: JellyfinApiContext,
    params: LiveTvApiGetSeriesTimerRequest
) =>
    queryOptions({
        queryKey: ['SeriesTimer', params.timerId],
        queryFn: ({ signal }) => getSeriesTimer(apiContext, params, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id && !!params.timerId
    });

export const useGetSeriesTimer = (requestParameters: LiveTvApiGetSeriesTimerRequest) => {
    const apiContext = useApi();
    return useQuery(getSeriesTimerQuery(apiContext, requestParameters));
};
