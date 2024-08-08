import type { LiveTvApiCancelSeriesTimerRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const cancelSeriesTimer = async (
    currentApi: JellyfinApiContext,
    requestParameters: LiveTvApiCancelSeriesTimerRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLiveTvApi(api).cancelSeriesTimer(requestParameters);
        return response.data;
    }
};

export const useCancelSeriesTimer = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: LiveTvApiCancelSeriesTimerRequest) =>
            cancelSeriesTimer(currentApi, requestParameters)
    });
};
