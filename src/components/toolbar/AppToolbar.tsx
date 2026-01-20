import ArrowBack from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import Stack from '@mui/joy/Stack';
import React, { type FC, type PropsWithChildren, ReactNode } from 'react';

import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import UserMenuButton from './UserMenuButton';

interface AppToolbarProps {
    buttons?: ReactNode
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick?: (event: React.MouseEvent<HTMLElement>) => void
    isBackButtonAvailable?: boolean
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
    isBackButtonAvailable = false,
    isUserMenuAvailable = true
}) => {
    const { user } = useApi();
    const isUserLoggedIn = Boolean(user);

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
                minHeight: '64px',
                px: {
                    xs: 'max(16px, env(safe-area-inset-left))',
                    sm: 'max(24px, env(safe-area-inset-left))'
                },
                flexWrap: {
                    xs: 'wrap',
                    lg: 'nowrap'
                }
            }}
        >
            {isUserLoggedIn && isDrawerAvailable && (
                <Tooltip title={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')} variant="soft">
                    <IconButton
                        variant="plain"
                        color="neutral"
                        aria-label={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}
                        onClick={onDrawerButtonClick}
                    >
                        <MenuIcon />
                    </IconButton>
                </Tooltip>
            )}

            {isBackButtonAvailable && (
                <Tooltip title={globalize.translate('ButtonBack')} variant="soft">
                    <IconButton
                        variant="plain"
                        color="neutral"
                        aria-label={globalize.translate('ButtonBack')}
                        onClick={onBackButtonClick}
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {children}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={1} alignItems="center">
                {buttons}
                {isUserLoggedIn && isUserMenuAvailable && (
                    <UserMenuButton />
                )}
            </Stack>
        </Stack>
    );
};

export default AppToolbar;