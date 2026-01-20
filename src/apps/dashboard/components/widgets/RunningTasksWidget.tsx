import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import Sheet from '@mui/joy/Sheet';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Typography from '@mui/joy/Typography';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';

type RunningTasksWidgetProps = {
    tasks?: TaskInfo[];
};

const RunningTasksWidget = ({ tasks }: RunningTasksWidgetProps) => {
    const runningTasks = useMemo(() => {
        return tasks?.filter(v => v.State === TaskState.Running) || [];
    }, [ tasks ]);

    if (runningTasks.length === 0) return null;

    return (
        <Widget
            title={globalize.translate('HeaderRunningTasks')}
            href='/dashboard/tasks'
        >
            <Sheet
                variant="outlined"
                sx={{
                    p: 2,
                    borderRadius: 'md',
                    bgcolor: 'background.surface'
                }}
            >
                <Stack spacing={2.5}>
                    {runningTasks.map((task => (
                        <Box key={task.Id}>
                            <Typography level="body-sm" fontWeight="bold" sx={{ mb: 0.5 }}>
                                {task.Name}
                            </Typography>
                            <TaskProgress task={task} />
                        </Box>
                    )))}
                </Stack>
            </Sheet>
        </Widget>
    );
};

export default RunningTasksWidget;