import Box from '@mui/joy/Box';
import { type Theme } from '@mui/joy/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { FC, StrictMode, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import AppToolbar from 'components/toolbar/AppToolbar';
import ServerButton from 'components/toolbar/ServerButton';
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

    const isMediumScreen = useMediaQuery((t: any) => t.breakpoints.up('md'));
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
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <StrictMode>
                    <Box
                        component="header"
                        sx={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            left: {
                                xs: 0,
                                md: isDrawerAvailable ? DRAWER_WIDTH : 0
                            },
                            zIndex: 1100,
                            bgcolor: 'background.surface',
                            borderBottom: '1px solid',
                            borderColor: 'divider'
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
                    </Box>

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
                        flexGrow: 1,
                        pt: '64px', // Height of toolbar
                        bgcolor: 'background.body'
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