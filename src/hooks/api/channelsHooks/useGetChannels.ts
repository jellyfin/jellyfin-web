import type { AxiosRequestConfig } from 'axios';
import type { ChannelsApiGetChannelsRequest } from '@jellyfin/sdk/lib/generated-client';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getChannels = async (
    apiContext: JellyfinApiContext,
    params?: ChannelsApiGetChannelsRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getChannels] No API instance available');

    const response = await getChannelsApi(api).getChannels(params, options);
    return response.data.Items || [];
};

export const getChannelsQuery = (
    apiContext: JellyfinApiContext,
    params?: ChannelsApiGetChannelsRequest
) =>
    queryOptions({
        queryKey: ['Channels', params],
        queryFn: ({ signal }) => getChannels(apiContext, params, { signal }),
        enabled: !!apiContext.api
    });

export const useGetChannels = (params?: ChannelsApiGetChannelsRequest) => {
    const apiContext = useApi();
    return useQuery(getChannelsQuery(apiContext, params));
};
