import React, { useCallback, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Page from 'components/Page';
import { useNamedConfiguration } from 'hooks/useNamedConfiguration';
import type { LiveTvOptions } from '@jellyfin/sdk/lib/generated-client/models/live-tv-options';
import globalize from 'lib/globalize';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Loading from 'components/loading/LoadingComponent';
import TunerDeviceCard from 'apps/dashboard/features/livetv/components/TunerDeviceCard';
import useLiveTasks from 'apps/dashboard/features/tasks/hooks/useLiveTasks';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DvrIcon from '@mui/icons-material/Dvr';
import { Form, Link, useNavigate } from 'react-router-dom';
import { useStartTask } from 'apps/dashboard/features/tasks/api/useStartTask';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemLink from 'components/ListItemLink';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import getProviderConfigurationUrl from 'apps/dashboard/features/livetv/utils/getProviderConfigurationUrl';
import getProviderName from 'apps/dashboard/features/livetv/utils/getProviderName';

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
                <Form>
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

                            <Stack direction='row' spacing={2}>
                                { config.TunerHosts?.map(tunerHost => (
                                    <TunerDeviceCard
                                        key={tunerHost.Id}
                                        tunerHost={tunerHost}
                                    />
                                )) }
                            </Stack>

                            <Typography variant='h2'>{globalize.translate('HeaderGuideProviders')}</Typography>

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
                                >
                                    {globalize.translate('ButtonRefreshGuideData')}
                                </Button>
                            </Stack>

                            {(refreshGuideTask && refreshGuideTask.State === TaskState.Running) && (
                                <TaskProgress task={refreshGuideTask} />
                            )}
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

                            <List sx={{ backgroundColor: 'background.paper' }}>
                                {config.ListingProviders?.map(provider => (
                                    <ListItem disablePadding key={provider.Id}>
                                        <ListItemLink to={getProviderConfigurationUrl(provider.Type || '') + '&id=' + provider.Id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <DvrIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={getProviderName(provider.Type)}
                                                secondary={provider.Path || provider.ListingsId}
                                                slotProps={{
                                                    primary: {
                                                        variant: 'h3'
                                                    },
                                                    secondary: {
                                                        variant: 'body1'
                                                    }
                                                }}
                                            />
                                        </ListItemLink>
                                    </ListItem>
                                ))}
                            </List>
                        </Stack>
                    )}
                </Form>
            </Box>
        </Page>
    );
};

Component.displayName = 'LiveTvPage';
