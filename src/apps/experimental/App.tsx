import React, { useCallback, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { ThemeProvider } from '@mui/material/styles';

import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';

import AppToolbar from './components/AppToolbar';
import AppUserMenu from './components/AppUserMenu';
import ElevationScroll from './components/ElevationScroll';
import { ExperimentalAppRoutes } from './routes/AppRoutes';
import theme from './theme';

import './AppOverrides.scss';

const ExperimentalApp = () => {
    const [ userMenuAnchorEl, setUserMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback((event) => {
        setUserMenuAnchorEl(event.currentTarget);
    }, [ setUserMenuAnchorEl ]);

    const onUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, [ setUserMenuAnchorEl ]);

    return (
        <ThemeProvider theme={theme}>
            <Backdrop />

            <div style={{ display: 'none' }}>
                {/*
                  * TODO: These components are not used, but views interact with them directly so the need to be
                  * present in the dom. We add them in a hidden element to prevent errors.
                  */}
                <AppHeader />
            </div>

            <Box sx={{ display: 'flex' }}>
                <ElevationScroll>
                    <AppBar
                        position='fixed'
                        sx={{ zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1 }}
                    >
                        <AppToolbar
                            onUserButtonClick={onUserButtonClick}
                        />
                    </AppBar>
                </ElevationScroll>

                <Box
                    component='main'
                    sx={{
                        width: '100%',
                        flexGrow: 1,
                        transition: theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen
                        }),
                        marginLeft: 0
                    }}
                >
                    <div className='mainAnimatedPages skinBody' />
                    <div className='skinBody'>
                        <ExperimentalAppRoutes />
                    </div>
                </Box>

                <AppUserMenu
                    open={isUserMenuOpen}
                    anchorEl={userMenuAnchorEl}
                    onMenuClose={onUserMenuClose}
                />
            </Box>
        </ThemeProvider>
    );
};

export default ExperimentalApp;
