import { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchServerLogs = async (api?: Api, options?: AxiosRequestConfig) => {
    if (!api) {
        console.error('[useLogEntries] No API instance available');
        return;
    }

    const response = await getSystemApi(api).getServerLogs(options);

    return response.data;
};

export const useServerLogs = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'LogEntries' ],
        queryFn: ({ signal }) => fetchServerLogs(api, { signal }),
        enabled: !!api
    });
};
