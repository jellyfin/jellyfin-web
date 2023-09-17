import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';

interface PlayAllButtonProps {
    item: BaseItemDto | undefined;
    items: BaseItemDto[];
    hasFilters: boolean;
}

const PlayAllButton: FC<PlayAllButtonProps> = ({ item, items, hasFilters }) => {
    const play = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.play({
                items: [item]
            });
        } else {
            playbackManager.play({
                items: items
            });
        }
    }, [hasFilters, item, items]);

    return (
        <IconButton
            title={globalize.translate('HeaderPlayAll')}
            className='paper-icon-button-light btnPlay autoSize'
            onClick={play}
        >
            <PlayArrowIcon />
        </IconButton>
    );
};

export default PlayAllButton;
