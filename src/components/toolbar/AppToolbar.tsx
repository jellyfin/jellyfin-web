import { ArrowLeftIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import React, { type FC, type PropsWithChildren, ReactNode } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Flex, IconButton, Tooltip } from 'ui-primitives';
import { logger } from 'utils/logger';
import UserMenuButton from './UserMenuButton';

interface AppToolbarProps {
    buttons?: ReactNode;
    isDrawerAvailable?: boolean;
    isDrawerOpen: boolean;
    onDrawerButtonClick?: (event: React.MouseEvent<HTMLElement>) => void;
    isBackButtonAvailable?: boolean;
    isUserMenuAvailable?: boolean;
}

const onBackButtonClick = () => {
    appRouter.back().catch((err) => {
        logger.error('Error calling appRouter.back', { component: 'AppToolbar' }, err as Error);
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
                gap: vars.spacing['4'],
                minHeight: '64px',
                paddingLeft: 'max(16px, env(safe-area-inset-left))',
                paddingRight: 'max(16px, env(safe-area-inset-right))',
                flexWrap: 'wrap'
            }}
        >
            {isUserLoggedIn && isDrawerAvailable && (
                <Tooltip
                    title={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}
                    variant="soft"
                >
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

            <Box style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['4'] }}>
                {children}
            </Box>

            <Box style={{ flexGrow: 1 }} />

            <Flex style={{ flexDirection: 'row', gap: vars.spacing['4'], alignItems: 'center' }}>
                {buttons}
                {isUserLoggedIn && isUserMenuAvailable && <UserMenuButton />}
            </Flex>
        </Flex>
    );
};

export default AppToolbar;
