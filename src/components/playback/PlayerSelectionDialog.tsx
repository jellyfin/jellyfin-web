import React, { useState, useEffect, useCallback } from 'react';
import {
    Cross1Icon,
    DesktopIcon,
    ExternalLinkIcon,
    LinkNone2Icon,
    MobileIcon,
    Share1Icon,
    TabletIcon,
    VideoIcon
} from '@radix-ui/react-icons';
import { playbackManager } from '../playback/playbackmanager';
import { usePlayerStore } from '../../store';
import { logger } from '../../utils/logger';
import { Dialog, DialogContent, DialogTitle } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { List, ListItem, ListItemButton, ListItemContent, ListItemDecorator } from 'ui-primitives/List';
import { Checkbox } from 'ui-primitives/Checkbox';
import { IconButton } from 'ui-primitives/IconButton';
import { Divider } from 'ui-primitives/Divider';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import { isEnabled, enable } from '../../scripts/autocast';

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
    open: boolean;
    onClose: () => void;
    anchorElement?: HTMLElement;
}

export const PlayerSelectionDialog: React.FC<PlayerSelectionDialogProps> = ({ open, onClose, anchorElement }) => {
    const [targets, setTargets] = useState<PlaybackTarget[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePlayerInfo, setActivePlayerInfo] = useState<ActivePlayerInfo | null>(null);
    const [showActivePlayerMenu, setShowActivePlayerMenu] = useState(false);
    const [enableMirror, setEnableMirror] = useState(false);
    const [enableAutoCast, setEnableAutoCast] = useState(false);

    const currentPlayer = usePlayerStore(state => state.currentPlayer);

    const loadTargets = useCallback(async () => {
        setLoading(true);
        try {
            const playerInfo = playbackManager.getPlayerInfo();

            if (playerInfo && !playerInfo.isLocalPlayer) {
                setActivePlayerInfo(playerInfo);
                setShowActivePlayerMenu(true);
                return;
            }

            const currentPlayerId = playerInfo?.id || null;
            const playbackTargets = await playbackManager.getTargets();

            const mappedTargets: PlaybackTarget[] = playbackTargets.map((t: PlaybackTarget) => {
                let name = t.name;
                if (t.appName && t.appName !== t.name) {
                    name += ' - ' + t.appName;
                }
                return {
                    ...t,
                    name,
                    selected: currentPlayerId === t.id,
                    secondaryText: t.user?.Name || null
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
        if (open && !showActivePlayerMenu) {
            loadTargets();
        }
    }, [open, showActivePlayerMenu, loadTargets]);

    useEffect(() => {
        setEnableAutoCast(isEnabled());
    }, []);

    const getDeviceIcon = (deviceType?: string, isLocalPlayer?: boolean) => {
        if (isLocalPlayer) {
            if (deviceType === 'tv') return <VideoIcon />;
            if (deviceType === 'smartphone') return <MobileIcon />;
            if (deviceType === 'tablet') return <TabletIcon />;
            if (deviceType === 'desktop') return <DesktopIcon />;
            return <DesktopIcon />;
        }
        return <Share1Icon />;
    };

    const handleTargetSelect = async (target: PlaybackTarget) => {
        try {
            await playbackManager.trySetActivePlayer(target.playerName!, target);
            onClose();
        } catch (error) {
            logger.error(
                '[PlayerSelectionDialog] Failed to select target',
                { component: 'PlayerSelectionDialog' },
                error as Error
            );
        }
    };

    const handleRemoteControl = () => {
        import('../router/appRouter').then(({ appRouter }) => {
            appRouter.showNowPlaying();
        });
        onClose();
    };

    const handleDisconnect = () => {
        if (activePlayerInfo?.supportedCommands?.includes('EndSession')) {
            const currentDeviceName = activePlayerInfo.deviceName || activePlayerInfo.name;
            if (currentDeviceName) {
                (playbackManager.getCurrentPlayer() as any)?.endSession();
                (playbackManager as any).setDefaultPlayerActive();
            }
        } else {
            (playbackManager as any).setDefaultPlayerActive();
        }
        setShowActivePlayerMenu(false);
        setActivePlayerInfo(null);
        onClose();
    };

    const handleMirrorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setEnableMirror(checked);
        (playbackManager as any).enableDisplayMirroring(checked);
    };

    const handleAutoCastChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setEnableAutoCast(checked);
        enable(checked);
    };

    const handleBack = () => {
        setShowActivePlayerMenu(false);
        setActivePlayerInfo(null);
        loadTargets();
    };

    if (showActivePlayerMenu && activePlayerInfo) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent
                    style={{
                        '--Dialog-width': '400px',
                        '--Dialog-padding': '24px'
                    }}
                >
                    <Flex
                        style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}
                    >
                        <DialogTitle>{activePlayerInfo.deviceName || activePlayerInfo.name}</DialogTitle>
                        <IconButton variant="plain" onClick={onClose} aria-label="Close">
                            <Cross1Icon />
                        </IconButton>
                    </Flex>

                    <Divider />

                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                        {activePlayerInfo.supportedCommands?.includes('DisplayContent') && (
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
                            variant="plain"
                            startDecorator={<ExternalLinkIcon />}
                            onClick={handleRemoteControl}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Remote Control
                        </Button>
                        <Button
                            variant="plain"
                            color="danger"
                            startDecorator={<LinkNone2Icon />}
                            onClick={handleDisconnect}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Disconnect
                        </Button>
                        <Button
                            variant="plain"
                            onClick={onClose}
                            style={{ justifyContent: 'flex-start', width: '100%' }}
                        >
                            Cancel
                        </Button>
                    </Flex>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                style={{
                    '--Dialog-width': '400px',
                    '--Dialog-padding': '24px'
                }}
            >
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}>
                    <DialogTitle>Play On</DialogTitle>
                    <IconButton variant="plain" onClick={onClose} aria-label="Close">
                        <Cross1Icon />
                    </IconButton>
                </Flex>

                <Flex style={{ flexDirection: 'column', gap: vars.spacing.sm }}>
                    {loading ? (
                        <Text style={{ padding: vars.spacing.xl, textAlign: 'center' }}>
                            Loading playback devices...
                        </Text>
                    ) : targets.length === 0 ? (
                        <Text style={{ padding: vars.spacing.xl, textAlign: 'center' }}>No playback devices found</Text>
                    ) : (
                        <List>
                            {targets.map(target => (
                                <ListItem key={target.id} data-testid="player-item">
                                    <ListItemButton
                                        onClick={() => handleTargetSelect(target)}
                                        selected={target.selected || false}
                                        style={{ borderRadius: vars.borderRadius.md, marginBottom: vars.spacing.xs }}
                                    >
                                        <ListItemDecorator>
                                            {getDeviceIcon(target.deviceType, target.isLocalPlayer)}
                                        </ListItemDecorator>
                                        <ListItemContent>
                                            <Text>{target.name}</Text>
                                            {target.secondaryText && (
                                                <Text size="xs" color="secondary">
                                                    {target.secondaryText}
                                                </Text>
                                            )}
                                        </ListItemContent>
                                        {target.selected && (
                                            <Text size="sm" color="primary">
                                                Playing
                                            </Text>
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Flex>
            </DialogContent>
        </Dialog>
    );
};

export default PlayerSelectionDialog;
