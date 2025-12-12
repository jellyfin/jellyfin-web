import React, { FC, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import ExploreIcon from '@mui/icons-material/Explore';

import { playbackManager } from '@/components/playback/playbackmanager';
import globalize from '@/lib/globalize';
import type { ItemDto } from '@/types/base/models/item-dto';

interface InstantMixButtonProps {
    item?: ItemDto;
}

const InstantMixButton: FC<InstantMixButtonProps> = ({ item }) => {
    const onInstantMixClick = useCallback(() => {
        playbackManager.instantMix(item);
    }, [item]);

    return (
        <IconButton
            className='button-flat btnInstantMix'
            title={globalize.translate('HeaderInstantMix')}
            onClick={onInstantMixClick}
        >
            <ExploreIcon />
        </IconButton>
    );
};

export default InstantMixButton;
