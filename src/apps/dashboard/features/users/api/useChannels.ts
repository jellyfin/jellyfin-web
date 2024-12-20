import { Api } from '@jellyfin/sdk';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getChannelsApi } from '@jellyfin/sdk/lib/utils/api/channels-api';
import { ChannelsApiGetChannelsRequest } from '@jellyfin/sdk/lib/generated-client/api/channels-api';

const fetchChannels = async (api?: Api, params?: ChannelsApiGetChannelsRequest) => {
    if (!api) {
        console.error('[useAuthProvider] No Api instance available');
        return;
    }

    const response = await getChannelsApi(api).getChannels(params);

    return response.data;
};

export const useChannels = (params?: ChannelsApiGetChannelsRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'Channels' ],
        queryFn: () => fetchChannels(api, params),
        enabled: !!api
    });
};
