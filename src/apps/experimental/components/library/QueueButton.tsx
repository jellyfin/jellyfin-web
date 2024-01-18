import type { BaseItemDto, SeriesTimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import QueueIcon from '@mui/icons-material/Queue';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';

interface QueueButtonProps {
    item: BaseItemDto | undefined
    items: BaseItemDto[] | SeriesTimerInfoDto[];
    hasFilters: boolean;
}

const QueueButton: FC<QueueButtonProps> = ({ item, items, hasFilters }) => {
    const queue = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.queue({
                items: [item]
            });
        } else {
            playbackManager.queue({
                items: items
            });
        }
    }, [hasFilters, item, items]);

    return (
        <IconButton
            title={globalize.translate('AddToPlayQueue')}
            className='paper-icon-button-light btnQueue autoSize'
            onClick={queue}
        >
            <QueueIcon />
        </IconButton>
    );
};

export default QueueButton;
