import { getBackupApi } from '@jellyfin/sdk/lib/utils/api/backup-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const useRestoreBackup = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (fileName: string) => (
            getBackupApi(api!).startRestoreBackup({
                backupRestoreRequestDto: {
                    ArchiveFileName: fileName
                }
            })
        )
    });
};
