import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { type FC, useCallback } from 'react';
import { ShuffleIcon } from '@radix-ui/react-icons';
import { Button } from 'ui-primitives/Button';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { type LibraryViewSettings } from 'types/library';
import { type LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

interface ShuffleButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    hasFilters: boolean
    isTextVisible: boolean
    libraryViewSettings: LibraryViewSettings
}

const ShuffleButton: FC<ShuffleButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    isTextVisible,
    libraryViewSettings
}) => {
    const shuffle = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.shuffle(item);
        } else {
            playbackManager.play({
                items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [ItemSortBy.Random]
                }
            }).catch((err: unknown) => {
                console.error('[ShuffleButton] failed to play', err);
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            title={globalize.translate('Shuffle')}
            startIcon={isTextVisible ? <ShuffleIcon /> : undefined}
            variant='plain'
            onClick={shuffle}
        >
            {isTextVisible ? (
                globalize.translate('Shuffle')
            ) : (
                <ShuffleIcon />
            )}
        </Button>
    );
};

export default ShuffleButton;
