import type { AxiosRequestConfig } from 'axios';
import type { LiveTvApiGetChannelRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getChannel = async (
    apiContext: JellyfinApiContext,
    params: LiveTvApiGetChannelRequest,
    options?: AxiosRequestConfig
) => {
    const { api, user } = apiContext;

    if (!api) throw new Error('[getChannel] No API instance available');
    if (!user?.Id) throw new Error('[getChannel] No User ID provided');

    const response = await getLiveTvApi(api).getChannel(
        {
            userId: user.Id,
            ...params
        },
        options
    );
    return response.data;
};

export const getChannelQuery = (
    apiContext: JellyfinApiContext,
    params: LiveTvApiGetChannelRequest
) =>
    queryOptions({
        queryKey: ['Channel', params.channelId],
        queryFn: ({ signal }) => getChannel(apiContext, params, { signal }),
        enabled:
            !!apiContext.api && !!apiContext.user?.Id && !!params.channelId
    });

export const useGetChannel = (params: LiveTvApiGetChannelRequest) => {
    const apiContext = useApi();
    return useQuery(getChannelQuery(apiContext, params));
};
