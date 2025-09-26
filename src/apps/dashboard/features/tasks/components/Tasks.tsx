import React, { FunctionComponent } from 'react';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Task from './Task';
import globalize from '../../../../../lib/globalize';

type TasksProps = {
    category: string;
    tasks: TaskInfo[];
};

const Tasks: FunctionComponent<TasksProps> = ({ category, tasks }: TasksProps) => {
    // Try to translate the category name, fallback to original if no translation exists
    const getTranslatedCategory = (categoryName: string) => {
        // Common task categories that need translation
        const categoryTranslations: { [key: string]: string } = {
            'Application': globalize.translate('Application'),
            'Live TV': globalize.translate('LiveTV'),
            'Maintenance': globalize.translate('Maintenance'),
            'Media': globalize.translate('Media'),
            'System': globalize.translate('System')
        };
        
        return categoryTranslations[categoryName] || categoryName;
    };

    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{getTranslatedCategory(category)}</Typography>
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
