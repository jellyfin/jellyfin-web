import React, { useCallback, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Page from '@/components/Page';
import { useNamedConfiguration } from '@/hooks/useNamedConfiguration';
import type { LiveTvOptions } from '@jellyfin/sdk/lib/generated-client/models/live-tv-options';
import globalize from '@/lib/globalize';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Loading from '@/components/loading/LoadingComponent';
import TunerDeviceCard from '@/apps/dashboard/features/livetv/components/TunerDeviceCard';
import useLiveTasks from '@/apps/dashboard/features/tasks/hooks/useLiveTasks';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { useStartTask } from '@/apps/dashboard/features/tasks/api/useStartTask';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import TaskProgress from '@/apps/dashboard/features/tasks/components/TaskProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import Provider from '@/apps/dashboard/features/livetv/components/Provider';
import Grid from '@mui/material/Grid';

const CONFIG_KEY = 'livetv';

export const Component = () => {
    const navigate = useNavigate();
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
    const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const startTask = useStartTask();

    const navigateToSchedulesDirect = useCallback(() => {
        navigate('/dashboard/livetv/guide?type=schedulesdirect');
    }, [ navigate ]);

    const navigateToXMLTV = useCallback(() => {
        navigate('/dashboard/livetv/guide?type=xmltv');
    }, [ navigate ]);

    const showProviderMenu = useCallback(() => {
        setAnchorEl(providerButtonRef.current);
        setIsMenuOpen(true);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    const refreshGuideTask = useMemo(() => (
        tasks?.find((value) => value.Key === 'RefreshGuide')
    ), [ tasks ]);

    const refreshGuideData = useCallback(() => {
        if (refreshGuideTask?.Id) {
            startTask.mutate({
                taskId: refreshGuideTask.Id
            });
        }
    }, [ startTask, refreshGuideTask ]);

    if (isConfigPending || isTasksPending) return <Loading />;

    return (
        <Page
            id='liveTvStatusPage'
            title={globalize.translate('LiveTV')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                {(isConfigError || isTasksError) ? (
                    <Alert severity='error'>{globalize.translate('HeaderError')}</Alert>
                ) : (
                    <Stack spacing={3}>
                        <Typography variant='h2'>{globalize.translate('HeaderTunerDevices')}</Typography>

                        <Button
                            sx={{ alignSelf: 'flex-start' }}
                            startIcon={<AddIcon />}
                            component={Link}
                            to='/dashboard/livetv/tuner'
                        >
                            {globalize.translate('ButtonAddTunerDevice')}
                        </Button>

                        <Box>
                            <Grid container spacing={2}>
                                {config.TunerHosts?.map(tunerHost => (
                                    <Grid
                                        key={tunerHost.Id}
                                        item
                                        xs={12}
                                        sm={6}
                                        md={3}
                                        lg={2.4}
                                    >
                                        <TunerDeviceCard
                                            key={tunerHost.Id}
                                            tunerHost={tunerHost}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Typography variant='h2'>{globalize.translate('HeaderGuideProviders')}</Typography>

                        <Stack sx={{ alignSelf: 'flex-start' }} spacing={2}>
                            <Stack direction='row' spacing={1.5}>
                                <Button
                                    sx={{ alignSelf: 'flex-start' }}
                                    startIcon={<AddIcon />}
                                    onClick={showProviderMenu}
                                    ref={providerButtonRef}
                                >
                                    {globalize.translate('ButtonAddProvider')}
                                </Button>
                                <Button
                                    sx={{ alignSelf: 'flex-start' }}
                                    startIcon={<RefreshIcon />}
                                    variant='outlined'
                                    onClick={refreshGuideData}
                                    loading={refreshGuideTask && refreshGuideTask.State === TaskState.Running}
                                    loadingPosition='start'
                                >
                                    {globalize.translate('ButtonRefreshGuideData')}
                                </Button>
                            </Stack>

                            {(refreshGuideTask && refreshGuideTask.State === TaskState.Running) && (
                                <TaskProgress task={refreshGuideTask} />
                            )}
                        </Stack>

                        <Menu
                            anchorEl={anchorEl}
                            open={isMenuOpen}
                            onClose={onMenuClose}
                        >
                            <MenuItem onClick={navigateToSchedulesDirect}>
                                <ListItemText>Schedules Direct</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={navigateToXMLTV}>
                                <ListItemText>XMLTV</ListItemText>
                            </MenuItem>
                        </Menu>

                        {(config.ListingProviders && config.ListingProviders?.length > 0) && (
                            <List sx={{ backgroundColor: 'background.paper' }}>
                                {config.ListingProviders?.map(provider => (
                                    <Provider
                                        key={provider.Id}
                                        provider={provider}
                                    />
                                ))}
                            </List>
                        )}
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'LiveTvPage';
