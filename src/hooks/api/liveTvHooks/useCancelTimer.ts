import type { LiveTvApiCancelTimerRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useMutation } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const cancelTimer = async (
    currentApi: JellyfinApiContext,
    requestParameters: LiveTvApiCancelTimerRequest
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLiveTvApi(api).cancelTimer(requestParameters);
        return response.data;
    }
};

export const useCancelTimer = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: LiveTvApiCancelTimerRequest) =>
            cancelTimer(currentApi, requestParameters)
    });
};
