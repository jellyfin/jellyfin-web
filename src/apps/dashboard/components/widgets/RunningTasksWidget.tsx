import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import Paper from '@mui/material/Paper';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Typography from '@mui/material/Typography/Typography';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import Box from '@mui/material/Box/Box';
import Stack from '@mui/material/Stack/Stack';

type RunningTasksWidgetProps = {
    tasks?: TaskInfo[];
};

const RunningTasksWidget = ({ tasks }: RunningTasksWidgetProps) => {
    const runningTasks = useMemo(() => {
        return tasks?.filter(v => v.State == TaskState.Running) || [];
    }, [ tasks ]);

    if (runningTasks.length == 0) return null;

    return (
        <Widget
            title={globalize.translate('HeaderRunningTasks')}
            href='/dashboard/tasks'
        >
            <Paper sx={{ padding: 2 }}>
                <Stack spacing={2} maxWidth={'330px'}>
                    {runningTasks.map((task => (
                        <Box key={task.Id}>
                            <Typography>{task.Name}</Typography>
                            <TaskProgress task={task} />
                        </Box>
                    )))}
                </Stack>
            </Paper>
        </Widget>
    );
};

export default RunningTasksWidget;
