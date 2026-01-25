import React, { useCallback, useMemo, useState } from 'react';
import { lazy, Suspense } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { Box, Flex } from 'ui-primitives/Box';
import { Grid, gridContainer, gridGap, gridXs, gridMd, gridLg, gridXl } from 'ui-primitives/Grid';
import ServerPathWidget from '../components/widgets/ServerPathWidget';

// Lazy load widgets for code splitting
const ServerInfoWidget = lazy(() => import('../components/widgets/ServerInfoWidget'));
const ActivityLogWidget = lazy(() => import('../components/widgets/ActivityLogWidget'));
const AlertsLogWidget = lazy(() => import('../components/widgets/AlertsLogWidget'));
const RunningTasksWidget = lazy(() => import('../components/widgets/RunningTasksWidget'));
const DevicesWidget = lazy(() => import('../components/widgets/DevicesWidget'));
const ItemCountsWidget = lazy(() => import('../components/widgets/ItemCountsWidget'));

import useShutdownServer from '../features/system/api/useShutdownServer';
import useRestartServer from '../features/system/api/useRestartServer';
import ConfirmDialog from 'components/ConfirmDialog';
import useLiveTasks from '../features/tasks/hooks/useLiveTasks';
import { useStartTask } from '../features/tasks/api/useStartTask';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';

const WidgetLoader = () => (
    <Box style={{ height: 200, backgroundColor: 'var(--joy-palette-background-surface)', borderRadius: 8 }} />
);

export const Component = () => {
    const [ isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen ] = useState(false);
    const [ isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen ] = useState(false);
    const startTask = useStartTask();
    const restartServer = useRestartServer();
    const shutdownServer = useShutdownServer();

    const { data: tasks } = useLiveTasks({ isHidden: false });

    const librariesTask = useMemo(() => (
        tasks?.find((value) => value.Key === 'RefreshLibrary')
    ), [ tasks ]);

    const promptRestart = useCallback(() => {
        setIsRestartConfirmDialogOpen(true);
    }, []);

    const closeRestartDialog = useCallback(() => {
        setIsRestartConfirmDialogOpen(false);
    }, []);

    const promptShutdown = useCallback(() => {
        setIsShutdownConfirmDialogOpen(true);
    }, []);

    const closeShutdownDialog = useCallback(() => {
        setIsShutdownConfirmDialogOpen(false);
    }, []);

    const onScanLibraries = useCallback(() => {
        const scanLibrariesTask = tasks?.find((value) => value.Key === 'RefreshLibrary');

        if (scanLibrariesTask?.Id) {
            startTask.mutate({
                taskId: scanLibrariesTask.Id
            });
        }
    }, [ startTask, tasks ]);

    const onRestartConfirm = useCallback(() => {
        restartServer.mutate();
        setIsRestartConfirmDialogOpen(false);
    }, [ restartServer ]);

    const onShutdownConfirm = useCallback(() => {
        shutdownServer.mutate();
        setIsShutdownConfirmDialogOpen(false);
    }, [ shutdownServer ]);

    return (
        <Page
            id='dashboardPage'
            title={globalize.translate('TabDashboard')}
            className='mainAnimatedPage type-interior'
        >
            <ConfirmDialog
                open={isRestartConfirmDialogOpen}
                title={globalize.translate('Restart')}
                text={globalize.translate('MessageConfirmRestart')}
                onConfirm={onRestartConfirm}
                onCancel={closeRestartDialog}
                confirmButtonText={globalize.translate('Restart')}
                confirmButtonColor='danger'
            />
            <ConfirmDialog
                open={isShutdownConfirmDialogOpen}
                title={globalize.translate('ButtonShutdown')}
                text={globalize.translate('MessageConfirmShutdown')}
                onConfirm={onShutdownConfirm}
                onCancel={closeShutdownDialog}
                confirmButtonText={globalize.translate('ButtonShutdown')}
                confirmButtonColor='danger'
            />
            <Box style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
                <Grid
                    className={`${gridContainer} ${gridGap.lg}`}
                >
                    <Grid className={`${gridXs[12]} ${gridMd[7]} ${gridLg[7]} ${gridXl[6]}`}>
                        <Box className={`${Flex} ${Flex.col}`} style={{ gap: 24 }}>
                            <Suspense fallback={<WidgetLoader />}>
                                <ServerInfoWidget
                                    onScanLibrariesClick={onScanLibraries}
                                    onRestartClick={promptRestart}
                                    onShutdownClick={promptShutdown}
                                    isScanning={librariesTask?.State !== TaskState.Idle}
                                />
                            </Suspense>
                            <Suspense fallback={<WidgetLoader />}>
                                <ItemCountsWidget />
                            </Suspense>
                            <Suspense fallback={<WidgetLoader />}>
                                <RunningTasksWidget tasks={tasks} />
                            </Suspense>
                            <Suspense fallback={<WidgetLoader />}>
                                <DevicesWidget />
                            </Suspense>
                        </Box>
                    </Grid>
                    <Grid className={`${gridXs[12]} ${gridMd[5]} ${gridLg[5]} ${gridXl[3]}`}>
                        <Suspense fallback={<WidgetLoader />}>
                            <ActivityLogWidget />
                        </Suspense>
                    </Grid>
                    <Grid className={`${gridXs[12]} ${gridMd[6]} ${gridLg[12]} ${gridXl[3]}`}>
                        <Box className={`${Flex} ${Flex.col}`} style={{ gap: 24 }}>
                            <Suspense fallback={<WidgetLoader />}>
                                <AlertsLogWidget />
                            </Suspense>
                            <ServerPathWidget />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Page>
    );
};

Component.displayName = 'DashboardPage';
