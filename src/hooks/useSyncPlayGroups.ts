import { useQuery } from '@tanstack/react-query';
import type { Api } from '@jellyfin/sdk/lib/api';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from './useApi';

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
        queryKey: [ 'SyncPlay', 'Groups' ],
        queryFn: ({ signal }) => fetchSyncPlayGroups(api!, { signal }),
        enabled: !!api
    });
};
