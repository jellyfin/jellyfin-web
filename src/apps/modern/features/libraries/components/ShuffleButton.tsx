import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { FC, useCallback } from 'react';
import Shuffle from '@mui/icons-material/Shuffle';
import Button from '@mui/material/Button';

import { useLibrary } from 'apps/modern/features/libraries/hooks/useLibrary';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

interface ShuffleButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    collectionType: CollectionType | undefined
    hasFilters: boolean
    isTextVisible: boolean
}

const ShuffleButton: FC<ShuffleButtonProps> = ({
    item,
    items,
    viewType,
    collectionType,
    hasFilters,
    isTextVisible
}) => {
    const { itemsResult } = useLibrary();
    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.TotalRecordCount ?? 0;

    const shuffle = useCallback(() => {
        // For the Homevideos library Videos tab, pass items directly to playback since
        // the playback manager hardcodes MediaTypes: 'Photo' for the Homevideos library
        // which would exclude videos from the queue
        if (item && !hasFilters && !(viewType === LibraryTab.Videos && collectionType === CollectionType.Homevideos)) {
            playbackManager.shuffle(item);
        } else {
            // items is already scoped to the active filters, so pass it through directly
            // rather than re-deriving a query (which previously reapplied list filters to the wrong item type)
            playbackManager.play({
                items,
                autoplay: true,
                shuffle: true
            }).catch(err => {
                console.error('[ShuffleButton] failed to play', err);
            });
        }
    }, [collectionType, hasFilters, item, items, viewType]);

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
