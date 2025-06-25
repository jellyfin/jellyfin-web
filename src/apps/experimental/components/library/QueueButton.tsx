import { FC, useCallback } from 'react';
import Button from '@mui/material/Button';
import Queue from '@mui/icons-material/Queue';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

interface QueueButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    hasFilters: boolean
    isTextVisible: boolean
}

const QueueButton: FC<QueueButtonProps> = ({
    item,
    items,
    hasFilters,
    isTextVisible
}) => {
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
        <Button
            title={globalize.translate('AddToPlayQueue')}
            startIcon={isTextVisible ? <Queue /> : undefined}
            onClick={queue}
        >
            {isTextVisible ? (
                globalize.translate('AddToPlayQueue')
            ) : (
                <Queue />
            )}
        </Button>
    );
};

export default QueueButton;
