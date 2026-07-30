import type { SystemApiGetLogEntriesRequest } from '@jellyfin/sdk/lib/generated-client/api/system-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

const fetchLogEntries = async (
    api: Api,
    requestParams?: SystemApiGetLogEntriesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getSystemApi(api).getLogEntries(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useLogEntries = (
    requestParams: SystemApiGetLogEntriesRequest
) => {
    const { api } = useApi();
    return useQuery({
        queryKey: ['ActivityLogEntries', requestParams],
        queryFn: ({ signal }) =>
            fetchLogEntries(api!, requestParams, { signal }),
        enabled: !!api,
        refetchOnMount: false,
        staleTime: 0 // ensure we load the latest log entries
    });
};
