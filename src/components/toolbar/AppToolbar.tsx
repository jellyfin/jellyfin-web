import ArrowBack from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import React, { type FC, type PropsWithChildren, ReactNode } from 'react';

import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import UserMenuButton from './UserMenuButton';

import appIcon from 'assets/img/icon-transparent.png';
import { Button } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { ExpandLess } from '@mui/icons-material';
import { useSystemInfo } from 'hooks/useSystemInfo';

interface AppToolbarProps {
    buttons?: ReactNode
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick?: (event: React.MouseEvent<HTMLElement>) => void,
    isUserMenuAvailable?: boolean
}

const onBackButtonClick = () => {
    appRouter.back()
        .catch(err => {
            console.error('[AppToolbar] error calling appRouter.back', err);
        });
};

const AppToolbar: FC<PropsWithChildren<AppToolbarProps>> = ({
    buttons,
    children,
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick = () => { /* no-op */ },
    isUserMenuAvailable = true
}) => {
    const { data: systemInfo } = useSystemInfo();
    const { user } = useApi();
    const isUserLoggedIn = Boolean(user);

    const isBackButtonAvailable = false;
    // const isBackButtonAvailable = appRouter.canGoBack();

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
                    {/* <IconButton
                        size='large'
                        edge='start'
                        color='inherit'
                        aria-label={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}
                        onClick={onDrawerButtonClick}
                    >
                        <MenuIcon />
                    </IconButton> */}
                    <Button
                        variant='text'
                        size='large'
                        startIcon={
                            <Box
                                component='img'
                                src={appIcon}
                                sx={{
                                    height: '2rem'
                                }}
                            />
                        }
                        endIcon={isDrawerOpen ? <ExpandLess /> : <ExpandMore />}
                        color='inherit'
                        onClick={onDrawerButtonClick}
                        sx={{
                            fontWeight: 'normal',
                            fontSize: '1.5rem',
                            paddingTop: 0,
                            paddingBottom: 0,
                            height: '3rem',
                            flexShrink: 0,
                            '& .MuiButton-startIcon': {
                                marginRight: {
                                    xs: 0,
                                    sm: '1rem'
                                }
                            }
                        }}
                    >
                        <Box
                            component='span'
                            sx={{
                                display: {
                                    xs: 'none',
                                    sm: 'initial'
                                }
                            }}
                        >
                            {systemInfo?.ServerName || 'Jellyfin'}
                        </Box>
                    </Button>
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

            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
                {buttons}
            </Box>

            {isUserLoggedIn && isUserMenuAvailable && (
                <Box sx={{ flexGrow: 0 }}>
                    <UserMenuButton />
                </Box>
            )}
        </Toolbar>
    );
};

export default AppToolbar;
