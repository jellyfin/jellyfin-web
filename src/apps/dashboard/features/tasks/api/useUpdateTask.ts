import { ScheduledTaskApiUpdateTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-task-api';
import { getScheduledTaskApi } from '@jellyfin/sdk/lib/utils/api/scheduled-task-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useTasks';

export const useUpdateTask = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ScheduledTaskApiUpdateTaskRequest) => (
            getScheduledTaskApi(api!)
                .updateTask(params)
        ),
        onSuccess: (_data, params) => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY, params.taskId ]
            });
        }
    });
};
