import type { ScheduledTasksApiGetTasksRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Tasks';

const fetchTasks = async (api: Api, params?: ScheduledTasksApiGetTasksRequest, options?: AxiosRequestConfig) => {
    const response = await getScheduledTasksApi(api).getTasks(params, options);

    return response.data;
};

export const useTasks = (params?: ScheduledTasksApiGetTasksRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: ({ signal }) => fetchTasks(api!, params, { signal }),
        enabled: !!api
    });
};
