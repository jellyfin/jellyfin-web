import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type SetStateAction, useMemo, type FC } from 'react';

import { playbackManager } from 'components/playback/playbackmanager';
import { useApi } from 'hooks/useApi';
import { useItem } from 'hooks/useItem';
import { useUserSettings } from 'hooks/useUserSettings';
import globalize from 'lib/globalize';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import FilterButton from './filter/FilterButton';
import LibraryViewMenu from './LibraryViewMenu';
import NewCollectionButton from './NewCollectionButton';
import NewPlaylistButton from './NewPlaylistButton';
import Pagination from './Pagination';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import ViewSettingsButton from './ViewSettingsButton';

import { useLibrary } from '../hooks/useLibrary';
import { getDefaultLibraryViewSettings } from '../utils/settings';
import { getToolbarParentItemId } from '../utils/toolbar';

/** Views that only show the menu, not the toolbar buttons */
const MENU_ONLY_VIEWS = [
    LibraryTab.Genres,
    LibraryTab.Guide,
    LibraryTab.Suggestions,
    LibraryTab.Programs,
    LibraryTab.Recordings,
    LibraryTab.Schedule,
    LibraryTab.Upcoming
];

const LibraryToolbar: FC = () => {
    const {
        id: parentId,
        collectionType,
        content,
        isLibraryPath,
        itemsResult,
        viewSettings,
        setViewSettings
    } = useLibrary();
    const viewType = content?.viewType ?? LibraryTab.Movies;
    const libraryViewSettings = viewSettings ?? getDefaultLibraryViewSettings(viewType);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const setLibraryViewSettings = setViewSettings ?? ((action: SetStateAction<LibraryViewSettings>) => { /* no-op */ });
    const { itemType, isPaginationEnabled, isBtnPlayAllEnabled, isBtnQueueEnabled, isBtnShuffleEnabled, isBtnSortEnabled, isBtnFilterEnabled, isBtnNewCollectionEnabled, isBtnNewPlaylistEnabled, isBtnGridListEnabled } = content ?? {};

    const isSmallScreen = useMediaQuery(t => t.breakpoints.up('sm'));

    const parentItemId = getToolbarParentItemId({
        parentId,
        collectionType,
        isBtnPlayAllEnabled,
        isBtnQueueEnabled,
        isBtnShuffleEnabled
    });
    const { data: item } = useItem(parentItemId);

    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.TotalRecordCount ?? 0;
    const items = itemsResult?.data?.Items ?? [];
    const hasFilters = Object.values(viewSettings?.Filters ?? {}).some(
        (filter) => !!filter
    );
    const { user } = useApi();
    const canCreateCollections = user?.Policy?.IsAdministrator || user?.Policy?.EnableCollectionManagement;

    // The query key for all items for the current user.
    // This should be used to invalidate queries that affect multiple parents, such as collections and playlists.
    const allItemsQueryKey = useMemo(() => ['User', user?.Id, 'Items'], [user?.Id]);

    // Pagination
    const startIndex = viewSettings?.StartIndex ?? 0;
    const { libraryPageSize: paginationLimit } = useUserSettings();
    const paginationStart = totalRecordCount ? startIndex + 1 : 0;
    const paginationEnd = paginationLimit ?
        Math.min(startIndex + paginationLimit, totalRecordCount) :
        totalRecordCount;
    const isUserPaginationEnabled = paginationLimit > 0;
    /** True if the data is larger than the page limit */
    const isPaginationRequired = isUserPaginationEnabled && paginationLimit < totalRecordCount;

    const itemCountDisplay = useMemo(() => {
        if (isPending) return '\u2219'; // Bullet "operator" character as a loading indicator

        return isPaginationRequired ?
            globalize.translate('ListPaging', paginationStart, paginationEnd, totalRecordCount) :
            totalRecordCount;
    }, [isPending, isPaginationRequired, paginationStart, paginationEnd, totalRecordCount]);

    if (!isLibraryPath) return null;

    return (
        <Toolbar
            className='padded-left padded-right'
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}
        >
            <LibraryViewMenu />

            {!MENU_ONLY_VIEWS.includes(viewType) && (
                <Box
                    sx={{
                        display: 'flex',
                        flexGrow: {
                            xs: 1,
                            sm: 0
                        },
                        justifyContent: 'flex-end',
                        marginLeft: 1
                    }}
                >
                    <Chip label={itemCountDisplay} />
                </Box>
            )}

            {!MENU_ONLY_VIEWS.includes(viewType) && (
                <Stack
                    direction='row'
                    spacing={1}
                    sx={{
                        justifyContent: {
                            xs: 'auto',
                            sm: 'end'
                        },
                        flexBasis: {
                            xs: '100%',
                            sm: 'auto'
                        },
                        flexGrow: 1,
                        marginTop: {
                            xs: 1,
                            sm: 0.5
                        },
                        marginBottom: 0.5
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexGrow: {
                                xs: 1,
                                sm: 0
                            }
                        }}
                    >
                        <ButtonGroup
                            variant='contained'
                        >
                            {isBtnPlayAllEnabled && (
                                <PlayAllButton
                                    item={item}
                                    items={items}
                                    viewType={viewType}
                                    collectionType={collectionType}
                                    hasFilters={hasFilters}
                                    isTextVisible={isSmallScreen}
                                    libraryViewSettings={libraryViewSettings}
                                />
                            )}

                            {isBtnShuffleEnabled && (
                                <ShuffleButton
                                    item={item}
                                    items={items}
                                    viewType={viewType}
                                    collectionType={collectionType}
                                    hasFilters={hasFilters}
                                    isTextVisible={isSmallScreen && !isBtnPlayAllEnabled}
                                    libraryViewSettings={libraryViewSettings}
                                />
                            )}

                            {isBtnQueueEnabled && item && playbackManager.canQueue(item) && (
                                <QueueButton
                                    item={item}
                                    items={items}
                                    hasFilters={hasFilters}
                                    isTextVisible={isSmallScreen && !isBtnPlayAllEnabled && !isBtnShuffleEnabled}
                                />
                            )}
                        </ButtonGroup>

                        {isBtnNewCollectionEnabled && canCreateCollections && (
                            <NewCollectionButton isTextVisible={isSmallScreen} queryKey={allItemsQueryKey} />
                        )}
                        {isBtnNewPlaylistEnabled && (
                            <NewPlaylistButton isTextVisible={isSmallScreen} queryKey={allItemsQueryKey} />
                        )}
                    </Box>

                    <ButtonGroup
                        color='inherit'
                        variant='text'
                    >
                        {isBtnFilterEnabled && (
                            <FilterButton
                                parentId={parentId}
                                itemType={itemType ?? []}
                                viewType={viewType}
                                hasFilters={hasFilters}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}

                        {isBtnSortEnabled && (
                            <SortButton
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}

                        {isBtnGridListEnabled && (
                            <ViewSettingsButton
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}
                    </ButtonGroup>

                    {isPaginationEnabled && isUserPaginationEnabled && (
                        <Pagination
                            setLibraryViewSettings={setLibraryViewSettings}
                            index={startIndex}
                            pageSize={paginationLimit}
                            total={totalRecordCount}
                            disabled={isPending || !isPaginationRequired || itemsResult?.isPlaceholderData}
                        />
                    )}
                </Stack>
            )}
        </Toolbar>
    );
};

export default LibraryToolbar;
