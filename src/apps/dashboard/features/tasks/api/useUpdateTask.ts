import { type ScheduledTasksApiUpdateTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useTasks';

export const useUpdateTask = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ScheduledTasksApiUpdateTaskRequest) => getScheduledTasksApi(api!).updateTask(params),
        onSuccess: (_data, params) => {
            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY, params.taskId]
            });
        }
    });
};
