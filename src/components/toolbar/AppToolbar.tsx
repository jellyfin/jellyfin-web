import ArrowBack from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import React, { FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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
    const currentLocation = useLocation();

    const isBackButtonAvailable = appRouter.canGoBack();

    // Handles a specific case to hide the user menu on the select server page while authenticated
    const isUserMenuAvailable = currentLocation.pathname !== '/selectserver.html';

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
