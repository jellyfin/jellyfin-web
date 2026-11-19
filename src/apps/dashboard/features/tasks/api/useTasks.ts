import type { ScheduledTaskApiGetTasksRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-task-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getScheduledTaskApi } from '@jellyfin/sdk/lib/utils/api/scheduled-task-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Tasks';

const fetchTasks = async (
    api: Api,
    params?: ScheduledTaskApiGetTasksRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getScheduledTaskApi(api).getTasks(params, options);

    return response.data;
};

export const useTasks = (params?: ScheduledTaskApiGetTasksRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) =>
            fetchTasks(api!, params, { signal }),
        enabled: !!api
    });
};
