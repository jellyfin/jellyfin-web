import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

interface ShuffleButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings
}

const ShuffleButton: FC<ShuffleButtonProps> = ({ item, items, viewType, hasFilters, libraryViewSettings }) => {
    const shuffle = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.shuffle(item);
        } else {
            playbackManager.play({
                items: items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [ItemSortBy.Random]
                }
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <IconButton
            title={globalize.translate('Shuffle')}
            className='paper-icon-button-light btnShuffle autoSize'
            onClick={shuffle}
        >
            <ShuffleIcon />
        </IconButton>
    );
};

export default ShuffleButton;
