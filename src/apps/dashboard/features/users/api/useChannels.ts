import { type Api } from '@jellyfin/sdk';
import { type ChannelsApiGetChannelsRequest } from '@jellyfin/sdk/lib/generated-client/api/channels-api';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

const fetchChannels = async (
    api: Api,
    params?: ChannelsApiGetChannelsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getChannelsApi(api).getChannels(params, options);

    return response.data;
};

export const useChannels = (params?: ChannelsApiGetChannelsRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['Channels'],
        queryFn: ({ signal }) => fetchChannels(api!, params, { signal }),
        enabled: !!api
    });
};
