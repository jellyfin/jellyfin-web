import { vars } from '../../../../styles/tokens.css';

import React, { useCallback, useMemo } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { useVirtualFolders } from 'apps/dashboard/features/libraries/api/useVirtualFolders';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';
import { useStartTask } from 'apps/dashboard/features/tasks/api/useStartTask';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import LibraryCard from 'apps/dashboard/features/libraries/components/LibraryCard';
import Loading from 'components/loading/LoadingComponent';
import MediaLibraryCreator from 'components/mediaLibraryCreator/mediaLibraryCreator';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import { queryClient } from 'utils/query/queryClient';

const RefreshIcon = (): React.ReactElement => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
);

const AddIcon = (): React.ReactElement => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
);

export const Component = (): React.ReactElement => {
    const { data: virtualFolders, isPending: isVirtualFoldersPending } = useVirtualFolders();
    const startTask = useStartTask();
    const { data: tasks, isPending: isLiveTasksPending } = useLiveTasks({ isHidden: false });

    const librariesTask = useMemo(() => tasks?.find(value => value.Key === 'RefreshLibrary'), [tasks]);

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
    }, [startTask, librariesTask]);

    if (isVirtualFoldersPending || isLiveTasksPending) return <Loading />;

    return (
        <Page
            id="mediaLibraryPage"
            title={globalize.translate('HeaderLibraries')}
            className="mainAnimatedPage type-interior"
        >
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px', marginTop: vars.spacing['4'] }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                    <Button startDecorator={<AddIcon />} onClick={showMediaLibraryCreator}>
                        {globalize.translate('ButtonAddMediaLibrary')}
                    </Button>
                    <Button onClick={onScanLibraries} startDecorator={<RefreshIcon />} variant="outlined">
                        {globalize.translate('ButtonScanAllLibraries')}
                    </Button>
                    {librariesTask?.State == TaskState.Running && <TaskProgress task={librariesTask} />}
                </Flex>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: vars.spacing['4']
                    }}
                >
                    {virtualFolders?.map(virtualFolder => (
                        <LibraryCard key={virtualFolder?.ItemId} virtualFolder={virtualFolder} />
                    ))}
                </div>
            </Flex>
        </Page>
    );
};

Component.displayName = 'LibrariesPage';
