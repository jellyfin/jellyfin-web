import {
    DesktopIcon,
    MobileIcon,
    LaptopIcon,
    Cross2Icon,
    VideoIcon,
    Share1Icon,
    ExternalLinkIcon,
    LinkNone2Icon
} from '@radix-ui/react-icons';
import React, { useState, useEffect, useCallback } from 'react';

import { vars } from 'styles/tokens.css';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Dialog, DialogContent, DialogTitle } from 'ui-primitives/Dialog';
import { Divider } from 'ui-primitives/Divider';
import { IconButton } from 'ui-primitives/IconButton';
import { List, ListItem, ListItemButton, ListItemContent, ListItemDecorator } from 'ui-primitives/List';
import { Text } from 'ui-primitives/Text';

import { isEnabled, enable } from '../../scripts/autocast';
import { logger } from '../../utils/logger';

import { playbackManager } from './playbackmanager';

interface PlaybackTarget {
    id: string;
    name: string;
    appName?: string;
    deviceType?: string;
    isLocalPlayer?: boolean;
    user?: {
        Name: string;
    };
    playerName?: string;
    playableMediaTypes?: string[];
    supportedCommands?: string[];
    selected?: boolean;
    secondaryText?: string | null;
}

interface ActivePlayerInfo {
    deviceName?: string;
    name?: string;
    supportedCommands?: string[];
    isLocalPlayer?: boolean;
}

interface PlayerSelectionDialogProps {
    readonly open: boolean;
    readonly onClose: () => void;
}

interface TargetListItemProps {
    readonly target: PlaybackTarget;
    readonly onClick: (target: PlaybackTarget) => Promise<void>;
    readonly getDeviceIcon: (deviceType?: string, isLocalPlayer?: boolean) => React.JSX.Element;
}

const TargetListItem = React.memo(({ target, onClick, getDeviceIcon }: TargetListItemProps) => {
    const handleClick = useCallback((): void => {
        onClick(target).catch((error: unknown) => {
            logger.error('[PlayerSelectionDialog] Target click failed', { component: 'PlayerSelectionDialog' }, error as Error);
        });
    }, [target, onClick]);

    return (
        <ListItem key={target.id} data-testid='player-item'>
            <ListItemButton
                onClick={handleClick}
                selected={target.selected ?? false}
                style={{ borderRadius: vars.borderRadius.md, marginBottom: vars.spacing.xs }}
            >
                <ListItemDecorator>
                    {getDeviceIcon(target.deviceType, target.isLocalPlayer)}
                </ListItemDecorator>
                <ListItemContent>
                    <Text>{target.name}</Text>
                    {target.secondaryText !== null && target.secondaryText !== undefined && target.secondaryText !== '' && (
                        <Text size='xs' color='secondary'>
                            {target.secondaryText}
                        </Text>
                    )}
                </ListItemContent>
                {target.selected === true && (
                    <Text size='sm' color='primary'>
                        Playing
                    </Text>
                )}
            </ListItemButton>
        </ListItem>
    );
});

TargetListItem.displayName = 'TargetListItem';

export function PlayerSelectionDialog({ open, onClose }: PlayerSelectionDialogProps): React.JSX.Element {
    const [targets, setTargets] = useState<PlaybackTarget[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePlayerInfo, setActivePlayerInfo] = useState<ActivePlayerInfo | null>(null);
    const [showActivePlayerMenu, setShowActivePlayerMenu] = useState(false);
    const [enableMirror, setEnableMirror] = useState(false);
    const [enableAutoCast, setEnableAutoCast] = useState(false);

    const handleClose = useCallback((): void => {
        onClose();
    }, [onClose]);

    const loadTargets = useCallback(async () => {
        setLoading(true);
        try {
            const playerInfo = playbackManager.getPlayerInfo() as ActivePlayerInfo | null;

            if (playerInfo && !playerInfo.isLocalPlayer) {
                setActivePlayerInfo(playerInfo);
                setShowActivePlayerMenu(true);
                return;
            }

            const currentPlayerId = playerInfo?.id ?? null;
            const playbackTargets = await playbackManager.getTargets();

            const mappedTargets: PlaybackTarget[] = (playbackTargets as PlaybackTarget[]).map((t: PlaybackTarget) => {
                let name = t.name;
                const appName = t.appName as string | undefined;
                if (appName !== undefined && appName !== '' && appName !== t.name) {
                    name += ' - ' + appName;
                }
                return {
                    ...t,
                    name,
                    selected: currentPlayerId === t.id,
                    secondaryText: t.user?.Name ?? null
                };
            });

            setTargets(mappedTargets);
        } catch (error) {
            logger.error(
                '[PlayerSelectionDialog] Failed to load targets',
                { component: 'PlayerSelectionDialog' },
                error as Error
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open === true && showActivePlayerMenu === false) {
            loadTargets().catch((error: unknown) => {
                logger.error('[PlayerSelectionDialog] useEffect loadTargets failed', { component: 'PlayerSelectionDialog' }, error as Error);
            });
        }
    }, [open, showActivePlayerMenu, loadTargets]);

    useEffect(() => {
        setEnableAutoCast(isEnabled());
    }, []);

    const getDeviceIcon = useCallback((deviceType?: string, isLocalPlayer?: boolean): React.JSX.Element => {
        if (isLocalPlayer === true) {
            if (deviceType === 'tv') return <VideoIcon />;
            if (deviceType === 'smartphone') return <MobileIcon />;
            if (deviceType === 'tablet') return <LaptopIcon />;
            if (deviceType === 'desktop') return <DesktopIcon />;
            return <DesktopIcon />;
        }
        return <Share1Icon />;
    }, []);

    const handleTargetSelect = useCallback(async (target: PlaybackTarget): Promise<void> => {
        try {
            await playbackManager.trySetActivePlayer(target.playerName ?? '', target);
            handleClose();
        } catch (error) {
            logger.error(
                '[PlayerSelectionDialog] Failed to select target',
                { component: 'PlayerSelectionDialog' },
                error as Error
            );
        }
    }, [handleClose]);

    const handleRemoteControl = useCallback((): void => {
        void import('../router/appRouter').then(({ appRouter }) => {
            void appRouter.showNowPlaying();
        });
        handleClose();
    }, [handleClose]);

    const handleDisconnect = useCallback((): void => {
        if (activePlayerInfo?.supportedCommands?.includes('EndSession') === true) {
            const currentDeviceName = activePlayerInfo.deviceName ?? activePlayerInfo.name;
            if (currentDeviceName !== undefined && currentDeviceName !== '') {
                interface PlayerWithEndSession {
                    endSession: () => void;
                }
                const currentPlayer = playbackManager.getCurrentPlayer() as PlayerWithEndSession | null;
                currentPlayer?.endSession();
                (playbackManager as { setDefaultPlayerActive: () => void }).setDefaultPlayerActive();
            }
        } else {
            (playbackManager as { setDefaultPlayerActive: () => void }).setDefaultPlayerActive();
        }
        setShowActivePlayerMenu(false);
        setActivePlayerInfo(null);
        handleClose();
    }, [activePlayerInfo, handleClose]);

    const handleMirrorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        setEnableMirror(checked);
        (playbackManager as { enableDisplayMirroring: (enabled: boolean) => void }).enableDisplayMirroring(checked);
    }, []);

    const handleAutoCastChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        const checked = event.target.checked;
        setEnableAutoCast(checked);
        enable(checked);
    }, []);

    if (showActivePlayerMenu === true && activePlayerInfo !== null) {
        const activeDeviceName = activePlayerInfo.deviceName ?? activePlayerInfo.name ?? 'Unknown Device';
        const supportsMirroring = activePlayerInfo.supportedCommands?.includes('DisplayContent') === true;

        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent
                    style={{
                        '--Dialog-width': '400px',
                        '--Dialog-padding': '24px'
                    }}
                >
                    <Flex
                        style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}
                    >
                        <DialogTitle>{activeDeviceName}</DialogTitle>
                        <IconButton variant='plain' onClick={handleClose} aria-label='Close'>
                            <Cross2Icon />
                        </IconButton>
                    </Flex>

                    <Divider />

                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                        {supportsMirroring && (
                            <Box style={{ marginBottom: vars.spacing.md }}>
                                <Checkbox checked={enableMirror} onChange={handleMirrorChange}>
                                    Enable display mirroring
                                </Checkbox>
                            </Box>
                        )}

                        <Box style={{ marginBottom: vars.spacing.md }}>
                            <Checkbox checked={enableAutoCast} onChange={handleAutoCastChange}>
                                Enable auto-cast
                            </Checkbox>
                        </Box>
                    </Flex>

                    <Divider />

                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.sm }}>
                        <Button
                            variant='plain'
                            startDecorator={<ExternalLinkIcon />}
                            onClick={handleRemoteControl}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Remote Control
                        </Button>
                        <Button
                            variant='plain'
                            color='danger'
                            startDecorator={<LinkNone2Icon />}
                            onClick={handleDisconnect}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Disconnect
                        </Button>
                        <Button
                            variant='plain'
                            onClick={handleClose}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </DialogContent>
            </Dialog>
        );
    }

    let content;
    if (loading === true) {
        content = (
            <Text style={{ padding: vars.spacing.xl, textAlign: 'center' }}>
                Loading playback devices...
            </Text>
        );
    } else if (targets.length === 0) {
        content = (
            <Text style={{ padding: vars.spacing.xl, textAlign: 'center' }}>No playback devices found</Text>
        );
    } else {
        content = (
            <List>
                {targets.map(target => (
                    <TargetListItem
                        key={target.id}
                        target={target}
                        onClick={handleTargetSelect}
                        getDeviceIcon={getDeviceIcon}
                    />
                ))}
            </List>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                style={{
                    '--Dialog-width': '400px',
                    '--Dialog-padding': '24px'
                }}
            >
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}>
                    <DialogTitle>Play On</DialogTitle>
                    <IconButton variant='plain' onClick={handleClose} aria-label='Close'>
                        <Cross2Icon />
                    </IconButton>
                </Flex>

                <Flex style={{ flexDirection: 'column', gap: vars.spacing.sm }}>
                    {content}
                </Flex>
            </DialogContent>
        </Dialog>
    );
};

export default PlayerSelectionDialog;
