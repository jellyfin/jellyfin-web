import type { ActivityLogApiGetLogEntriesRequest } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosRequestConfig } from 'axios';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { useQuery } from '@tanstack/react-query';

import { JellyfinApiContext, useApi } from './useApi';

const fetchGetLogEntries = async (
    currentApi: JellyfinApiContext,
    requestParams: ActivityLogApiGetLogEntriesRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;

    if (!api) return;

    const response = await getActivityLogApi(api).getLogEntries(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useLogEntires = (
    requestParams: ActivityLogApiGetLogEntriesRequest
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['LogEntries', requestParams],
        queryFn: ({ signal }) =>
            fetchGetLogEntries(currentApi, requestParams, { signal })
    });
};
