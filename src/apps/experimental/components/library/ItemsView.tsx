import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FC } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItem, useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import Loading from 'components/loading/LoadingComponent';
import { playbackManager } from 'components/playback/playbackmanager';
import AlphabetPicker from './AlphabetPicker';
import FilterButton from './filter/FilterButton';
import ItemsContainer from './ItemsContainer';
import NewCollectionButton from './NewCollectionButton';
import Pagination from './Pagination';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import GridListViewButton from './GridListViewButton';
import { LibraryViewSettings, ParentId } from 'types/library';
import { CollectionType } from 'types/collectionType';
import { LibraryTab } from 'types/libraryTab';

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    collectionType?: CollectionType;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    itemType: BaseItemKind[];
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    collectionType,
    isBtnPlayAllEnabled = false,
    isBtnQueueEnabled = false,
    isBtnShuffleEnabled = false,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isBtnGridListEnabled = true,
    isAlphabetPickerEnabled = true,
    itemType,
    noItemsMessage
}) => {
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(viewType, parentId),
            getDefaultLibraryViewSettings(viewType)
        );

    const {
        isLoading,
        data: itemsResult,
        isFetching,
        isPreviousData
    } = useGetItemsViewByType(
        viewType,
        parentId,
        itemType,
        libraryViewSettings
    );
    const { data: item } = useGetItem(parentId);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );
    const hasSortName = libraryViewSettings.SortBy.includes(
        ItemSortBy.SortName
    );

    return (
        <Box>
            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPreviousData={isPreviousData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />

                <Box sx={{ display: 'flex', width: '20px', height: '20px', padding: '8px' }} >
                    {isFetching ? <CircularProgress size={20} /> : null}
                </Box>

                {isBtnPlayAllEnabled && (
                    <PlayAllButton
                        item={item}
                        items={items}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                    />
                )}
                {isBtnQueueEnabled
                    && item
                    && playbackManager.canQueue(item) && (
                    <QueueButton
                        item={item}
                        items={items}
                        hasFilters={hasFilters}
                    />
                )}
                {isBtnShuffleEnabled && totalRecordCount > 1 && (
                    <ShuffleButton
                        item={item}
                        items={items}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                    />
                )}
                {isBtnSortEnabled && (
                    <SortButton
                        viewType={viewType}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
                {isBtnFilterEnabled && (
                    <FilterButton
                        parentId={parentId}
                        itemType={itemType}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
                {isBtnNewCollectionEnabled && <NewCollectionButton />}
                {isBtnGridListEnabled && (
                    <GridListViewButton
                        viewType={viewType}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
            </Box>

            {isAlphabetPickerEnabled && hasSortName && (
                <AlphabetPicker
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            )}

            {isLoading ? (
                <Loading />
            ) : (
                <ItemsContainer
                    libraryViewSettings={libraryViewSettings}
                    viewType={viewType}
                    collectionType={collectionType}
                    noItemsMessage={noItemsMessage}
                    items={items}
                />
            )}

            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPreviousData={isPreviousData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            </Box>
        </Box>
    );
};

export default ItemsView;
