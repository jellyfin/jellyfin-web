import React, { FC, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import TheatersIcon from '@mui/icons-material/Theaters';

import { playbackManager } from '@/components/playback/playbackmanager';
import globalize from '@/lib/globalize';
import type { ItemDto } from '@/types/base/models/item-dto';

interface PlayTrailerButtonProps {
    item?: ItemDto;
}

const PlayTrailerButton: FC<PlayTrailerButtonProps> = ({ item }) => {
    const onPlayTrailerClick = useCallback(async () => {
        await playbackManager.playTrailers(item);
    }, [item]);

    return (
        <IconButton
            className='button-flat btnPlayTrailer'
            title={globalize.translate('ButtonTrailer')}
            onClick={onPlayTrailerClick}
        >
            <TheatersIcon />
        </IconButton>
    );
};

export default PlayTrailerButton;
