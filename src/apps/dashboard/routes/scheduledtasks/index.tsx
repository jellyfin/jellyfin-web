import React, { useEffect, useState } from 'react';
import Page from '../../../../components/Page';
import globalize from '../../../../lib/globalize';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTasks } from '../../features/scheduledtasks/api/useTasks';
import { getCategories, getTasksByCategory } from '../../features/scheduledtasks/utils/tasks';
import Loading from '../../../../components/loading/LoadingComponent';
import Tasks from '../../features/scheduledtasks/components/Tasks';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import serverNotifications from '../../../../scripts/serverNotifications';
import Events, { Event } from '../../../../utils/events';
import ServerConnections from '../../../../components/ServerConnections';
import { ApiClient } from 'jellyfin-apiclient';

const ScheduledTasks = () => {
    const { data: initialTasks, isLoading } = useTasks({ isHidden: false });
    const [tasks, setTasks] = useState<TaskInfo[] | null>(null);

    // TODO: Replace usage of the legacy apiclient when websocket support is added to the TS SDK.
    useEffect(() => {
        const apiClient = ServerConnections.currentApiClient();
        apiClient?.sendMessage('ScheduledTasksInfoStart', '1000,1000');

        return () => {
            apiClient?.sendMessage('ScheduledTasksInfoStop', null);
        };
    }, []);

    useEffect(() => {
        const onScheduledTasksUpdate = (_e: Event, _apiClient: ApiClient, info: TaskInfo[]) => {
            setTasks(info);
        };

        if (!isLoading && !tasks && initialTasks) {
            setTasks(initialTasks);
        }

        Events.on(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);

        return () => {
            Events.off(serverNotifications, 'ScheduledTasksInfo', onScheduledTasksUpdate);
        };
    }, [isLoading, initialTasks, tasks]);

    if (isLoading || !tasks) {
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

export default ScheduledTasks;
