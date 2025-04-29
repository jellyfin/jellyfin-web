import React, { FunctionComponent, useCallback } from 'react';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { TaskProps } from '../types/taskProps';
import TaskProgress from './TaskProgress';
import TaskLastRan from './TaskLastRan';
import IconButton from '@mui/material/IconButton';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import { useStartTask } from '../api/useStartTask';
import { useStopTask } from '../api/useStopTask';
import ListItemLink from 'components/ListItemLink';

const Task: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const startTask = useStartTask();
    const stopTask = useStopTask();

    const handleStartTask = useCallback(() => {
        if (task.Id) {
            startTask.mutate({ taskId: task.Id });
        }
    }, [task, startTask]);

    const handleStopTask = useCallback(() => {
        if (task.Id) {
            stopTask.mutate({ taskId: task.Id });
        }
    }, [task, stopTask]);

    return (
        <ListItem
            disablePadding
            secondaryAction={
                <IconButton onClick={task.State == 'Running' ? handleStopTask : handleStartTask}>
                    {task.State == 'Running' ? <Stop /> : <PlayArrow />}
                </IconButton>
            }
        >
            <ListItemLink to={`/dashboard/tasks/${task.Id}`}>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AccessTimeIcon sx={{ color: '#fff' }} />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={<Typography variant='h3'>{task.Name}</Typography>}
                    secondary={task.State == 'Running' ? <TaskProgress task={task} /> : <TaskLastRan task={task} />}
                    disableTypography
                />
            </ListItemLink>
        </ListItem>
    );
};

export default Task;
