import React, { FunctionComponent, useCallback } from 'react';
import ListItem from '@mui/joy/ListItem';
import Avatar from '@mui/joy/Avatar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import { TaskProps } from '../types/taskProps';
import TaskProgress from './TaskProgress';
import TaskLastRan from './TaskLastRan';
import IconButton from '@mui/joy/IconButton';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import { useStartTask } from '../api/useStartTask';
import { useStopTask } from '../api/useStopTask';
import ListItemLink from 'components/ListItemLink';

const Task: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const startTask = useStartTask();
    const stopTask = useStopTask();

    const handleStartTask = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (task.Id) {
            startTask.mutate({ taskId: task.Id });
        }
    }, [task, startTask]);

    const handleStopTask = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (task.Id) {
            stopTask.mutate({ taskId: task.Id });
        }
    }, [task, stopTask]);

    const isRunning = task.State === 'Running';

    return (
        <ListItem
            endAction={
                <IconButton
                    variant="plain"
                    color={isRunning ? "danger" : "primary"}
                    onClick={isRunning ? handleStopTask : handleStartTask}
                >
                    {isRunning ? <Stop /> : <PlayArrow />}
                </IconButton>
            }
            sx={{ p: 0 }}
        >
            <ListItemLink to={`/dashboard/tasks/${task.Id}`} sx={{ width: '100%', py: 1.5, px: 2 }}>
                <ListItemDecorator>
                    <Avatar variant="soft" color="primary">
                        <AccessTimeIcon />
                    </Avatar>
                </ListItemDecorator>
                <ListItemContent>
                    <Typography level="title-md">{task.Name}</Typography>
                    <Box component="div">
                        {isRunning ? <TaskProgress task={task} /> : <TaskLastRan task={task} />}
                    </Box>
                </ListItemContent>
            </ListItemLink>
        </ListItem>
    );
};

import Box from '@mui/joy/Box';

export default Task;