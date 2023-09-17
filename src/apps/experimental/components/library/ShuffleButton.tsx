import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';

import { useGetItems } from 'hooks/useFetchItems';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

interface ShuffleButtonProps {
    item: BaseItemDto | undefined
    itemType: BaseItemKind;
    viewType: LibraryTab
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings
}

const ShuffleButton: FC<ShuffleButtonProps> = ({ item, itemType, viewType, hasFilters, libraryViewSettings }) => {
    const getParametersOptions = () => {
        return {
            ...getFiltersQuery(viewType, libraryViewSettings),
            limit: 300,
            sortBy: [ItemSortBy.Random],
            includeItemTypes: [itemType],
            recursive: true,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.SortName,
                ItemFields.ChildCount,
                ItemFields.MediaSourceCount
            ],
            imageTypeLimit: 1,
            parentId: item?.Id ? item.Id : undefined,
            startIndex: 0
        };
    };

    const { data: itemsResult } = useGetItems(getParametersOptions());

    const shuffle = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.shuffle(item);
        } else {
            playbackManager.play({
                items: itemsResult?.Items
            });
        }
    }, [hasFilters, item, itemsResult?.Items]);

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
