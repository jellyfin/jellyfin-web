import React, { FunctionComponent, useCallback } from 'react';
import ListItem from '@mui/material/ListItem';
import Avatar from '@mui/material/Avatar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Dashboard from 'utils/dashboard';
import { TaskProps } from '../types/taskProps';
import TaskProgress from './TaskProgress';
import TaskLastRan from './TaskLastRan';
import IconButton from '@mui/material/IconButton';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import { useStartTask } from '../api/useStartTask';
import { useStopTask } from '../api/useStopTask';

const Task: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const startTask = useStartTask();
    const stopTask = useStopTask();

    const navigateTaskEdit = useCallback(() => {
        Dashboard.navigate(`/dashboard/tasks/edit?id=${task.Id}`)
            .catch(err => {
                console.error('[Task] failed to navigate to task edit page', err);
            });
    }, [task]);

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
            <ListItemButton onClick={navigateTaskEdit}>
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
            </ListItemButton>
        </ListItem>
    );
};

export default Task;
