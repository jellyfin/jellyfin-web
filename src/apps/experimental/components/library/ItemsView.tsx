import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FC } from 'react';
import Box from '@mui/material/Box';

import { useLibrarySettings } from 'hooks/useLibrarySettings';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import * as userSettings from 'scripts/settings/userSettings';
import Loading from 'components/loading/LoadingComponent';
import ItemsContainer from './ItemsContainer';
import Pagination from './Pagination';
import AlphabetPicker from './AlphabetPicker';
import { LibraryTab } from 'types/libraryTab';
import { ParentId } from 'types/library';
import { CollectionType } from 'types/collectionType';

const visibleAlphaPicker = [
    LibraryTab.Movies,
    LibraryTab.Favorites,
    LibraryTab.Trailers,
    LibraryTab.Series,
    LibraryTab.Episodes,
    LibraryTab.Albums,
    LibraryTab.AlbumArtists,
    LibraryTab.Artists
];

interface ItemsViewProps {
    collectionType?: CollectionType;
    parentId?: ParentId;
    item?: BaseItemDto;
    viewType: LibraryTab;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType
}) => {
    const { item, libraryViewSettings, setLibraryViewSettings } =
        useLibrarySettings();
    const {
        isLoading,
        data: itemsResult,
        isPreviousData
    } = useGetItemsViewByType(viewType, item);

    const limit = userSettings.libraryPageSize(undefined);
    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const showControls = limit > 0 && limit < totalRecordCount;
    const items = itemsResult?.Items ?? [];

    const hasSortName = libraryViewSettings.SortBy.includes(
        ItemSortBy.SortName
    );

    return (
        <Box sx={{ pt: 3, pb: 5 }}>
            {showControls && (
                <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPreviousData={isPreviousData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                </Box>
            )}

            {visibleAlphaPicker.includes(viewType) && hasSortName && (
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
                    collectionType={item?.CollectionType as CollectionType}
                    items={items}
                />
            )}

            {showControls && (
                <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPreviousData={isPreviousData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                </Box>
            )}
        </Box>
    );
};

export default ItemsView;
