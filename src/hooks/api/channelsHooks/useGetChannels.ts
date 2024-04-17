import type { AxiosRequestConfig } from 'axios';
import type { ChannelsApiGetChannelsRequest } from '@jellyfin/sdk/lib/generated-client';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getChannels = async (
    currentApi: JellyfinApiContext,
    parametersOptions?: ChannelsApiGetChannelsRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getChannelsApi(api).getChannels(parametersOptions, options );
        return response.data.Items || [];
    }
};

export const useGetChannels = (
    parametersOptions?: ChannelsApiGetChannelsRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Channels', parametersOptions],
        queryFn: ({ signal }) =>
            getChannels(currentApi, parametersOptions, { signal })
    });
};
