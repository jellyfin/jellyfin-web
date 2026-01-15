import { BackupApi } from '@jellyfin/sdk/lib/generated-client/api/backup-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

export const useRestoreBackup = () => {
    const { api } = useApi();
    // FIXME: Replace with getBackupApi when available in SDK
    const backupApi = new BackupApi(api?.configuration, undefined, api?.axiosInstance);

    return useMutation({
        mutationFn: (fileName: string) => (
            backupApi.startRestoreBackup({
                backupRestoreRequestDto: {
                    ArchiveFileName: fileName
                }
            })
        )
    });
};
