import React, { type FC, useCallback } from 'react';
import { StackIcon } from '@radix-ui/react-icons';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { vars } from 'styles/tokens.css';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { logger } from 'utils/logger';

interface QueueButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    hasFilters: boolean;
    isTextVisible: boolean;
}

const QueueButton: FC<QueueButtonProps> = ({ item, items, hasFilters, isTextVisible }) => {
    const queue = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager
                .queue({
                    items: [item]
                })
                .catch((err: unknown) => {
                    logger.error('[QueueButton] failed to add to queue', { component: 'QueueButton' }, err as Error);
                });
        } else {
            playbackManager
                .queue({
                    items
                })
                .catch((err: unknown) => {
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
                startDecorator={<StackIcon />}
                onClick={queue}
                style={{ color: vars.colors.textSecondary }}
            >
                {label}
            </Button>
        );
    }

    return (
        <Tooltip title={label}>
            <IconButton variant="plain" color="neutral" onClick={queue} aria-label={label}>
                <StackIcon />
            </IconButton>
        </Tooltip>
    );
};

export default QueueButton;
