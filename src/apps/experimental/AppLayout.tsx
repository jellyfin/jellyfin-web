import React, { useCallback, useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import ElevationScroll from 'components/ElevationScroll';
import { DRAWER_WIDTH } from 'components/ResponsiveDrawer';
import { useApi } from 'hooks/useApi';
import { useLocalStorage } from 'hooks/useLocalStorage';

import AppToolbar from './components/AppToolbar';
import AppDrawer, { isDrawerPath } from './components/drawers/AppDrawer';

import './AppOverrides.scss';

interface ExperimentalAppSettings {
    isDrawerPinned: boolean
}

const DEFAULT_EXPERIMENTAL_APP_SETTINGS: ExperimentalAppSettings = {
    isDrawerPinned: false
};

const AppLayout = () => {
    const [ appSettings, setAppSettings ] = useLocalStorage<ExperimentalAppSettings>('ExperimentalAppSettings', DEFAULT_EXPERIMENTAL_APP_SETTINGS);
    const [ isDrawerActive, setIsDrawerActive ] = useState(appSettings.isDrawerPinned);
    const { user } = useApi();
    const location = useLocation();
    const theme = useTheme();

    const isDrawerAvailable = isDrawerPath(location.pathname);
    const isDrawerOpen = isDrawerActive && isDrawerAvailable && Boolean(user);

    useEffect(() => {
        if (isDrawerActive !== appSettings.isDrawerPinned) {
            setAppSettings({
                ...appSettings,
                isDrawerPinned: isDrawerActive
            });
        }
    }, [ appSettings, isDrawerActive, setAppSettings ]);

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    return (
        <Box sx={{ display: 'flex' }}>
            <ElevationScroll elevate={isDrawerOpen}>
                <AppBar
                    position='fixed'
                    sx={{ zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1 }}
                >
                    <AppToolbar
                        isDrawerOpen={isDrawerOpen}
                        onDrawerButtonClick={onToggleDrawer}
                    />
                </AppBar>
            </ElevationScroll>

            <AppDrawer
                open={isDrawerOpen}
                onClose={onToggleDrawer}
                onOpen={onToggleDrawer}
            />

            <Box
                component='main'
                sx={{
                    width: '100%',
                    flexGrow: 1,
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen
                    }),
                    marginLeft: 0,
                    ...(isDrawerAvailable && {
                        marginLeft: {
                            sm: `-${DRAWER_WIDTH}px`
                        }
                    }),
                    ...(isDrawerActive && {
                        transition: theme.transitions.create('margin', {
                            easing: theme.transitions.easing.easeOut,
                            duration: theme.transitions.duration.enteringScreen
                        }),
                        marginLeft: 0
                    })
                }}
            >
                <AppBody>
                    <Outlet />
                </AppBody>
            </Box>
        </Box>
    );
};

export default AppLayout;
