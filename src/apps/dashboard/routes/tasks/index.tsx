import React, { lazy } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { Box, Flex } from 'ui-primitives/Box';
import { getCategories, getTasksByCategory } from '../../features/tasks/utils/tasks';
import Loading from 'components/loading/LoadingComponent';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';

const Tasks = lazy(() => import('../../features/tasks/components/Tasks'));

const TaskLoader = (): React.ReactElement => (
    <Box style={{ height: 200, backgroundColor: 'var(--joy-palette-background-surface)', borderRadius: 8 }} />
);

export const Component = (): React.ReactElement => {
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
            <Box style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
                <Box className={`${Flex} ${Flex.col}`} style={{ gap: 32 }}>
                    {categories.map(category => {
                        return (
                            <React.Suspense key={category} fallback={<TaskLoader />}>
                                <Tasks
                                    category={category}
                                    tasks={getTasksByCategory(tasks, category)}
                                />
                            </React.Suspense>
                        );
                    })}
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TasksPage';
