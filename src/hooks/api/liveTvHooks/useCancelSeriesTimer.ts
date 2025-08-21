import type { LiveTvApiCancelSeriesTimerRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const cancelSeriesTimer = async (
    apiContext: JellyfinApiContext,
    params: LiveTvApiCancelSeriesTimerRequest
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[cancelSeriesTimer] No API instance available');

    const response = await getLiveTvApi(api).cancelSeriesTimer(params);
    return response.data;
};

export const useCancelSeriesTimer = () => {
    const apiContext = useApi();
    return useMutation({
        mutationFn: (params: LiveTvApiCancelSeriesTimerRequest) =>
            cancelSeriesTimer(apiContext, params)
    });
};
