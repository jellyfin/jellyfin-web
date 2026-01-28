import React, { type FC } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Box, Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';
import { Text } from 'ui-primitives/Text';

import { selectCurrentPlayer, selectCurrentQueueItem, usePlayerStore, useQueueStore } from 'store';

import { appRouter, PUBLIC_PATHS } from 'components/router/appRouter';
import AppToolbar from 'components/toolbar/AppToolbar';
import ServerButton from 'components/toolbar/ServerButton';

import RemotePlayButton from './RemotePlayButton';
import SyncPlayButton from './SyncPlayButton';
import SearchButton from './SearchButton';
import UserViewNav from './userViews/UserViewNav';

interface AppToolbarProps {
    isDrawerAvailable: boolean;
    isDrawerOpen: boolean;
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const ExperimentalAppToolbar: FC<AppToolbarProps> = ({ isDrawerAvailable, isDrawerOpen, onDrawerButtonClick }) => {
    const location = useLocation();
    const currentQueueItem = useQueueStore(selectCurrentQueueItem);
    const currentPlayer = usePlayerStore(selectCurrentPlayer);

    // The video osd does not show the standard toolbar
    if (location.pathname === '/video') return null;

    // Only show the back button in apps when appropriate
    const isBackButtonAvailable = window.NativeShell && appRouter.canGoBack(location.pathname);

    // Check if the current path is a public path to hide user content
    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);
    const activeSegment = location.pathname.split('/')[1] || 'home';
    const formattedSegment = activeSegment
        .split('-')
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
    const highlightLabel = formattedSegment || 'Home';
    const highlightTone = location.pathname.includes('queue') ? vars.colors.secondary : vars.colors.primary;
    const nowPlayingTitle = currentQueueItem?.item.name ?? 'Queue is empty';
    const nowPlayingSubtitle = currentQueueItem?.item.artist ?? currentPlayer?.name ?? 'Local player';
    const nowPlayingStatus = currentQueueItem ? 'Playing' : 'Queue idle';

    return (
        <Box
            style={{
                position: 'relative',
                width: '100%',
                padding: `${vars.spacing['2']} ${vars.spacing['4']} ${vars.spacing['5']}`,
                zIndex: 0
            }}
        >
            <Box
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '0 0 32px 32px',
                    background: `linear-gradient(135deg, ${vars.colors.surface}, ${vars.colors.surfaceVariant})`,
                    boxShadow: vars.shadows.lg,
                    filter: 'blur(20px)',
                    opacity: 0.9,
                    pointerEvents: 'none',
                    zIndex: 0
                }}
            />

            <Box
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing['2'],
                    zIndex: 1
                }}
            >
                <AppToolbar
                    buttons={
                        !isPublicPath && (
                            <>
                                <SyncPlayButton />
                                <RemotePlayButton />
                                <SearchButton />
                            </>
                        )
                    }
                    isDrawerAvailable={isDrawerAvailable}
                    isDrawerOpen={isDrawerOpen}
                    onDrawerButtonClick={onDrawerButtonClick}
                    isBackButtonAvailable={isBackButtonAvailable}
                    isUserMenuAvailable={!isPublicPath}
                >
                    {!isDrawerAvailable && (
                        <Flex align="center" gap={vars.spacing['2']}>
                            <ServerButton />

                            {!isPublicPath && <UserViewNav />}
                        </Flex>
                    )}
                </AppToolbar>

                {!isPublicPath && (
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
                        <Box
                            style={{
                                alignSelf: 'flex-start',
                                padding: `0 ${vars.spacing['5']}`,
                                borderRadius: vars.borderRadius.xl,
                                border: `1px solid ${highlightTone}`,
                                backgroundColor: vars.colors.surfaceVariant,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                transition: 'transform 220ms ease',
                                transform: currentQueueItem ? 'scale(1)' : 'scale(0.95)'
                            }}
                        >
                            <Text size="xs" weight="medium" color="primary">
                                {highlightLabel}
                            </Text>
                        </Box>

                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                                borderRadius: vars.borderRadius.lg,
                                background: `linear-gradient(120deg, ${vars.colors.surfaceVariant}, ${vars.colors.surface})`,
                                border: `1px solid ${vars.colors.border}`,
                                boxShadow: vars.shadows.sm,
                                backdropFilter: 'blur(8px)',
                                transition: 'transform 230ms ease, opacity 230ms ease',
                                transform: currentQueueItem ? 'translateY(0)' : 'translateY(6px)',
                                opacity: currentQueueItem ? 1 : 0.72,
                                gap: vars.spacing['4']
                            }}
                        >
                            <Box style={{ minWidth: 0 }}>
                                <Text weight="bold">{nowPlayingTitle}</Text>
                                <Text size="sm" color="muted" noWrap>
                                    {nowPlayingSubtitle}
                                </Text>
                            </Box>
                            <Text size="xs" weight="medium" color="secondary">
                                {nowPlayingStatus}
                            </Text>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ExperimentalAppToolbar;
