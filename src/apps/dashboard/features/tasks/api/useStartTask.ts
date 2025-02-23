import { ScheduledTasksApiStartTaskRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import { getScheduledTasksApi } from '@jellyfin/sdk/lib/utils/api/scheduled-tasks-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QueryKey } from './queryKey';

export const useStartTask = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: ScheduledTasksApiStartTaskRequest) => (
            getScheduledTasksApi(api!)
                .startTask(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Tasks ]
            });
        }
    });
};
