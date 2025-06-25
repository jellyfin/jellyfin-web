import { FunctionComponent } from 'react';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Task from './Task';

type TasksProps = {
    category: string;
    tasks: TaskInfo[];
};

const Tasks: FunctionComponent<TasksProps> = ({ category, tasks }: TasksProps) => {
    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{category}</Typography>
            <List sx={{ bgcolor: 'background.paper' }}>
                {tasks.map(task => {
                    return <Task
                        key={task.Id}
                        task={task}
                    />;
                })}
            </List>
        </Stack>
    );
};

export default Tasks;
