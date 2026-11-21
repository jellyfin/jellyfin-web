import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { FC, useCallback, useState } from 'react';
import Shuffle from '@mui/icons-material/Shuffle';
import Button from '@mui/material/Button';

import { getItemsViewRequest } from 'apps/modern/features/libraries/hooks/api/useItemsViewByType';
import { useLibrary } from 'apps/modern/features/libraries/hooks/useLibrary';
import { getShuffleItemsRequest, isServerShuffleTab } from 'apps/modern/features/libraries/utils/shuffle';
import { playbackManager } from 'components/playback/playbackmanager';
import toast from 'components/toast/toast';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { getItems } from 'lib/jellyfin-apiclient/utils/getItems';
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
    const { api, user } = useApi();
    const { id: parentId, content, itemsResult } = useLibrary();
    const [ isShuffling, setIsShuffling ] = useState(false);
    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.TotalRecordCount ?? 0;
    const itemType = content?.itemType;

    const shuffleFromServer = useCallback(async () => {
        let shuffledItems: BaseItemDto[];

        // Only lock the button while fetching, so it is not left disabled if playback never starts
        setIsShuffling(true);
        try {
            if (!api || !user?.Id) {
                throw new Error('No API or user available');
            }
            // Without item types the request would return every kind of item in the library
            if (!itemType?.length) {
                throw new Error(`No item types defined for the ${viewType} view`);
            }

            // Fetch a random selection with the same filters as the library view, so the queue is
            // shuffled and not limited to the current page
            const { Items } = await getItems(api, getShuffleItemsRequest(
                getItemsViewRequest(user.Id, viewType, parentId, itemType, libraryViewSettings)
            ));
            if (!Items?.length) {
                throw new Error('No items returned');
            }
            shuffledItems = Items;
        } catch (err) {
            console.error('[ShuffleButton] failed to fetch shuffled items', err);
            toast(globalize.translate('ErrorDefault'));
            return;
        } finally {
            setIsShuffling(false);
        }

        try {
            await playbackManager.play({
                items: shuffledItems,
                autoplay: true
            });
        } catch (err) {
            console.error('[ShuffleButton] failed to play shuffled items', err);
        }
    }, [api, itemType, libraryViewSettings, parentId, user?.Id, viewType]);

    const shuffle = useCallback(() => {
        // For the Homevideos library Videos tab, pass items directly to playback since
        // the playback manager hardcodes MediaTypes: 'Photo' for the Homevideos library
        // which would exclude videos from the queue
        if (item && !hasFilters && !(viewType === LibraryTab.Videos && collectionType === CollectionType.Homevideos)) {
            playbackManager.shuffle(item);
        } else if (isServerShuffleTab(viewType)) {
            void shuffleFromServer();
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
    }, [collectionType, hasFilters, item, items, libraryViewSettings, shuffleFromServer, viewType]);

    return (
        <Button
            title={globalize.translate('Shuffle')}
            startIcon={isTextVisible ? <Shuffle /> : undefined}
            onClick={shuffle}
            disabled={isPending || isShuffling || totalRecordCount <= 1}
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
