import { useEffect } from 'react';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY, useTasks } from '../api/useTasks';
import type { ScheduledTasksApiGetTasksRequest } from '@jellyfin/sdk/lib/generated-client/api/scheduled-tasks-api';
import { queryClient } from 'utils/query/queryClient';
import { type ApiClient } from 'jellyfin-apiclient';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import Events, { type Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import { SessionMessageType } from '@jellyfin/sdk/lib/generated-client/models/session-message-type';

const FALLBACK_POLL_INTERVAL_MS = 10000;

const useLiveTasks = (params: ScheduledTasksApiGetTasksRequest) => {
    const { __legacyApiClient__ } = useApi();
    const tasksQuery = useTasks(params);

    // TODO: Replace usage of the legacy apiclient when websocket support is added to the TS SDK.
    useEffect(() => {
        const onScheduledTasksUpdate = (_e: Event, _apiClient: ApiClient, info: TaskInfo[]) => {
            queryClient.setQueryData([QUERY_KEY], info);
        };

        const fallbackInterval = setInterval(() => {
            if (!__legacyApiClient__?.isMessageChannelOpen()) {
                void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEY]
                });
            }
        }, FALLBACK_POLL_INTERVAL_MS);

        __legacyApiClient__?.sendMessage(SessionMessageType.ScheduledTasksInfoStart, '1000,1000');
        Events.on(
            serverNotifications,
            SessionMessageType.ScheduledTasksInfo,
            onScheduledTasksUpdate as Parameters<typeof Events.on>[2]
        );

        return () => {
            clearInterval(fallbackInterval);
            __legacyApiClient__?.sendMessage(SessionMessageType.ScheduledTasksInfoStop, null);
            Events.off(
                serverNotifications,
                SessionMessageType.ScheduledTasksInfo,
                onScheduledTasksUpdate as Parameters<typeof Events.off>[2]
            );
        };
    }, [__legacyApiClient__]);

    return tasksQuery;
};

export default useLiveTasks;
