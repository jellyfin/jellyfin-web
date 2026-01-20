import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@mui/joy/Modal';
import ModalClose from '@mui/joy/ModalClose';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import Button from '@mui/joy/Button';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Typography from '@mui/joy/Typography';
import Checkbox from '@mui/joy/Checkbox';
import Divider from '@mui/joy/Divider';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletIcon from '@mui/icons-material/Tablet';
import TvIcon from '@mui/icons-material/Tv';
import CastIcon from '@mui/icons-material/Cast';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import { playbackManager } from '../playback/playbackmanager';
import { usePlayerStore } from '../../store';
import { logger } from '../../utils/logger';

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

export const PlayerSelectionDialog: React.FC<PlayerSelectionDialogProps> = ({
    open,
    onClose,
    anchorElement
}) => {
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
            logger.error('[PlayerSelectionDialog] Failed to load targets', { component: 'PlayerSelectionDialog' }, error as Error);
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
            if (deviceType === 'tv') return <TvIcon />;
            if (deviceType === 'smartphone') return <SmartphoneIcon />;
            if (deviceType === 'tablet') return <TabletIcon />;
            if (deviceType === 'desktop') return <ComputerIcon />;
            return <ComputerIcon />;
        }
        return <CastIcon />;
    };

    const handleTargetSelect = async (target: PlaybackTarget) => {
        try {
            await playbackManager.trySetActivePlayer(target.playerName!, target);
            onClose();
        } catch (error) {
            logger.error('[PlayerSelectionDialog] Failed to select target', { component: 'PlayerSelectionDialog' }, error as Error);
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
            <Dialog
                open={open}
                onClose={onClose}
                sx={{
                    '--Dialog-width': '400px',
                    '--Dialog-padding': '24px'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography level="h4">
                        {activePlayerInfo.deviceName || activePlayerInfo.name}
                    </Typography>
                    <IconButton variant="plain" onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ my: 2 }} />

                <DialogContent>
                    {activePlayerInfo.supportedCommands?.includes('DisplayContent') && (
                        <Box sx={{ mb: 2 }}>
                            <Checkbox
                                checked={enableMirror}
                                onChange={handleMirrorChange}
                                label="Enable display mirroring"
                            />
                        </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Checkbox
                            checked={enableAutoCast}
                            onChange={handleAutoCastChange}
                            label="Enable auto-cast"
                        />
                    </Box>
                </DialogContent>

                <Divider sx={{ my: 2 }} />

                <DialogActions sx={{ flexDirection: 'column', gap: 1 }}>
                    <Button
                        variant="plain"
                        startDecorator={<OpenInNewIcon />}
                        onClick={handleRemoteControl}
                        sx={{ justifyContent: 'flex-start', width: '100%' }}
                    >
                        Remote Control
                    </Button>
                    <Button
                        variant="plain"
                        color="danger"
                        startDecorator={<LinkOffIcon />}
                        onClick={handleDisconnect}
                        sx={{ justifyContent: 'flex-start', width: '100%' }}
                    >
                        Disconnect
                    </Button>
                    <Button
                        variant="plain"
                        onClick={onClose}
                        sx={{ justifyContent: 'flex-start', width: '100%' }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            sx={{
                '--Dialog-width': '400px',
                '--Dialog-padding': '24px'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <DialogTitle>Play On</DialogTitle>
                <IconButton variant="plain" onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent>
                {loading ? (
                    <Typography sx={{ py: 4, textAlign: 'center' }}>
                        Loading playback devices...
                    </Typography>
                ) : targets.length === 0 ? (
                    <Typography sx={{ py: 4, textAlign: 'center' }}>
                        No playback devices found
                    </Typography>
                ) : (
                    <List>
                        {targets.map((target) => (
                            <ListItem key={target.id}>
                                <ListItemButton
                                    onClick={() => handleTargetSelect(target)}
                                    selected={target.selected || false}
                                    sx={{ borderRadius: '8px', mb: 1 }}
                                >
                                    <ListItemDecorator>
                                        {getDeviceIcon(target.deviceType, target.isLocalPlayer)}
                                    </ListItemDecorator>
                                    <ListItemContent>
                                        <Typography>{target.name}</Typography>
                                        {target.secondaryText && (
                                            <Typography level="body-xs" color="neutral">
                                                {target.secondaryText}
                                            </Typography>
                                        )}
                                    </ListItemContent>
                                    {target.selected && (
                                        <Typography level="body-sm" color="primary">
                                            Playing
                                        </Typography>
                                    )}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PlayerSelectionDialog;
