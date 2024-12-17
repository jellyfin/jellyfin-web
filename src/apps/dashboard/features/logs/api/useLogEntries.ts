import { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const fetchLogEntries = async (api?: Api) => {
    if (!api) {
        console.error('[useLogEntries] No API instance available');
        return;
    }

    const response = await getSystemApi(api).getServerLogs();

    return response.data;
};

export const useLogEntries = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'LogEntries' ],
        queryFn: () => fetchLogEntries(api),
        enabled: !!api
    });
};
