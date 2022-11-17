import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';

import { playbackManager } from '../playback/playbackmanager';
import IconButton from '../../elements/emby-button/IconButton';

interface ShuffleProps {
    itemsResult?: BaseItemDtoQueryResult;
    topParentId: string | null;
}

const Shuffle: FC<ShuffleProps> = ({ topParentId }) => {
    const shuffle = () => {
        window.ApiClient.getItem(
            window.ApiClient.getCurrentUserId(),
            topParentId as string
        ).then((item) => {
            playbackManager.shuffle(item);
        });
    };

    return (
        <IconButton
            type='button'
            className='btnShuffle autoSize'
            title='Shuffle'
            icon='shuffle'
            onClick={shuffle}
        />
    );
};

export default Shuffle;
