import React, { useCallback, useMemo } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Stack from '@mui/material/Stack/Stack';
import { useVirtualFolders } from 'apps/dashboard/features/libraries/api/useVirtualFolders';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';
import { useStartTask } from 'apps/dashboard/features/tasks/api/useStartTask';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Grid from '@mui/material/Grid/Grid';
import LibraryCard from 'apps/dashboard/features/libraries/components/LibraryCard';
import Loading from 'components/loading/LoadingComponent';
import MediaLibraryCreator from 'components/mediaLibraryCreator/mediaLibraryCreator';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import { queryClient } from 'utils/query/queryClient';
import RefreshIcon from '@mui/icons-material/Refresh';
import Add from '@mui/icons-material/Add';

export const Component = () => {
    const { data: virtualFolders, isPending: isVirtualFoldersPending } = useVirtualFolders();
    const startTask = useStartTask();
    const { data: tasks, isPending: isLiveTasksPending } = useLiveTasks({ isHidden: false });

    const librariesTask = useMemo(() => (
        tasks?.find((value) => value.Key === 'RefreshLibrary')
    ), [ tasks ]);

    const showMediaLibraryCreator = useCallback(() => {
        const mediaLibraryCreator = new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions(),
            refresh: true
        }) as Promise<boolean>;

        void mediaLibraryCreator.then((hasChanges: boolean) => {
            if (hasChanges) {
                void queryClient.invalidateQueries({
                    queryKey: ['VirtualFolders']
                });
            }
        });
    }, []);

    const onScanLibraries = useCallback(() => {
        if (librariesTask?.Id) {
            startTask.mutate({
                taskId: librariesTask.Id
            });
        }
    }, [ startTask, librariesTask ]);

    if (isVirtualFoldersPending || isLiveTasksPending) return <Loading />;

    return (
        <Page
            id='mediaLibraryPage'
            title={globalize.translate('HeaderLibraries')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Stack spacing={3} mt={2}>
                    <Stack direction='row' alignItems={'center'} spacing={1.5}>
                        <Button
                            startIcon={<Add />}
                            onClick={showMediaLibraryCreator}
                        >
                            {globalize.translate('ButtonAddMediaLibrary')}
                        </Button>
                        <Button
                            onClick={onScanLibraries}
                            startIcon={<RefreshIcon />}
                            loading={librariesTask && librariesTask.State !== TaskState.Idle}
                            loadingPosition='start'
                            variant='outlined'
                        >
                            {globalize.translate('ButtonScanAllLibraries')}
                        </Button>
                        {(librariesTask && librariesTask.State == TaskState.Running) && (
                            <TaskProgress task={librariesTask} />
                        )}
                    </Stack>

                    <Box>
                        <Grid container spacing={2}>
                            {virtualFolders?.map(virtualFolder => (
                                <Grid
                                    key={virtualFolder?.ItemId}
                                    item
                                    xs={12}
                                    sm={6}
                                    md={3}
                                    lg={2.4}
                                >
                                    <LibraryCard
                                        virtualFolder={virtualFolder}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'LibrariesPage';
