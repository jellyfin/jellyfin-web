import type { LiveTvOptions } from '@jellyfin/sdk/lib/generated-client/models/live-tv-options';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Provider from 'apps/dashboard/features/livetv/components/Provider';
import TunerDeviceCard from 'apps/dashboard/features/livetv/components/TunerDeviceCard';
import { useStartTask } from 'apps/dashboard/features/tasks/api/useStartTask';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import globalize from 'lib/globalize';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Alert, Button, Flex, Menu, MenuContent, MenuItem, MenuTrigger, Text } from 'ui-primitives';

const RefreshIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label="Refresh"
    >
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
);

const AddIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Add">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
);

const CONFIG_KEY = 'livetv';

export const Component = (): React.ReactElement => {
    const {
        data: config,
        isPending: isConfigPending,
        isError: isConfigError
    } = useNamedConfiguration<LiveTvOptions>(CONFIG_KEY);
    const {
        data: tasks,
        isPending: isTasksPending,
        isError: isTasksError
    } = useLiveTasks({ isHidden: false });
    const providerButtonRef = useRef<HTMLButtonElement | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const startTask = useStartTask();

    const navigateToSchedulesDirect = useCallback(() => {
        window.location.href = '/dashboard/livetv/guide?type=schedulesdirect';
    }, []);

    const navigateToXMLTV = useCallback(() => {
        window.location.href = '/dashboard/livetv/guide?type=xmltv';
    }, []);

    const showProviderMenu = useCallback(() => {
        setAnchorEl(providerButtonRef.current);
        setIsMenuOpen(true);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    const refreshGuideTask = useMemo(
        () => tasks?.find((value) => value.Key === 'RefreshGuide'),
        [tasks]
    );

    const refreshGuideData = useCallback(() => {
        if (refreshGuideTask?.Id) {
            startTask.mutate({
                taskId: refreshGuideTask.Id
            });
        }
    }, [startTask, refreshGuideTask]);

    if (isConfigPending || isTasksPending) return <Loading />;

    return (
        <Page
            id="liveTvStatusPage"
            title={globalize.translate('LiveTV')}
            className="mainAnimatedPage type-interior"
        >
            <Flex className="content-primary" style={{ flexDirection: 'column', gap: '24px' }}>
                {isConfigError || isTasksError ? (
                    <Alert variant="error">{globalize.translate('HeaderError')}</Alert>
                ) : (
                    <Flex style={{ flexDirection: 'column', gap: '24px' }}>
                        <Text as="h2" size="lg" weight="bold">
                            {globalize.translate('HeaderTunerDevices')}
                        </Text>

                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            startDecorator={<AddIcon />}
                            onClick={() => {
                                window.location.href = '/dashboard/livetv/tuner';
                            }}
                        >
                            {globalize.translate('ButtonAddTunerDevice')}
                        </Button>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: vars.spacing['4']
                            }}
                        >
                            {config.TunerHosts?.map((tunerHost) => (
                                <TunerDeviceCard key={tunerHost.Id} tunerHost={tunerHost} />
                            ))}
                        </div>

                        <Text as="h2" size="lg" weight="bold">
                            {globalize.translate('HeaderGuideProviders')}
                        </Text>

                        <Flex
                            style={{
                                alignSelf: 'flex-start',
                                flexDirection: 'column',
                                gap: vars.spacing['4']
                            }}
                        >
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                <Button
                                    style={{ alignSelf: 'flex-start' }}
                                    startDecorator={<AddIcon />}
                                    onClick={showProviderMenu}
                                    ref={providerButtonRef as React.RefObject<HTMLButtonElement>}
                                >
                                    {globalize.translate('ButtonAddProvider')}
                                </Button>
                                <Button
                                    style={{ alignSelf: 'flex-start' }}
                                    startDecorator={<RefreshIcon />}
                                    variant="outlined"
                                    onClick={refreshGuideData}
                                >
                                    {globalize.translate('ButtonRefreshGuideData')}
                                </Button>
                            </Flex>

                            {refreshGuideTask?.State === TaskState.Running && (
                                <TaskProgress task={refreshGuideTask} />
                            )}
                        </Flex>

                        <Menu
                            open={isMenuOpen}
                            onOpenChange={(open) => !open && onMenuClose()}
                            trigger={
                                <MenuTrigger>
                                    <button
                                        type="button"
                                        ref={
                                            providerButtonRef as React.RefObject<HTMLButtonElement>
                                        }
                                        style={{ display: 'none' }}
                                    />
                                </MenuTrigger>
                            }
                        >
                            <MenuContent>
                                <MenuItem onClick={navigateToSchedulesDirect}>
                                    Schedules Direct
                                </MenuItem>
                                <MenuItem onClick={navigateToXMLTV}>XMLTV</MenuItem>
                            </MenuContent>
                        </Menu>

                        {config.ListingProviders && config.ListingProviders?.length > 0 && (
                            <div style={{ backgroundColor: 'var(--colors-surface)' }}>
                                {config.ListingProviders?.map((provider) => (
                                    <Provider key={provider.Id} provider={provider} />
                                ))}
                            </div>
                        )}
                    </Flex>
                )}
            </Flex>
        </Page>
    );
};

Component.displayName = 'LiveTvPage';
