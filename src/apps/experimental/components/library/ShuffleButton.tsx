import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { FC, useCallback } from 'react';
import Shuffle from '@mui/icons-material/Shuffle';
import Button from '@mui/material/Button';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

interface ShuffleButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    collectionType: CollectionType | undefined
    hasFilters: boolean
    isTextVisible: boolean
    libraryViewSettings: LibraryViewSettings
}

const ShuffleButton: FC<ShuffleButtonProps> = ({
    item,
    items,
    viewType,
    collectionType,
    hasFilters,
    isTextVisible,
    libraryViewSettings
}) => {
    const shuffle = useCallback(() => {
        // For the Homevideos library Videos tab, pass items directly to playback since
        // the playback manager hardcodes MediaTypes: 'Photo' for the Homevideos library
        // which would exclude videos from the queue
        if (item && !hasFilters && !(viewType === LibraryTab.Videos && collectionType === CollectionType.Homevideos)) {
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
            }).catch(err => {
                console.error('[ShuffleButton] failed to play', err);
            });
        }
    }, [collectionType, hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            title={globalize.translate('Shuffle')}
            startIcon={isTextVisible ? <Shuffle /> : undefined}
            onClick={shuffle}
        >
            {isTextVisible ? (
                globalize.translate('Shuffle')
            ) : (
                <Shuffle />
            )}
        </Button>
    );
};

export default ShuffleButton;
