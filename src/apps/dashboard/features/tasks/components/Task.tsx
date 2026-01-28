import React, { type FunctionComponent, useCallback } from 'react';
import { ClockIcon, PlayIcon, StopIcon } from '@radix-ui/react-icons';
import { type TaskProps } from '../types/taskProps';
import TaskProgress from './TaskProgress';
import TaskLastRan from './TaskLastRan';
import { useStartTask } from '../api/useStartTask';
import { useStopTask } from '../api/useStopTask';
import ListItemLink from 'components/ListItemLink';
import { ListItem } from 'ui-primitives';
import { ListItemButton } from 'ui-primitives';
import { ListItemDecorator } from 'ui-primitives';
import { ListItemContent } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Avatar } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { Box } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

const Task: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const startTask = useStartTask();
    const stopTask = useStopTask();

    const handleStartTask = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (task.Id) {
                startTask.mutate({ taskId: task.Id });
            }
        },
        [task, startTask]
    );

    const handleStopTask = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (task.Id) {
                stopTask.mutate({ taskId: task.Id });
            }
        },
        [task, stopTask]
    );

    const isRunning = task.State === 'Running';

    return (
        <ListItem
            endAction={
                <IconButton
                    variant="plain"
                    color={isRunning ? 'danger' : 'primary'}
                    onClick={isRunning ? handleStopTask : handleStartTask}
                >
                    {isRunning ? <StopIcon /> : <PlayIcon />}
                </IconButton>
            }
            style={{ padding: 0 }}
        >
            <ListItemLink
                to={`/dashboard/tasks/${task.Id}`}
                style={{
                    width: '100%',
                    paddingTop: vars.spacing['4'],
                    paddingBottom: vars.spacing['4'],
                    paddingLeft: vars.spacing['5'],
                    paddingRight: vars.spacing['5']
                }}
            >
                <ListItemDecorator>
                    <Avatar variant="soft" color="primary">
                        <ClockIcon />
                    </Avatar>
                </ListItemDecorator>
                <ListItemContent>
                    <Heading.H5>{task.Name}</Heading.H5>
                    <Box component="div">{isRunning ? <TaskProgress task={task} /> : <TaskLastRan task={task} />}</Box>
                </ListItemContent>
            </ListItemLink>
        </ListItem>
    );
};

export default Task;
