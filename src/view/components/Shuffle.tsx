import { BaseItemDtoQueryResult } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';

import { playbackManager } from '../../components/playback/playbackmanager';
import IconButtonElement from '../../elements/IconButtonElement';

type ShuffleProps = {
    itemsResult?: BaseItemDtoQueryResult;
    topParentId: string | null;
}

const Shuffle: FunctionComponent<ShuffleProps> = ({ itemsResult = {}, topParentId }: ShuffleProps) => {
    const element = useRef<HTMLDivElement>(null);

    const shuffle = useCallback(() => {
        window.ApiClient.getItem(
            window.ApiClient.getCurrentUserId(),
            topParentId as string
        ).then((item) => {
            playbackManager.shuffle(item);
        });
    }, [topParentId]);

    useEffect(() => {
        const btnShuffle = element.current?.querySelector('.btnShuffle');
        if (btnShuffle) {
            btnShuffle.addEventListener('click', shuffle);
        }
    }, [itemsResult.TotalRecordCount, shuffle]);

    return (
        <div ref={element}>
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnShuffle autoSize'
                title='Shuffle'
                icon='material-icons shuffle'
            />
        </div>
    );
};

export default Shuffle;
