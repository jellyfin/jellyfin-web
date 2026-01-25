import { ArrowLeftIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import React, { type FC, type PropsWithChildren, ReactNode } from 'react';

import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import UserMenuButton from './UserMenuButton';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { Box, Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

interface AppToolbarProps {
    buttons?: ReactNode;
    isDrawerAvailable?: boolean;
    isDrawerOpen: boolean;
    onDrawerButtonClick?: (event: React.MouseEvent<HTMLElement>) => void;
    isBackButtonAvailable?: boolean;
    isUserMenuAvailable?: boolean;
}

const onBackButtonClick = () => {
    appRouter.back().catch(err => {
        console.error('[AppToolbar] error calling appRouter.back', err);
    });
};

const AppToolbar: FC<PropsWithChildren<AppToolbarProps>> = ({
    buttons,
    children,
    isDrawerAvailable = true,
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
        <Flex
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: vars.spacing.sm,
                minHeight: '64px',
                paddingLeft: 'max(16px, env(safe-area-inset-left))',
                paddingRight: 'max(16px, env(safe-area-inset-right))',
                flexWrap: 'wrap'
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
                        <HamburgerMenuIcon />
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
                        <ArrowLeftIcon />
                    </IconButton>
                </Tooltip>
            )}

            <Box style={{ display: 'flex', alignItems: 'center', gap: vars.spacing.sm }}>{children}</Box>

            <Box style={{ flexGrow: 1 }} />

            <Flex style={{ flexDirection: 'row', gap: vars.spacing.sm, alignItems: 'center' }}>
                {buttons}
                {isUserLoggedIn && isUserMenuAvailable && <UserMenuButton />}
            </Flex>
        </Flex>
    );
};

export default AppToolbar;
