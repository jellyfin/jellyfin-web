import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import SettingsRemote from '@mui/icons-material/SettingsRemote';
import Divider from '@mui/material/Divider/Divider';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import dialog from 'components/dialog/dialog';
import { playbackManager } from 'components/playback/playbackmanager';
import React, { FC, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import { enable, isEnabled } from 'scripts/autocast';
import globalize from 'lib/globalize';

interface RemotePlayActiveMenuProps extends MenuProps {
    onMenuClose: () => void
    playerInfo: {
        name: string
        isLocalPlayer: boolean
        id?: string
        deviceName?: string
        playableMediaTypes?: string[]
        supportedCommands?: string[]
    } | null
}

export const ID = 'app-remote-play-active-menu';

const RemotePlayActiveMenu: FC<RemotePlayActiveMenuProps> = ({
    anchorEl,
    open,
    onMenuClose,
    playerInfo
}) => {
    const [ isDisplayMirrorEnabled, setIsDisplayMirrorEnabled ] = useState(playbackManager.enableDisplayMirroring());
    const isDisplayMirrorSupported = playerInfo?.supportedCommands && playerInfo.supportedCommands.indexOf('DisplayContent') !== -1;
    const toggleDisplayMirror = useCallback(() => {
        playbackManager.enableDisplayMirroring(!isDisplayMirrorEnabled);
        setIsDisplayMirrorEnabled(!isDisplayMirrorEnabled);
    }, [ isDisplayMirrorEnabled, setIsDisplayMirrorEnabled ]);

    const [ isAutoCastEnabled, setIsAutoCastEnabled ] = useState(isEnabled());
    const toggleAutoCast = useCallback(() => {
        enable(!isAutoCastEnabled);
        setIsAutoCastEnabled(!isAutoCastEnabled);
    }, [ isAutoCastEnabled ]);

    const remotePlayerName = playerInfo?.deviceName || playerInfo?.name;

    const disconnectRemotePlayer = useCallback(() => {
        if (playbackManager.getSupportedCommands().indexOf('EndSession') !== -1) {
            dialog.show({
                buttons: [
                    {
                        name: globalize.translate('Yes'),
                        id: 'yes'
                    }, {
                        name: globalize.translate('No'),
                        id: 'no'
                    }
                ],
                text: globalize.translate('ConfirmEndPlayerSession', remotePlayerName)
            }).then(id => {
                onMenuClose();

                if (id === 'yes') {
                    playbackManager.getCurrentPlayer()?.endSession();
                }
                playbackManager.setDefaultPlayerActive();
            }).catch(() => {
            // Dialog closed
            });
        } else {
            onMenuClose();
            playbackManager.setDefaultPlayerActive();
        }
    }, [ onMenuClose, remotePlayerName ]);

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
            slotProps={{
                list: {
                    'aria-labelledby': 'remote-play-active-subheader',
                    subheader: (
                        <ListSubheader component='div' id='remote-play-active-subheader'>
                            {remotePlayerName}
                        </ListSubheader>
                    )
                }
            }}
        >
            {isDisplayMirrorSupported ? (
                <MenuItem onClick={toggleDisplayMirror}>
                    {isDisplayMirrorEnabled ? (
                        <ListItemIcon>
                            <Check />
                        </ListItemIcon>
                    ) : null}
                    <ListItemText inset={!isDisplayMirrorEnabled}>
                        {globalize.translate('EnableDisplayMirroring')}
                    </ListItemText>
                </MenuItem>
            ) : null}

            <MenuItem onClick={toggleAutoCast}>
                {isAutoCastEnabled ? (
                    <ListItemIcon>
                        <Check />
                    </ListItemIcon>
                ) : null}
                <ListItemText inset={!isAutoCastEnabled}>
                    {globalize.translate('EnableAutoCast')}
                </ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem
                component={Link}
                to='/queue'
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <SettingsRemote />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('HeaderRemoteControl')}
                </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={disconnectRemotePlayer}>
                <ListItemIcon>
                    <Close />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Disconnect')}
                </ListItemText>
            </MenuItem>
        </Menu>
    );
};

export default RemotePlayActiveMenu;
