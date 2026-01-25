import React, { type FC, StrictMode, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from '@tanstack/react-router';

import AppBody from 'components/AppBody';
import { DRAWER_WIDTH } from 'components/ResponsiveDrawer';
import AppToolbar from 'components/toolbar/AppToolbar';
import ServerButton from 'components/toolbar/ServerButton';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { Box, Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

import AppTabs from './components/AppTabs';
import AppDrawer from './components/drawer/AppDrawer';
import HelpButton from './components/toolbar/HelpButton';
import { DASHBOARD_APP_PATHS } from './routes/routes';

import './AppOverrides.scss';

export const Component: FC = () => {
    const [isDrawerActive, setIsDrawerActive] = useState(false);
    const location = useLocation();
    const { user } = useApi();

    const isMetadataManager = location.pathname.startsWith(`/${DASHBOARD_APP_PATHS.MetadataManager}`);
    const isDrawerAvailable = Boolean(user) && !isMetadataManager;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [isDrawerActive, setIsDrawerActive]);

    useEffect(() => {
        document.body.classList.add('dashboardDocument');

        return () => {
            document.body.classList.remove('dashboardDocument');
        };
    }, []);

    return (
        <Flex style={{ minHeight: '100vh', display: 'flex' }}>
            <StrictMode>
                <Box
                    component="header"
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        left: isDrawerAvailable ? `${DRAWER_WIDTH}px` : '0',
                        zIndex: vars.zIndex.sticky,
                        backgroundColor: vars.colors.surface,
                        borderBottom: '1px solid',
                        borderColor: vars.colors.divider
                    }}
                >
                    <AppToolbar
                        isBackButtonAvailable={appRouter.canGoBack()}
                        isDrawerOpen={isDrawerOpen}
                        onDrawerButtonClick={onToggleDrawer}
                        buttons={<HelpButton />}
                    >
                        {isMetadataManager && <ServerButton />}

                        <AppTabs isDrawerOpen={isDrawerOpen} />
                    </AppToolbar>
                </Box>

                {isDrawerAvailable && (
                    <AppDrawer open={isDrawerOpen} onClose={onToggleDrawer} onOpen={onToggleDrawer} />
                )}
            </StrictMode>

            <Box
                component="main"
                style={{
                    width: '100%',
                    flexGrow: 1,
                    paddingTop: '64px',
                    backgroundColor: vars.colors.background
                }}
            >
                <AppBody>
                    <Outlet />
                </AppBody>
            </Box>
        </Flex>
    );
};
