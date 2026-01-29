import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import React, { type FC, useEffect, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Flex, IconButton, Tooltip } from 'ui-primitives';
import globalize from '../../lib/globalize';
import inputManager from '../../scripts/inputManager';
import { useUiStore } from '../../store/uiStore';
import Events from '../../utils/events';
import { playbackManager } from '../playback/playbackmanager';
import playerSelectionMenu from '../playback/playerSelectionMenu';

export const HeaderActions: FC = () => {
    const toggleSearch = useUiStore((state) => state.toggleSearch);
    const [isCasting, setIsCasting] = useState(false);

    useEffect(() => {
        const updateCastState = () => {
            const info = playbackManager.getPlayerInfo();
            setIsCasting(info && !info.isLocalPlayer);
        };

        updateCastState();
        Events.on(playbackManager, 'playerchange', updateCastState);
        return () => Events.off(playbackManager, 'playerchange', updateCastState);
    }, []);

    const handleSearchClick = () => {
        inputManager.handleCommand('search');
        toggleSearch(true);
    };

    const handleCastClick = (e: React.MouseEvent<HTMLElement>) => {
        playerSelectionMenu.show(e.currentTarget);
    };

    return (
        <Flex style={{ flexDirection: 'row', gap: vars.spacing['4'], alignItems: 'center' }}>
            <Tooltip title={globalize.translate('Search')} variant="soft">
                <IconButton
                    variant="plain"
                    color="neutral"
                    aria-label={globalize.translate('Search')}
                    onClick={handleSearchClick}
                >
                    <MagnifyingGlassIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title={globalize.translate('ButtonCast')} variant="soft">
                <IconButton
                    variant="plain"
                    color={isCasting ? 'primary' : 'neutral'}
                    aria-label={globalize.translate('ButtonCast')}
                    onClick={handleCastClick}
                >
                    <span className="material-icons">{isCasting ? 'cast_connected' : 'cast'}</span>
                </IconButton>
            </Tooltip>
        </Flex>
    );
};
