import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ServerPathWidget from '../components/widgets/ServerPathWidget';
import ServerInfoWidget from '../components/widgets/ServerInfoWidget';
import ActivityLogWidget from '../components/widgets/ActivityLogWidget';
import AlertsLogWidget from '../components/widgets/AlertsLogWidget';
import Stack from '@mui/material/Stack';
import useShutdownServer from '../features/system/api/useShutdownServer';
import useRestartServer from '../features/system/api/useRestartServer';
import ConfirmDialog from 'components/ConfirmDialog';
import useLiveTasks from '../features/tasks/hooks/useLiveTasks';
import RunningTasksWidget from '../components/widgets/RunningTasksWidget';
import DevicesWidget from '../components/widgets/DevicesWidget';
import { useStartTask } from '../features/tasks/api/useStartTask';
import ItemCountsWidget from '../components/widgets/ItemCountsWidget';

export const Component = () => {
    const [ isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen ] = useState(false);
    const [ isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen ] = useState(false);
    const startTask = useStartTask();
    const restartServer = useRestartServer();
    const shutdownServer = useShutdownServer();

    const { data: tasks } = useLiveTasks({ isHidden: false });

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
                confirmButtonColor='error'
            />
            <ConfirmDialog
                open={isShutdownConfirmDialogOpen}
                title={globalize.translate('ButtonShutdown')}
                text={globalize.translate('MessageConfirmShutdown')}
                onConfirm={onShutdownConfirm}
                onCancel={closeShutdownDialog}
                confirmButtonText={globalize.translate('ButtonShutdown')}
                confirmButtonColor='error'
            />
            <Box className='content-primary'>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7} lg={7} xl={6}>
                        <Stack spacing={3}>
                            <ServerInfoWidget
                                onScanLibrariesClick={onScanLibraries}
                                onRestartClick={promptRestart}
                                onShutdownClick={promptShutdown}
                            />
                            <ItemCountsWidget />
                            <RunningTasksWidget tasks={tasks} />
                            <DevicesWidget />
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={5} lg={5} xl={3}>
                        <ActivityLogWidget />
                    </Grid>
                    <Grid item xs={12} md={6} lg={12} xl={3}>
                        <Stack spacing={3}>
                            <AlertsLogWidget />
                            <ServerPathWidget />
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Page>
    );
};

Component.displayName = 'DashboardPage';
