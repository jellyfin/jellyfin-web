import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY } from './useSyncPlayGroups';

export const useLeaveSyncPlayGroup = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: () => getSyncPlayApi(api!).syncPlayLeaveGroup(),
        onSuccess: () => {
            // Invalidate any queries related to SyncPlay groups
            void queryClient.invalidateQueries({
                queryKey: QUERY_KEY
            });
        }
    });
};
