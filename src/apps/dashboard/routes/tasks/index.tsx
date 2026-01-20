import React from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import { getCategories, getTasksByCategory } from '../../features/tasks/utils/tasks';
import Loading from 'components/loading/LoadingComponent';
import Tasks from '../../features/tasks/components/Tasks';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';

export const Component = () => {
    const { data: tasks, isPending } = useLiveTasks({ isHidden: false });

    if (isPending || !tasks) {
        return <Loading />;
    }

    const categories = getCategories(tasks);

    return (
        <Page
            id='scheduledTasksPage'
            title={globalize.translate('TabScheduledTasks')}
            className='mainAnimatedPage type-interior'
        >
            <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
                <Stack spacing={4}>
                    {categories.map(category => {
                        return <Tasks
                            key={category}
                            category={category}
                            tasks={getTasksByCategory(tasks, category)}
                        />;
                    })}
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'TasksPage';