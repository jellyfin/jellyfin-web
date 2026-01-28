import { CheckIcon, Cross2Icon, GearIcon } from '@radix-ui/react-icons';
import dialog from 'components/dialog/dialog';
import { playbackManager } from 'components/playback/playbackmanager';
import React, { type FC, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Box, Flex } from 'ui-primitives';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

import { enable, isEnabled } from 'scripts/autocast';
import globalize from 'lib/globalize';

interface RemotePlayActiveMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
    playerInfo: {
        name: string;
        isLocalPlayer: boolean;
        id?: string;
        deviceName?: string;
        playableMediaTypes?: string[];
        supportedCommands?: string[];
    } | null;
}

export const ID = 'app-remote-play-active-menu';

const RemotePlayActiveMenu: FC<RemotePlayActiveMenuProps> = ({ open, onOpenChange, trigger, playerInfo }) => {
    const navigate = useNavigate();
    const [isDisplayMirrorEnabled, setIsDisplayMirrorEnabled] = useState(playbackManager.enableDisplayMirroring());
    const isDisplayMirrorSupported =
        playerInfo?.supportedCommands && playerInfo.supportedCommands.indexOf('DisplayContent') !== -1;
    const toggleDisplayMirror = useCallback(() => {
        playbackManager.enableDisplayMirroring(!isDisplayMirrorEnabled);
        setIsDisplayMirrorEnabled(!isDisplayMirrorEnabled);
    }, [isDisplayMirrorEnabled, setIsDisplayMirrorEnabled]);

    const [isAutoCastEnabled, setIsAutoCastEnabled] = useState(isEnabled());
    const toggleAutoCast = useCallback(() => {
        enable(!isAutoCastEnabled);
        setIsAutoCastEnabled(!isAutoCastEnabled);
    }, [isAutoCastEnabled]);

    const remotePlayerName = playerInfo?.deviceName || playerInfo?.name;

    const disconnectRemotePlayer = useCallback(() => {
        if (playbackManager.getSupportedCommands().indexOf('EndSession') !== -1) {
            dialog
                .show({
                    buttons: [
                        {
                            name: globalize.translate('Yes'),
                            id: 'yes'
                        },
                        {
                            name: globalize.translate('No'),
                            id: 'no'
                        }
                    ],
                    text: globalize.translate('ConfirmEndPlayerSession', remotePlayerName)
                })
                .then(id => {
                    onOpenChange(false);

                    if (id === 'yes') {
                        const player = playbackManager.getCurrentPlayer();
                        if (player?.endSession) {
                            player.endSession();
                        }
                    }
                    playbackManager.setDefaultPlayerActive();
                })
                .catch(() => {
                    // Dialog closed
                });
        } else {
            onOpenChange(false);
            playbackManager.setDefaultPlayerActive();
        }
    }, [onOpenChange, remotePlayerName]);

    const renderMenuItemContent = (icon: React.ReactNode | null, label: string) => (
        <Flex align="center" gap={vars.spacing['4']}>
            <Box style={{ width: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>{icon}</Box>
            <Text size="md">{label}</Text>
        </Flex>
    );

    return (
        <Menu open={open} onOpenChange={onOpenChange} trigger={trigger} align="end" id={ID}>
            {remotePlayerName && <MenuLabel>{remotePlayerName}</MenuLabel>}
            {isDisplayMirrorSupported ? (
                <MenuItem onClick={toggleDisplayMirror}>
                    {renderMenuItemContent(
                        isDisplayMirrorEnabled ? <CheckIcon /> : null,
                        globalize.translate('EnableDisplayMirroring')
                    )}
                </MenuItem>
            ) : null}

            <MenuItem onClick={toggleAutoCast}>
                {renderMenuItemContent(isAutoCastEnabled ? <CheckIcon /> : null, globalize.translate('EnableAutoCast'))}
            </MenuItem>

            <MenuSeparator />

            <MenuItem
                onClick={() => {
                    navigate({ to: '/queue' });
                    onOpenChange(false);
                }}
            >
                {renderMenuItemContent(<GearIcon />, globalize.translate('HeaderRemoteControl'))}
            </MenuItem>
            <MenuSeparator />
            <MenuItem variant="danger" onClick={disconnectRemotePlayer}>
                {renderMenuItemContent(<Cross2Icon />, globalize.translate('Disconnect'))}
            </MenuItem>
        </Menu>
    );
};

export default RemotePlayActiveMenu;
