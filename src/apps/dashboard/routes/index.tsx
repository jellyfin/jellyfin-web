import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSystemStorage } from '../features/storage/api/useSystemStorage';
import subSeconds from 'date-fns/subSeconds';
import { useLogEntries } from '../features/activity/api/useLogEntries';
import { useSystemInfo } from 'hooks/useSystemInfo';
import Loading from 'components/loading/LoadingComponent';
import useShutdownServer from '../features/system/api/useShutdownServer';
import useRestartServer from '../features/system/api/useRestartServer';
import ConfirmDialog from 'components/ConfirmDialog';
import useLiveTasks from '../features/tasks/hooks/useLiveTasks';
import RunningTasksWidget from '../components/widgets/RunningTasksWidget';
import DevicesWidget from '../components/widgets/DevicesWidget';
import useLiveSessions from '../features/sessions/hooks/useLiveSessions';
import { useStartTask } from '../features/tasks/api/useStartTask';
import Link from '@mui/material/Link';
import ItemCountsWidget from '../components/widgets/ItemCountsWidget';
import { useItemCounts } from '../features/metrics/api/useItemCounts';

export const Component = () => {
    const theme = useTheme();
    const isMedium = useMediaQuery(theme.breakpoints.only('md'));
    const isExtraLarge = useMediaQuery(theme.breakpoints.only('xl'));
    const [ isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen ] = useState(false);
    const [ isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen ] = useState(false);
    const startTask = useStartTask();
    const restartServer = useRestartServer();
    const shutdownServer = useShutdownServer();

    const { data: tasks, isPending: isTasksPending } = useLiveTasks({ isHidden: false });
    const { data: devices } = useLiveSessions();

    useEffect(() => {
        console.log('[session]', devices);
    }, [ devices ] );

    const dayBefore = useMemo(() => (
        subSeconds(new Date(), 24 * 60 * 60 * 1000).toISOString()
    ), []);

    const weekBefore = useMemo(() => (
        subSeconds(new Date(), 7 * 24 * 60 * 60 * 1000).toISOString()
    ), []);

    const { data: logs, isPending: isLogsPending } = useLogEntries({
        startIndex: 0,
        limit: 7,
        minDate: dayBefore,
        hasUserId: true
    });

    const { data: alerts, isPending: isAlertsPending } = useLogEntries({
        startIndex: 0,
        limit: 4,
        minDate: weekBefore,
        hasUserId: false
    });

    const { data: systemStorage, isPending: isSystemStoragePending } = useSystemStorage();
    const { data: systemInfo, isPending: isSystemInfoPending } = useSystemInfo();
    const { data: itemCounts, isPending: isItemCountsPending } = useItemCounts();

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

        if (scanLibrariesTask && scanLibrariesTask.Id) {
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

    const isPending = isLogsPending || isAlertsPending || isSystemStoragePending
        || isSystemInfoPending || isTasksPending || isItemCountsPending;

    if (isPending) {
        return <Loading />;
    }

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
                    <Grid size={{ xs: 12, md: 12, xl: 6 }}>
                        <Stack spacing={3}>
                            <ServerInfoWidget
                                systemInfo={systemInfo}
                                onScanLibrariesClick={onScanLibraries}
                                onRestartClick={promptRestart}
                                onShutdownClick={promptShutdown}
                            />
                            <ItemCountsWidget counts={itemCounts} />
                            <RunningTasksWidget tasks={tasks} />
                            <DevicesWidget devices={devices} />
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6, lg: 12, xl: 3 }}>
                        <ActivityLogWidget logs={logs?.Items} />
                    </Grid>
                    {isMedium || isExtraLarge ? (
                        <Grid size={{ md: 6, xl: 3 }}>
                            <Stack spacing={3}>
                                <AlertsLogWidget alerts={alerts?.Items} />
                                <ServerPathWidget systemStorage={systemStorage} />
                            </Stack>
                        </Grid>
                    ) : (
                        <>
                            <Grid size={{ xs: 12, lg: 12 }}>
                                <AlertsLogWidget alerts={alerts?.Items} />
                            </Grid>
                            <Grid size={{ xs: 12, lg: 12 }}>
                                <ServerPathWidget systemStorage={systemStorage} />
                            </Grid>
                        </>
                    )}
                </Grid>

                <Stack
                    alignItems='center'
                    marginTop={4}
                >
                    <Link
                        href='https://jellyfin.org'
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{
                            fontWeight: 'bold'
                        }}
                    >
                        Jellyfin
                    </Link>
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'DashboardPage';
