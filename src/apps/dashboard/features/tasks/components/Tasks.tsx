import React, { FunctionComponent } from 'react';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import List from '@mui/joy/List';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import Sheet from '@mui/joy/Sheet';
import Task from './Task';

type TasksProps = {
    category: string;
    tasks: TaskInfo[];
};

const Tasks: FunctionComponent<TasksProps> = ({ category, tasks }: TasksProps) => {
    return (
        <Stack spacing={2}>
            <Typography level='h3'>{category}</Typography>
            <Sheet
                variant="outlined"
                sx={{
                    borderRadius: 'md',
                    overflow: 'hidden'
                }}
            >
                <List
                    sx={{
                        '--ListItem-paddingY': '12px',
                        '--ListItem-paddingX': '16px',
                        bgcolor: 'background.surface'
                    }}
                >
                    {tasks.map((task, index) => (
                        <React.Fragment key={task.Id}>
                            <Task task={task} />
                            {index < tasks.length - 1 && <div style={{ height: 1, backgroundColor: 'var(--joy-palette-divider)' }} />}
                        </React.Fragment>
                    ))}
                </List>
            </Sheet>
        </Stack>
    );
};

export default Tasks;