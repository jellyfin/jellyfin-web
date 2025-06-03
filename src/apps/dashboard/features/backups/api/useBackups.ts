import { Api } from '@jellyfin/sdk';
import { BackupApi } from '@jellyfin/sdk/lib/generated-client/api/backup-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Backups';

const fetchBackups = async (api: Api, options?: AxiosRequestConfig) => {
    // FIXME: Replace with getBackupApi when available in SDK
    const backupApi = new BackupApi(api.configuration, undefined, api.axiosInstance);

    const response = await backupApi.listBackups(options);

    return response.data;
};

export const useBackups = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) =>
            fetchBackups(api!, { signal }),
        enabled: !!api
    });
};
