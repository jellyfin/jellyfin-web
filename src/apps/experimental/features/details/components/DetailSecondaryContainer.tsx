import React, { type FC } from 'react';
import itemHelper from 'components/itemHelper';
import { playbackManager } from 'components/playback/playbackmanager';

import TrackSelections from './TrackSelections';

import type { ItemDto } from 'types/base/models/item-dto';
interface DetailSecondaryContainerProps {
    item: ItemDto;
    id: string | null;
    context: string | null;
    reloadItems?: () => void;
}

const DetailSecondaryContainer: FC<DetailSecondaryContainerProps> = ({
    item
    //id,
    //context,
    //reloadItems
}) => {
    return (
        <div className='detailPagePrimaryContent padded-right'>
            <div className='detailSection'>
                {!item.MediaSources
                || !itemHelper.supportsMediaSourceSelection(item)
                || playbackManager
                    .getSupportedCommands()
                    .indexOf('PlayMediaSource') === -1
                || !playbackManager.canPlay(item) ? null : (
                        <TrackSelections />
                    )}
            </div>
        </div>
    );
};

export default DetailSecondaryContainer;
