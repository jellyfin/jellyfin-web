import type { ActivityLogApiGetLogEntriesRequest } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

const fetchLogEntries = async (
    api: Api,
    requestParams?: ActivityLogApiGetLogEntriesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getActivityLogApi(api).getLogEntries(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useLogEntries = (requestParams: ActivityLogApiGetLogEntriesRequest) => {
    const { api } = useApi();
    return useQuery({
        queryKey: ['ActivityLogEntries', requestParams],
        queryFn: ({ signal }) => fetchLogEntries(api!, requestParams, { signal }),
        enabled: !!api,
        refetchOnMount: false
    });
};
