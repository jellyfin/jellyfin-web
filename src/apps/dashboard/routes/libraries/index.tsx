import React, { useCallback, useMemo } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Icon from '@mui/material/Icon';
import { useVirtualFolders } from 'apps/dashboard/features/libraries/api/useVirtualFolders';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';
import { useStartTask } from 'apps/dashboard/features/tasks/api/useStartTask';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Grid from '@mui/material/Grid';
import LibraryCard from 'apps/dashboard/features/libraries/components/LibraryCard';
import BaseCard from 'apps/dashboard/components/BaseCard';
import Loading from 'components/loading/LoadingComponent';
import MediaLibraryCreator from 'components/mediaLibraryCreator/mediaLibraryCreator';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import { queryClient } from 'utils/query/queryClient';
import RefreshIcon from '@mui/icons-material/Refresh';

export const Component = () => {
    const { data: virtualFolders, isPending: isVirtualFoldersPending } = useVirtualFolders();
    const startTask = useStartTask();
    const { data: tasks, isPending: isLiveTasksPending } = useLiveTasks({ isHidden: false });

    const gridLayout = useMemo(() => ({
        xs: 12,
        sm: 6,
        md: 3,
        lg: 2.4
    }), []);

    const librariesTask = useMemo(() => (
        tasks?.find((value) => value.Key === 'RefreshLibrary')
    ), [ tasks ]);

    const showMediaLibraryCreator = useCallback(() => {
        const mediaLibraryCreator = new MediaLibraryCreator({
            collectionTypeOptions: getCollectionTypeOptions()
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
                    <Stack direction='row' alignItems={'center'} spacing={2}>
                        <Button
                            onClick={onScanLibraries}
                            startIcon={<RefreshIcon />}
                            sx={{
                                alignSelf: 'flex-start',
                                fontWeight: 'bold'
                            }}
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
                                    { ...gridLayout }
                                >
                                    <LibraryCard
                                        virtualFolder={virtualFolder}
                                    />
                                </Grid>
                            ))}

                            <Grid item { ...gridLayout }>
                                <BaseCard
                                    title={globalize.translate('ButtonAddMediaLibrary')}
                                    icon={<Icon sx={{ fontSize: 70 }}>add_circle</Icon>}
                                    onClick={showMediaLibraryCreator}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'LibrariesPage';
