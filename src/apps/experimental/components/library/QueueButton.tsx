import React, { FC, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import QueueIcon from '@mui/icons-material/Queue';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

interface QueueButtonProps {
    item: ItemDto | undefined
    items: ItemDto[];
    hasFilters: boolean;
}

const QueueButton: FC<QueueButtonProps> = ({ item, items, hasFilters }) => {
    const queue = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.queue({
                items: [item]
            }).catch(err => {
                console.error('[QueueButton] failed to add to queue', err);
            });
        } else {
            playbackManager.queue({
                items
            }).catch(err => {
                console.error('[QueueButton] failed to add to queue', err);
            });
        }
    }, [hasFilters, item, items]);

    return (
        <IconButton
            title={globalize.translate('AddToPlayQueue')}
            className='paper-icon-button-light btnQueue autoSize'
            onClick={queue}
            sx={{
                order: {
                    xs: 3,
                    sm: 'unset'
                }
            }}
        >
            <QueueIcon />
        </IconButton>
    );
};

export default QueueButton;
