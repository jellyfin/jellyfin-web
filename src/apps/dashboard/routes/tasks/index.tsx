import { useEffect } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { QUERY_KEY, useTasks } from '../../features/tasks/api/useTasks';
import { getCategories, getTasksByCategory } from '../../features/tasks/utils/tasks';
import Loading from 'components/loading/LoadingComponent';
import Tasks from '../../features/tasks/components/Tasks';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import { SessionMessageType } from '@jellyfin/sdk/lib/generated-client/models/session-message-type';
import serverNotifications from 'scripts/serverNotifications';
import Events, { Event } from 'utils/events';
import { ApiClient } from 'jellyfin-apiclient';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

export const Component = () => {
    const { __legacyApiClient__ } = useApi();
    const { data: tasks, isPending } = useTasks({ isHidden: false });

    // TODO: Replace usage of the legacy apiclient when websocket support is added to the TS SDK.
    useEffect(() => {
        const onScheduledTasksUpdate = (_e: Event, _apiClient: ApiClient, info: TaskInfo[]) => {
            queryClient.setQueryData([ QUERY_KEY ], info);
        };

        const fallbackInterval = setInterval(() => {
            if (!__legacyApiClient__?.isMessageChannelOpen()) {
                void queryClient.invalidateQueries({
                    queryKey: [ QUERY_KEY ]
                });
            }
        }, 1e4);

        __legacyApiClient__?.sendMessage(SessionMessageType.ScheduledTasksInfoStart, '1000,1000');
        Events.on(serverNotifications, SessionMessageType.ScheduledTasksInfo, onScheduledTasksUpdate);

        return () => {
            clearInterval(fallbackInterval);
            __legacyApiClient__?.sendMessage(SessionMessageType.ScheduledTasksInfoStop, null);
            Events.off(serverNotifications, SessionMessageType.ScheduledTasksInfo, onScheduledTasksUpdate);
        };
    }, [__legacyApiClient__]);

    if (isPending || !tasks) {
        return <Loading />;
    }

    const categories = getCategories(tasks);

    return (
        <Page
            id='scheduledTasksPage'
            title={globalize.translate('TabScheduledTasks')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Box className='readOnlyContent'>
                    <Stack spacing={3} mt={2}>
                        {categories.map(category => {
                            return <Tasks
                                key={category}
                                category={category}
                                tasks={getTasksByCategory(tasks, category)}
                            />;
                        })}
                    </Stack>
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TasksPage';
