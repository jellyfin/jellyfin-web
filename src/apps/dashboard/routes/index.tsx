import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import ConfirmDialog from 'components/ConfirmDialog';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import ServerPathWidget from '../components/widgets/ServerPathWidget';
import ServerInfoWidget from '../components/widgets/ServerInfoWidget';
import ActivityLogWidget from '../components/widgets/ActivityLogWidget';
import AlertsLogWidget from '../components/widgets/AlertsLogWidget';
import useShutdownServer from '../features/system/api/useShutdownServer';
import useRestartServer from '../features/system/api/useRestartServer';
import useLiveTasks from '../features/tasks/hooks/useLiveTasks';
import RunningTasksWidget from '../components/widgets/RunningTasksWidget';
import DevicesWidget from '../components/widgets/DevicesWidget';
import { useStartTask } from '../features/tasks/api/useStartTask';
import ItemCountsWidget from '../components/widgets/ItemCountsWidget';

export const Component = () => {
    const { api, user } = useApi();
    const [ isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen ] = useState(false);
    const [ isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen ] = useState(false);
    const startTask = useStartTask();
    const restartServer = useRestartServer();
    const shutdownServer = useShutdownServer();
    const queryClient = useQueryClient();

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

    const onClearQueues = useCallback(async () => {
        if (!api || !user?.Id) return;

        const userId = user.Id;
        const limit = 100;
        const itemIds = new Set<string>();
        let startIndex = 0;

        // Collect all pages before resetting positions, since each reset changes the results.
        while (true) {
            const { data } = await getLibraryApi(api).getResumeItems({
                userId,
                startIndex,
                limit,
                includeItemTypes: [
                    BaseItemKind.Movie,
                    BaseItemKind.Series,
                    BaseItemKind.Episode
                ],
                enableTotalRecordCount: false
            });

            const items = data.Items ?? [];
            if (items.length === 0) break;

            for (const item of items) {
                if (item.Id) itemIds.add(item.Id);
            }

            startIndex += items.length;
        }

        const userDataApi = getUserDataApi(api);

        for (const itemId of itemIds) {
            await userDataApi.updateItemUserData({
                userId,
                itemId,
                updateUserItemDataDto: {
                    PlaybackPositionTicks: 0
                }
            });
        }

        await queryClient.invalidateQueries({
            queryKey: [ 'SuggestionSectionWithItems' ]
        });
        await queryClient.invalidateQueries({
            queryKey: [ 'User', userId, 'ResumeItems' ]
        });
    }, [ api, user?.Id, queryClient ]);

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
    }, [shutdownServer]);

    // Clear the query client when the server restarts or shuts down
    useEffect(() => {
        return api?.subscribe([OutboundWebSocketMessageType.ServerRestarting, OutboundWebSocketMessageType.ServerShuttingDown], () => {
            queryClient.clear();
        });
    }, [ api, queryClient ]);

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
                                isScanning={librariesTask?.State !== TaskState.Idle}
                                onClearQueues={onClearQueues}
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
