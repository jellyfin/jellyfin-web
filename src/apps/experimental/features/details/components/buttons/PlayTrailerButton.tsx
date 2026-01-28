import React, { type FC, useCallback } from 'react';
import { IconButton } from 'ui-primitives';
import { VideoIcon } from '@radix-ui/react-icons';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

interface PlayTrailerButtonProps {
    item?: ItemDto;
}

const PlayTrailerButton: FC<PlayTrailerButtonProps> = ({ item }) => {
    const onPlayTrailerClick = useCallback(async () => {
        await playbackManager.playTrailers(item);
    }, [item]);

    return (
        <IconButton
            className="button-flat btnPlayTrailer"
            title={globalize.translate('ButtonTrailer')}
            onClick={onPlayTrailerClick}
        >
            <VideoIcon />
        </IconButton>
    );
};

export default PlayTrailerButton;
