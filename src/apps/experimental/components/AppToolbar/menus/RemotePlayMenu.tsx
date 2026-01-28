import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import React, { type FC, useEffect, useState } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Menu, MenuItem, MenuSeparator } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import { pluginManager } from 'components/pluginManager';
import type { PlayTarget } from 'types/playTarget';

import PlayTargetIcon from '../../PlayTargetIcon';

interface RemotePlayMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: React.ReactNode;
}

export const ID = 'app-remote-play-menu';

const RemotePlayMenu: FC<RemotePlayMenuProps> = ({ open, onOpenChange, trigger }) => {
    // TODO: Add other checks for support (Android app, secure context, etc)
    const isChromecastPluginLoaded = !!pluginManager.plugins.find(plugin => plugin.id === 'chromecast');

    const [playbackTargets, setPlaybackTargets] = useState<PlayTarget[]>([]);

    const onPlayTargetClick = (target: PlayTarget) => {
        playbackManager.trySetActivePlayer(target.playerName, target);
        onOpenChange(false);
    };

    useEffect(() => {
        const fetchPlaybackTargets = async () => {
            setPlaybackTargets(await playbackManager.getTargets());
        };

        if (open) {
            fetchPlaybackTargets().catch(err => {
                console.error('[AppRemotePlayMenu] unable to get playback targets', err);
            });
        }
    }, [open, setPlaybackTargets]);

    return (
        <Menu open={open} onOpenChange={onOpenChange} trigger={trigger} align="end" id={ID}>
            {!isChromecastPluginLoaded && (
                <MenuItem disabled>
                    <Flex align="center" gap={vars.spacing['4']}>
                        <Box style={{ width: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>
                            <ExclamationTriangleIcon />
                        </Box>
                        <Text size="md">{globalize.translate('GoogleCastUnsupported')}</Text>
                    </Flex>
                </MenuItem>
            )}

            {!isChromecastPluginLoaded && playbackTargets.length > 0 && <MenuSeparator />}

            {playbackTargets.map(target => (
                <MenuItem
                    key={target.id}
                    // Since we are looping over targets there is no good way to avoid creating a new function here
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => onPlayTargetClick(target)}
                >
                    <Flex align="center" gap={vars.spacing['4']}>
                        <Box style={{ width: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>
                            <PlayTargetIcon target={target} />
                        </Box>
                        <Box style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text size="md">{target.appName ? `${target.name} - ${target.appName}` : target.name}</Text>
                            {target.user?.Name && (
                                <Text size="sm" color="secondary">
                                    {target.user.Name}
                                </Text>
                            )}
                        </Box>
                    </Flex>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default RemotePlayMenu;
