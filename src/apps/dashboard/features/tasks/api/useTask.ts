import type { ScheduledTasksApiGetTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Task';

const fetchTask = async (
    api: Api,
    params: ScheduledTasksApiGetTaskRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) {
        console.warn('[fetchTasks] No API instance available');
        return;
    }

    const response = await getScheduledTasksApi(api).getTask(params, options);

    return response.data;
};

export const useTask = (params: ScheduledTasksApiGetTaskRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY, params.taskId ],
        queryFn: ({ signal }) =>
            fetchTask(api!, params, { signal }),
        enabled: !!api
    });
};
