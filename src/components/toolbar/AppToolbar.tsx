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

interface AppToolbarProps {
    buttons?: ReactNode;
    isDrawerAvailable: boolean;
    isDrawerOpen: boolean;
    onDrawerButtonClick?: (event: React.MouseEvent<HTMLElement>) => void;
    isBackButtonAvailable?: boolean;
    isUserMenuAvailable?: boolean;
}

const onBackButtonClick = () => {
    appRouter.back().catch((err) => {
        console.error('[AppToolbar] error calling appRouter.back', err);
    });
};

const AppToolbar: FC<PropsWithChildren<AppToolbarProps>> = ({
    buttons,
    children,
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick = () => {
        /* no-op */
    },
    isBackButtonAvailable = false,
    isUserMenuAvailable = true
}) => {
    const { user } = useApi();
    const isUserLoggedIn = Boolean(user);

    return (
        <Toolbar
            variant='dense'
            sx={{
                flexWrap: 'wrap',
                pl: {
                    xs: 'max(16px, env(safe-area-inset-left))',
                    sm: 'max(24px, env(safe-area-inset-left))'
                },
                pr: {
                    xs: 'max(16px, env(safe-area-inset-left))',
                    sm: 'max(24px, env(safe-area-inset-left))'
                }
            }}
        >
            {isUserLoggedIn && isDrawerAvailable && (
                <Tooltip
                    title={globalize.translate(
                        isDrawerOpen ? 'MenuClose' : 'MenuOpen'
                    )}
                >
                    <IconButton
                        size='large'
                        edge='start'
                        color='inherit'
                        aria-label={globalize.translate(
                            isDrawerOpen ? 'MenuClose' : 'MenuOpen'
                        )}
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
                        edge={
                            !(isUserLoggedIn && isDrawerAvailable)
                                ? 'start'
                                : undefined
                        }
                        color='inherit'
                        aria-label={globalize.translate('ButtonBack')}
                        onClick={onBackButtonClick}
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>
            )}

            {children}

            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    justifyContent: 'flex-end'
                }}
            >
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
