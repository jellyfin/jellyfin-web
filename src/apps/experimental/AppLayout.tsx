import React, { useCallback, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import ElevationScroll from 'components/ElevationScroll';
import { DRAWER_WIDTH } from 'components/ResponsiveDrawer';
import { useApi } from 'hooks/useApi';

import AppToolbar from './components/AppToolbar';
import AppDrawer, { isDrawerPath } from './components/drawers/AppDrawer';

import './AppOverrides.scss';

const AppLayout = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const { user } = useApi();
    const location = useLocation();

    const isMediumScreen = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
    const isDrawerAvailable = isDrawerPath(location.pathname) && Boolean(user);
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    return (
        <Box sx={{ display: 'flex' }}>
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
                        isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                        isDrawerOpen={isDrawerOpen}
                        onDrawerButtonClick={onToggleDrawer}
                    />
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
    );
};

export default AppLayout;
