import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import { Paper } from 'ui-primitives/Paper';
import { Text } from 'ui-primitives/Text';
import { Box, Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

interface RunningTasksWidgetProps {
    tasks?: TaskInfo[];
}

const RunningTasksWidget = ({ tasks }: RunningTasksWidgetProps): React.ReactElement | null => {
    const runningTasks = useMemo(() => {
        return tasks?.filter(v => v.State === TaskState.Running) ?? [];
    }, [tasks]);

    if (runningTasks.length === 0) return null;

    return (
        <Widget title={globalize.translate('HeaderRunningTasks')} href="/dashboard/tasks">
            <Paper
                variant="outlined"
                style={{
                    padding: vars.spacing['5'],
                    borderRadius: vars.borderRadius.md,
                    backgroundColor: vars.colors.surface
                }}
            >
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                    {runningTasks.map(task => (
                        <Box key={task.Id}>
                            <Text
                                size="sm"
                                style={{ fontWeight: vars.typography.fontWeightBold, marginBottom: vars.spacing['2'] }}
                            >
                                {task.Name}
                            </Text>
                            <TaskProgress task={task} />
                        </Box>
                    ))}
                </Flex>
            </Paper>
        </Widget>
    );
};

export default RunningTasksWidget;
