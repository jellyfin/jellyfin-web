import { useEffect } from 'react';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY, useTasks } from '../api/useTasks';
import type { ScheduledTasksApiGetTasksRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import { queryClient } from 'utils/query/queryClient';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';

const useLiveTasks = (params: ScheduledTasksApiGetTasksRequest) => {
    const { api } = useApi();
    const tasksQuery = useTasks(params);

    useEffect(() => {
        return api?.subscribe([OutboundWebSocketMessageType.ScheduledTasksInfo], ({ Data }) => {
            queryClient.setQueryData([ QUERY_KEY ], Data ?? [])
        });
    }, []);

    return tasksQuery;
};

export default useLiveTasks;
