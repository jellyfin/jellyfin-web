import { DesktopIcon, Link2Icon } from '@radix-ui/react-icons';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import React, { useCallback, useEffect, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, IconButton } from 'ui-primitives';
import Events, { type EventObject } from 'utils/events';
import RemotePlayActiveMenu, { ID as ACTIVE_ID } from './menus/RemotePlayActiveMenu';
import RemotePlayMenu, { ID } from './menus/RemotePlayMenu';

const RemotePlayButton = () => {
    const [playerInfo, setPlayerInfo] = useState(playbackManager.getPlayerInfo());

    const updatePlayerInfo = useCallback(() => {
        setPlayerInfo(playbackManager.getPlayerInfo());
    }, [setPlayerInfo]);

    useEffect(() => {
        Events.on(playbackManager as EventObject, 'playerchange', updatePlayerInfo);

        return () => {
            Events.off(playbackManager as EventObject, 'playerchange', updatePlayerInfo);
        };
    }, [updatePlayerInfo]);

    const [isRemotePlayMenuOpen, setIsRemotePlayMenuOpen] = useState(false);
    const [isRemotePlayActiveMenuOpen, setIsRemotePlayActiveMenuOpen] = useState(false);

    return (
        <>
            {playerInfo && !playerInfo.isLocalPlayer ? (
                <Box style={{ alignSelf: 'center' }}>
                    <RemotePlayActiveMenu
                        open={isRemotePlayActiveMenuOpen}
                        onOpenChange={setIsRemotePlayActiveMenuOpen}
                        playerInfo={playerInfo}
                        trigger={
                            <Button
                                variant="plain"
                                size="lg"
                                startIcon={<Link2Icon />}
                                aria-label={globalize.translate('ButtonCast')}
                                aria-controls={ACTIVE_ID}
                                aria-haspopup="true"
                                title={globalize.translate('ButtonCast')}
                                style={{ color: vars.colors.primary }}
                            >
                                {playerInfo.deviceName || playerInfo.name}
                            </Button>
                        }
                    />
                </Box>
            ) : (
                <RemotePlayMenu
                    open={isRemotePlayMenuOpen}
                    onOpenChange={setIsRemotePlayMenuOpen}
                    trigger={
                        <IconButton
                            size="lg"
                            aria-label={globalize.translate('ButtonCast')}
                            aria-controls={ID}
                            aria-haspopup="true"
                            title={globalize.translate('ButtonCast')}
                        >
                            <DesktopIcon />
                        </IconButton>
                    }
                />
            )}
        </>
    );
};

export default RemotePlayButton;
