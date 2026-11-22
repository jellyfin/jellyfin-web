import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import React, { type FC, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';

import { fetchGetItemsViewByType } from 'apps/modern/features/libraries/hooks/api/useItemsViewByType';
import { useLibrary } from 'apps/modern/features/libraries/hooks/useLibrary';
import { getDefaultLibraryViewSettings } from 'apps/modern/features/libraries/utils/settings';
import Cards from 'components/cardbuilder/Card/Cards';
import { CardShape } from 'components/cardbuilder/utils/shape';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Lists from 'components/listview/List/Lists';
import Loading from 'components/loading/LoadingComponent';
import { ItemAction } from 'constants/itemAction';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import { useApi } from 'hooks/useApi';
import * as userSettings from 'scripts/settings/userSettings';
import type { CardOptions } from 'types/cardOptions';
import { type LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ListOptions } from 'types/listOptions';

import AlphabetPicker from './AlphabetPicker';
import useMediaQuery from '@mui/material/useMediaQuery';

const ItemsView: FC = () => {
    const {
        id: parentId,
        collectionType,
        content,
        itemsResult,
        viewSettings,
        setViewSettings
    } = useLibrary();
    const viewType = content?.viewType ?? LibraryTab.Movies;
    const libraryViewSettings = viewSettings ?? getDefaultLibraryViewSettings(viewType);
    const setLibraryViewSettings = useMemo(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        () => setViewSettings ?? ((action: SetStateAction<LibraryViewSettings>) => { /* no-op */ }),
        [setViewSettings]
    );
    const { isAlphabetPickerEnabled, noItemsMessage } = content ?? {};
    // Check if the alphabet picker will fit in the current viewport
    const isAlphabetPickerSupported = useMediaQuery(t => [
        // Extra small screens have no padding around letters but larger AppBar
        `${t.breakpoints.down('sm')} and (min-height: 575px)`,
        // Small screens have padding around letters but smaller AppBar
        // NOTE: Helper methods down/up add "@media" to the query string so use the value directly
        `(min-width: ${t.breakpoints.values.sm}px) and (min-height: 610px)`
    ].join(', '));

    const currentApi = useApi();
    const { serverId, user } = currentApi;

    // The query key for all items for the current user.
    // This should be used to invalidate queries that affect multiple parents, such as collections and playlists.
    const allItemsQueryKey = useMemo(() => ['User', user?.Id, 'Items'], [user?.Id]);
    // The query key for all views for the current parent item.
    const allViewsQueryKey = useMemo(() => [...allItemsQueryKey, parentId, 'ViewByType'], [allItemsQueryKey, parentId]);

    const getListOptions = useCallback(() => {
        const listOptions: ListOptions = {
            items: itemsResult?.data?.Items ?? [],
            context: collectionType
        };

        if (viewType === LibraryTab.Songs) {
            listOptions.showParentTitle = true;
            listOptions.action = ItemAction.PlayAllFromHere;
            listOptions.smallIcon = true;
            listOptions.showArtist = true;
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Albums) {
            listOptions.sortBy = libraryViewSettings.SortBy[0];
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Episodes) {
            listOptions.showParentTitle = true;
        }

        return listOptions;
    }, [itemsResult?.data?.Items, collectionType, viewType, libraryViewSettings.SortBy]);

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
            shape,
            showTitle: libraryViewSettings.ShowTitle,
            showYear: libraryViewSettings.ShowYear,
            cardLayout: libraryViewSettings.CardLayout,
            centerText: true,
            context: collectionType,
            coverImage: true,
            preferThumb,
            preferDisc,
            preferLogo,
            overlayText: !libraryViewSettings.ShowTitle,
            imageType: libraryViewSettings.ImageType,
            queryKey: allViewsQueryKey,
            serverId
        };

        if (
            viewType === LibraryTab.Songs
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.Episodes
        ) {
            cardOptions.showParentTitle = libraryViewSettings.ShowTitle;
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Artists || viewType === LibraryTab.Authors || viewType === LibraryTab.Persons) {
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
        } else if (viewType === LibraryTab.Series || viewType === LibraryTab.Studios) {
            cardOptions.overlayMoreButton = true;
        }

        return cardOptions;
    }, [
        libraryViewSettings.ShowTitle,
        libraryViewSettings.ImageType,
        libraryViewSettings.ShowYear,
        libraryViewSettings.CardLayout,
        collectionType,
        allViewsQueryKey,
        serverId,
        viewType
    ]);

    const getItems = useCallback(() => {
        if (!itemsResult?.data?.Items?.length) {
            return <NoItemsMessage message={noItemsMessage ?? 'MessageNoItemsAvailable'} />;
        }

        if (libraryViewSettings.ViewMode === ViewMode.ListView) {
            return (
                <Lists
                    items={itemsResult?.data?.Items ?? []}
                    listOptions={getListOptions()}
                />
            );
        }
        return (
            <Cards
                items={itemsResult?.data?.Items ?? []}
                cardOptions={getCardOptions()}
            />
        );
    }, [
        libraryViewSettings.ViewMode,
        itemsResult?.data?.Items,
        getListOptions,
        getCardOptions,
        noItemsMessage
    ]);

    const isAlphabetJumpMode = userSettings.libraryAlphabetPickerMode(undefined) === 'jump';
    const rootRef = useRef<HTMLDivElement>(null);
    const pendingJumpIndex = useRef<number | null>(null);

    const scrollToItemIndex = useCallback((index: number) => {
        // Each item can contain several [data-id] elements, so keep the first element per item id
        const seen = new Set<string>();
        const elements = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.itemsContainer [data-id]') ?? [])
            .filter(el => {
                const id = el.dataset.id ?? '';
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        const target = elements[Math.min(index, elements.length - 1)];
        if (!target) return;
        // Scroll so the item lands just below the fixed app bar instead of underneath it
        const appBar = document.querySelector('.MuiAppBar-root');
        const offset = (appBar?.getBoundingClientRect().bottom ?? 0) + 8;
        window.scrollTo({
            top: window.scrollY + target.getBoundingClientRect().top - offset,
            behavior: 'smooth'
        });
    }, []);

    useEffect(() => {
        if (pendingJumpIndex.current !== null && itemsResult?.data && !itemsResult.isFetching) {
            scrollToItemIndex(pendingJumpIndex.current);
            pendingJumpIndex.current = null;
        }
    }, [itemsResult?.data, itemsResult?.isFetching, scrollToItemIndex]);

    const jumpToLetter = useCallback(async (letter: string) => {
        // Count the items sorted before the letter (with the current filters) to find where it starts
        const countBefore = async (nameLessThan?: string) => {
            const result = await fetchGetItemsViewByType(
                currentApi, viewType, parentId, content?.itemType ?? [],
                { ...libraryViewSettings, StartIndex: 0 },
                undefined,
                { nameLessThan, limit: 0, startIndex: 0, enableTotalRecordCount: true }
            );
            return result.TotalRecordCount ?? 0;
        };
        const isDescending = libraryViewSettings.SortOrder === SortOrder.Descending;
        let index = 0;
        if (!isDescending) {
            index = letter === '#' ? 0 : await countBefore(letter);
        } else {
            const total = await countBefore();
            const next = letter === '#' ? 'A' : String.fromCodePoint(letter.codePointAt(0)! + 1);
            index = letter === 'Z' ? 0 : total - await countBefore(next);
        }

        const pageSize = userSettings.libraryPageSize(undefined);
        const startIndex = pageSize > 0 ? Math.floor(index / pageSize) * pageSize : 0;
        if (startIndex !== (libraryViewSettings.StartIndex ?? 0)) {
            pendingJumpIndex.current = index - startIndex;
            setLibraryViewSettings((prevState) => ({ ...prevState, StartIndex: startIndex, Alphabet: null }));
        } else {
            scrollToItemIndex(index - startIndex);
        }
    }, [currentApi, viewType, parentId, content?.itemType, libraryViewSettings, setLibraryViewSettings, scrollToItemIndex]);

    const handleAlphabetChange = useCallback((newValue: string | null | undefined) => {
        if (isAlphabetJumpMode) {
            if (newValue) {
                jumpToLetter(newValue).catch(err => console.error('[ItemsView] failed to jump to letter', err));
            }
            return;
        }

        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: 0,
            Alphabet: newValue
        }));
    }, [isAlphabetJumpMode, jumpToLetter, setLibraryViewSettings]);

    const hasSortName = !libraryViewSettings.SortBy.includes(ItemSortBy.Random);

    const itemsContainerClass = classNames(
        'padded-left padded-right',
        libraryViewSettings.ViewMode === ViewMode.ListView ?
            'vertical-list' :
            'vertical-wrap'
    );

    return (
        <Box ref={rootRef} className='padded-bottom-page'>
            {isAlphabetPickerSupported && isAlphabetPickerEnabled && hasSortName && (
                <AlphabetPicker
                    value={isAlphabetJumpMode ? null : libraryViewSettings.Alphabet}
                    onChange={handleAlphabetChange}
                />
            )}

            {(!itemsResult || itemsResult.isPending) ? (
                <Loading />
            ) : (
                <ItemsContainer
                    className={itemsContainerClass}
                    parentId={parentId}
                    reloadItems={itemsResult?.refetch}
                    queryKey={allItemsQueryKey}
                >
                    {getItems()}
                </ItemsContainer>
            )}
        </Box>
    );
};

export default ItemsView;
