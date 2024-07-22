import type { Api } from '@jellyfin/sdk';
import type { AxiosRequestConfig } from 'axios';
import type { LiveTvApiGetChannelRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const getChannel = async (
    api: Api | undefined,
    userId: string | undefined,
    requestParameters: LiveTvApiGetChannelRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) throw new Error('No API instance available');
    if (!userId) throw new Error('No User ID provided');

    const response = await getLiveTvApi(api).getChannel(
        {
            userId,
            ...requestParameters
        },
        options
    );
    return response.data;
};

export const getChannelQuery = (
    api: Api | undefined,
    userId: string | undefined,
    requestParameters: LiveTvApiGetChannelRequest
) =>
    queryOptions({
        queryKey: ['Channel', requestParameters],
        queryFn: ({ signal }) => getChannel(api, userId, requestParameters, { signal }),
        enabled: !!api
    });

export const useGetChannel = (
    requestParameters: LiveTvApiGetChannelRequest
) => {
    const { api, user } = useApi();
    const userId = user?.Id;

    return useQuery(getChannelQuery(api, userId, requestParameters));
};
