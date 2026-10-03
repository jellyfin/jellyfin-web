import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { FC, useCallback } from 'react';
import Shuffle from '@mui/icons-material/Shuffle';
import Button from '@mui/material/Button';

import { useLibrary } from 'apps/modern/features/libraries/hooks/useLibrary';
import { getHomeVideosPlaybackMediaType, toPlaybackQuery } from 'apps/modern/features/libraries/utils/playbackQuery';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

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
    const { itemsResult } = useLibrary();
    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.TotalRecordCount ?? 0;

    const shuffle = useCallback(() => {
        if (item && collectionType === CollectionType.Homevideos) {
            // Queue the whole library (not only the page that is currently loaded) with the
            // active filters applied, limited to the media type of the current tab since
            // mixed photo/video queues are not supported
            playbackManager.play({
                items: [item],
                shuffle: true,
                autoplay: true,
                queryOptions: {
                    ...toPlaybackQuery(getFiltersQuery(viewType, libraryViewSettings)),
                    MediaTypes: getHomeVideosPlaybackMediaType(viewType, collectionType)
                }
            }).catch(err => {
                console.error('[ShuffleButton] failed to play', err);
            });
        } else if (item && !hasFilters) {
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
            disabled={isPending || totalRecordCount <= 1}
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
