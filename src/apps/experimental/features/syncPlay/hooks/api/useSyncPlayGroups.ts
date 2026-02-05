import { useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk/lib/api';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = [ 'SyncPlay', 'Groups' ];

const fetchSyncPlayGroups = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getSyncPlayApi(api)
        .syncPlayGetGroups(options);
    return response.data;
};

export const useSyncPlayGroups = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: ({ signal }) => fetchSyncPlayGroups(api!, { signal }),
        refetchInterval: 30 * 1000, // Refresh every 30 seconds
        enabled: !!api
    });
};
