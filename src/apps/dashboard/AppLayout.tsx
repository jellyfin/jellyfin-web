import AppBar from '@mui/material/AppBar/AppBar';
import Box from '@mui/material/Box/Box';
import { type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { FC, StrictMode, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import AppToolbar from 'components/toolbar/AppToolbar';
import ServerButton from 'components/toolbar/ServerButton';
import ElevationScroll from 'components/ElevationScroll';
import { DRAWER_WIDTH } from 'components/ResponsiveDrawer';
import { appRouter } from 'components/router/appRouter';
import ThemeCss from 'components/ThemeCss';
import { useApi } from 'hooks/useApi';
import { useLocale } from 'hooks/useLocale';

import AppTabs from './components/AppTabs';
import AppDrawer from './components/drawer/AppDrawer';
import HelpButton from './components/toolbar/HelpButton';
import { DASHBOARD_APP_PATHS } from './routes/routes';

import './AppOverrides.scss';

export const Component: FC = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const location = useLocation();
    const { user } = useApi();
    const { dateFnsLocale } = useLocale();

    const isMediumScreen = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
    const isMetadataManager = location.pathname.startsWith(`/${DASHBOARD_APP_PATHS.MetadataManager}`);
    const isDrawerAvailable = Boolean(user) && !isMetadataManager;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    // Update body class
    useEffect(() => {
        document.body.classList.add('dashboardDocument');

        return () => {
            document.body.classList.remove('dashboardDocument');
        };
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateFnsLocale}>
            <Box sx={{ display: 'flex' }}>
                <StrictMode>
                    <ElevationScroll elevate={false}>
                        <AppBar
                            position='fixed'
                            sx={{
                                width: {
                                    xs: '100%',
                                    md: isDrawerAvailable ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%'
                                },
                                ml: {
                                    xs: 0,
                                    md: isDrawerAvailable ? DRAWER_WIDTH : 0
                                }
                            }}
                        >
                            <AppToolbar
                                isBackButtonAvailable={appRouter.canGoBack()}
                                isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                                isDrawerOpen={isDrawerOpen}
                                onDrawerButtonClick={onToggleDrawer}
                                buttons={
                                    <HelpButton />
                                }
                            >
                                {isMetadataManager && (
                                    <ServerButton />
                                )}

                                <AppTabs isDrawerOpen={isDrawerOpen} />
                            </AppToolbar>
                        </AppBar>
                    </ElevationScroll>

                    {
                        isDrawerAvailable && (
                            <AppDrawer
                                open={isDrawerOpen}
                                onClose={onToggleDrawer}
                                onOpen={onToggleDrawer}
                            />
                        )
                    }
                </StrictMode>

                <Box
                    component='main'
                    sx={{
                        width: '100%',
                        flexGrow: 1
                    }}
                >
                    <AppBody>
                        <Outlet />
                    </AppBody>
                </Box>
            </Box>
            <ThemeCss dashboard />
        </LocalizationProvider>
    );
};
