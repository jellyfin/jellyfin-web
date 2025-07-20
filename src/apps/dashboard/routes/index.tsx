import React, { useCallback, useState } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import ServerPathWidget from '../components/widgets/ServerPathWidget';
import ServerInfoWidget from '../components/widgets/ServerInfoWidget';
import ActivityLogWidget from '../components/widgets/ActivityLogWidget';
import AlertsLogWidget from '../components/widgets/AlertsLogWidget';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
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
    const theme = useTheme();
    const isMedium = useMediaQuery(theme.breakpoints.only('md'));
    const isExtraLarge = useMediaQuery(theme.breakpoints.only('xl'));
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
                    <Grid size={{ xs: 12, md: 12, lg: 8, xl: 6 }}>
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
                    <Grid size={{ xs: 12, md: 6, lg: 4, xl: 3 }}>
                        <ActivityLogWidget />
                    </Grid>
                    {isMedium || isExtraLarge ? (
                        <Grid size={{ md: 6, xl: 3 }}>
                            <Stack spacing={3}>
                                <AlertsLogWidget />
                                <ServerPathWidget />
                            </Stack>
                        </Grid>
                    ) : (
                        <Grid size={12}>
                            <Stack spacing={3}>
                                <AlertsLogWidget />
                                <ServerPathWidget />
                            </Stack>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Page>
    );
};

Component.displayName = 'DashboardPage';
