/**
 * React-query hook for listing joinable SyncPlay groups.
 *
 * Notes:
 * - Uses the V2 route (`/SyncPlay/V2/List`) as the authoritative list source.
 * - Adds a cache-busting query arg to avoid stale intermediary caches.
 */
import { useQuery } from '@tanstack/react-query';
import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';

import { useApi } from './useApi';

const fetchSyncPlayGroups = async (
    apiClient: ApiClient
) => {
    const url = apiClient.getUrl('SyncPlay/V2/List', { _: Date.now() });
    return await apiClient.getJSON(url) as GroupInfoDto[];
};

interface UseSyncPlayGroupsOptions {
    enabled?: boolean
    refetchInterval?: number | false
}

export const useSyncPlayGroups = (options: UseSyncPlayGroupsOptions = {}) => {
    const { __legacyApiClient__ } = useApi();
    const {
        enabled = true,
        refetchInterval = false
    } = options;

    return useQuery({
        queryKey: [ 'SyncPlay', 'Groups' ],
        queryFn: () => fetchSyncPlayGroups(__legacyApiClient__!),
        enabled: !!__legacyApiClient__ && enabled,
        refetchInterval
    });
};
