import type { AxiosRequestConfig } from 'axios';
import type { ChannelsApiGetChannelsRequest } from '@jellyfin/sdk/lib/generated-client';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchGetChannels = async (
    currentApi: JellyfinApiContext,
    parametersOptions?: ChannelsApiGetChannelsRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getChannelsApi(api).getChannels(
            {
                ...parametersOptions
            },
            {
                signal: options?.signal
            }
        );
        return response.data.Items || [];
    }
};

export const useGetChannels = (
    parametersOptions?: ChannelsApiGetChannelsRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'Channels',
            {
                ...parametersOptions
            }
        ],
        queryFn: ({ signal }) =>
            fetchGetChannels(currentApi, parametersOptions, { signal })
        //enabled: !!parametersOptions.userId
    });
};
