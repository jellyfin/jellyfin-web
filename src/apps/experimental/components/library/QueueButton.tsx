import React, { FC, useCallback } from 'react';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import QueueIcon from '@mui/icons-material/Queue';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { logger } from 'utils/logger';

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
            }).catch((err: unknown) => {
                logger.error('[QueueButton] failed to add to queue', { component: 'QueueButton' }, err as Error);
            });
        } else {
            playbackManager.queue({
                items
            }).catch((err: unknown) => {
                logger.error('[QueueButton] failed to add to queue', { component: 'QueueButton' }, err as Error);
            });
        }
    }, [hasFilters, item, items]);

    const label = globalize.translate('AddToPlayQueue');

    if (isTextVisible) {
        return (
            <Button
                variant="plain"
                color="neutral"
                startDecorator={<QueueIcon />}
                onClick={queue}
                sx={{ color: 'neutral.50' }}
            >
                {label}
            </Button>
        );
    }

    return (
        <Tooltip title={label} placement="top">
            <IconButton
                variant="plain"
                color="neutral"
                onClick={queue}
                sx={{ color: 'neutral.50' }}
                aria-label={label}
            >
                <QueueIcon />
            </IconButton>
        </Tooltip>
    );
};

export default QueueButton;
