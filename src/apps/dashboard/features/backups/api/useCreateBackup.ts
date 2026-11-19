import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import { getBackupApi } from '@jellyfin/sdk/lib/utils/api/backup-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY } from './useBackups';

export const useCreateBackup = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (backupOptions: BackupOptionsDto) => (
            getBackupApi(api!).createBackup({
                backupOptionsDto: backupOptions
            })
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
