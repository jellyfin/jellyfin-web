import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from './useApi';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import { AxiosRequestConfig } from 'axios';

const fetchSyncPlayGroups = async (
    currentApi: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (!api) throw new Error('No API instance available');

    const response = await getSyncPlayApi(api)
        .syncPlayGetGroups(options);
    return response.data;
};

export const useSyncPlayGroups = () => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [ 'SyncPlay', 'Groups' ],
        queryFn: ({ signal }) => fetchSyncPlayGroups(currentApi, { signal })
    });
};
