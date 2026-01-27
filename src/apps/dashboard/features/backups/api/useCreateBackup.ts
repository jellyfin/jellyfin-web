import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import { BackupApi } from '@jellyfin/sdk/lib/generated-client/api/backup-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY } from './useBackups';
import { queryClient } from 'utils/query/queryClient';

export const useCreateBackup = () => {
    const { api } = useApi();
    // FIXME: Replace with getBackupApi when available in SDK
    const backupApi = new BackupApi(api?.configuration, undefined, api?.axiosInstance);

    return useMutation({
        mutationFn: (backupOptions: BackupOptionsDto) => (
            backupApi.createBackup({
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
