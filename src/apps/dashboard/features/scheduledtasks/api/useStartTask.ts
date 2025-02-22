import { ScheduledTasksApiStartTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useTasks';

export const useStartTask = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ScheduledTasksApiStartTaskRequest) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            getScheduledTasksApi(api!)
                .startTask(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
