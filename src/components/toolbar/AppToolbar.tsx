import ArrowBack from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { FC, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import appIcon from 'assets/img/icon-transparent.png';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';

import UserMenuButton from './UserMenuButton';

interface AppToolbarProps {
    buttons?: ReactNode
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const onBackButtonClick = () => {
    appRouter.back()
        .catch(err => {
            console.error('[AppToolbar] error calling appRouter.back', err);
        });
};

const AppToolbar: FC<AppToolbarProps> = ({
    buttons,
    children,
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick
}) => {
    const { user } = useApi();
    const isUserLoggedIn = Boolean(user);

    const isBackButtonAvailable = appRouter.canGoBack();

    //handle the case where the user is on the select server page
    let isUserMenuAvailable = true;
    const currentLocation = useLocation();
    if (currentLocation.pathname == '/selectserver.html') {
        isUserMenuAvailable = false;
    } 

 
    return (
        <Toolbar
            variant='dense'
            sx={{
                flexWrap: {
                    xs: 'wrap',
                    lg: 'nowrap'
                }
            }}
        >
            {isUserLoggedIn && isDrawerAvailable && (
                <Tooltip title={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}>
                    <IconButton
                        size='large'
                        edge='start'
                        color='inherit'
                        aria-label={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}
                        onClick={onDrawerButtonClick}
                    >
                        <MenuIcon />
                    </IconButton>
                </Tooltip>
            )}

            {isBackButtonAvailable && (
                <Tooltip title={globalize.translate('ButtonBack')}>
                    <IconButton
                        size='large'
                        // Set the edge if the drawer button is not shown
                        edge={!(isUserLoggedIn && isDrawerAvailable) ? 'start' : undefined}
                        color='inherit'
                        aria-label={globalize.translate('ButtonBack')}
                        onClick={onBackButtonClick}
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>
            )}

            <Box
                component={Link}
                to='/'
                color='inherit'
                aria-label={globalize.translate('Home')}
                sx={{
                    ml: 2,
                    display: 'inline-flex',
                    textDecoration: 'none'
                }}
            >
                <Box
                    component='img'
                    src={appIcon}
                    sx={{
                        height: '2rem',
                        marginInlineEnd: 1
                    }}
                />
                <Typography
                    variant='h6'
                    noWrap
                    component='div'
                    sx={{ display: { xs: 'none', sm: 'inline-block' } }}
                >
                    Jellyfin
                </Typography>
            </Box>

            {children}

            {isUserLoggedIn && isUserMenuAvailable && (
                <>
                    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
                        {buttons}
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        <UserMenuButton />
                    </Box>
                </>
            )}
        </Toolbar>
    );
};

export default AppToolbar;
