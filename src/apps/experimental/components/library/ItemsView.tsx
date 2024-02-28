import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ImageType } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { type FC, useCallback } from 'react';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItem, useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import { CardShape } from 'utils/card';
import Loading from 'components/loading/LoadingComponent';
import { playbackManager } from 'components/playback/playbackmanager';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import AlphabetPicker from './AlphabetPicker';
import FilterButton from './filter/FilterButton';
import NewCollectionButton from './NewCollectionButton';
import Pagination from './Pagination';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import GridListViewButton from './GridListViewButton';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Lists from 'components/listview/List/Lists';
import Cards from 'components/cardbuilder/Card/Cards';
import { LibraryTab } from 'types/libraryTab';
import { type LibraryViewSettings, type ParentId, ViewMode } from 'types/library';
import type { CardOptions } from 'types/cardOptions';
import type { ListOptions } from 'types/listOptions';

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    itemType: BaseItemKind[];
    collectionType?: CollectionType;
    isPaginationEnabled?: boolean;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    collectionType,
    isPaginationEnabled = true,
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
        isPreviousData,
        refetch
    } = useGetItemsViewByType(
        viewType,
        parentId,
        itemType,
        libraryViewSettings
    );
    const { data: item } = useGetItem(parentId);

    const getListOptions = useCallback(() => {
        const listOptions: ListOptions = {
            items: itemsResult?.Items ?? [],
            context: collectionType
        };

        if (viewType === LibraryTab.Songs) {
            listOptions.showParentTitle = true;
            listOptions.action = 'playallfromhere';
            listOptions.smallIcon = true;
            listOptions.artist = true;
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Albums) {
            listOptions.sortBy = libraryViewSettings.SortBy;
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Episodes) {
            listOptions.showParentTitle = true;
        }

        return listOptions;
    }, [itemsResult?.Items, collectionType, viewType, libraryViewSettings.SortBy]);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;

        if (libraryViewSettings.ImageType === ImageType.Banner) {
            shape = CardShape.Banner;
        } else if (libraryViewSettings.ImageType === ImageType.Disc) {
            shape = CardShape.Square;
            preferDisc = true;
        } else if (libraryViewSettings.ImageType === ImageType.Logo) {
            shape = CardShape.Backdrop;
            preferLogo = true;
        } else if (libraryViewSettings.ImageType === ImageType.Thumb) {
            shape = CardShape.Backdrop;
            preferThumb = true;
        } else {
            shape = CardShape.Auto;
        }

        const cardOptions: CardOptions = {
            shape: shape,
            showTitle: libraryViewSettings.ShowTitle,
            showYear: libraryViewSettings.ShowYear,
            cardLayout: libraryViewSettings.CardLayout,
            centerText: true,
            context: collectionType,
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayText: !libraryViewSettings.ShowTitle,
            imageType: libraryViewSettings.ImageType,
            queryKey: ['ItemsViewByType']
        };

        if (
            viewType === LibraryTab.Songs
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.Episodes
        ) {
            cardOptions.showParentTitle = libraryViewSettings.ShowTitle;
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Artists) {
            cardOptions.lines = 1;
            cardOptions.showYear = false;
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Channels) {
            cardOptions.shape = CardShape.Square;
            cardOptions.showDetailsMenu = true;
            cardOptions.showCurrentProgram = true;
            cardOptions.showCurrentProgramTime = true;
        } else if (viewType === LibraryTab.SeriesTimers) {
            cardOptions.shape = CardShape.Backdrop;
            cardOptions.showSeriesTimerTime = true;
            cardOptions.showSeriesTimerChannel = true;
            cardOptions.overlayMoreButton = true;
            cardOptions.lines = 3;
        } else if (viewType === LibraryTab.Movies) {
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Series || viewType === LibraryTab.Networks) {
            cardOptions.overlayMoreButton = true;
        }

        return cardOptions;
    }, [
        libraryViewSettings.ShowTitle,
        libraryViewSettings.ImageType,
        libraryViewSettings.ShowYear,
        libraryViewSettings.CardLayout,
        collectionType,
        viewType
    ]);

    const getItems = useCallback(() => {
        if (!itemsResult?.Items?.length) {
            return <NoItemsMessage noItemsMessage={noItemsMessage} />;
        }

        if (libraryViewSettings.ViewMode === ViewMode.ListView) {
            return (
                <Lists
                    items={itemsResult?.Items ?? []}
                    listOptions={getListOptions()}
                />
            );
        }
        return (
            <Cards
                items={itemsResult?.Items ?? []}
                cardOptions={getCardOptions()}
            />
        );
    }, [
        libraryViewSettings.ViewMode,
        itemsResult?.Items,
        getListOptions,
        getCardOptions,
        noItemsMessage
    ]);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );
    const hasSortName = libraryViewSettings.SortBy.includes(
        ItemSortBy.SortName
    );

    const itemsContainerClass = classNames(
        'centered padded-left padded-right padded-right-withalphapicker',
        libraryViewSettings.ViewMode === ViewMode.ListView ?
            'vertical-list' :
            'vertical-wrap'
    );
    return (
        <Box>
            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                {isPaginationEnabled && (
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPreviousData={isPreviousData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}

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
                    className={itemsContainerClass}
                    parentId={parentId}
                    reloadItems={refetch}
                    queryKey={['ItemsViewByType']}
                >
                    {getItems()}
                </ItemsContainer>
            )}

            {isPaginationEnabled && (
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
