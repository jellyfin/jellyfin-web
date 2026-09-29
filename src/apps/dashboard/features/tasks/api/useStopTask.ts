import { ScheduledTaskApiStartTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-task-api';
import { getScheduledTaskApi } from '@jellyfin/sdk/lib/utils/api/scheduled-task-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useTasks';

export const useStopTask = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ScheduledTaskApiStartTaskRequest) => (
            getScheduledTaskApi(api!)
                .stopTask(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
