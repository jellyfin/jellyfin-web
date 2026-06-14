import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type SetStateAction, useMemo, type FC } from 'react';

import FilterButton from 'apps/experimental/components/library/filter/FilterButton';
import LibraryViewMenu from 'apps/experimental/components/library/LibraryViewMenu';
import NewCollectionButton from 'apps/experimental/components/library/NewCollectionButton';
import NewPlaylistButton from 'apps/experimental/components/library/NewPlaylistButton';
import Pagination from 'apps/experimental/components/library/Pagination';
import PlayAllButton from 'apps/experimental/components/library/PlayAllButton';
import QueueButton from 'apps/experimental/components/library/QueueButton';
import ShuffleButton from 'apps/experimental/components/library/ShuffleButton';
import SortButton from 'apps/experimental/components/library/SortButton';
import ViewSettingsButton from 'apps/experimental/components/library/ViewSettingsButton';
import { playbackManager } from 'components/playback/playbackmanager';
import { useItem } from 'hooks/useItem';
import { useUserSettings } from 'hooks/useUserSettings';
import globalize from 'lib/globalize';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import { useLibrary } from '../hooks/useLibrary';
import { getDefaultLibraryViewSettings } from '../utils/settings';

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

    const { data: item } = useItem(parentId || undefined);

    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.TotalRecordCount ?? 0;
    const items = itemsResult?.data?.Items ?? [];
    const hasFilters = Object.values(viewSettings?.Filters ?? {}).some(
        (filter) => !!filter
    );

    // Pagination
    const startIndex = viewSettings?.StartIndex ?? 0;
    const { libraryPageSize: paginationLimit } = useUserSettings();
    const paginationStart = totalRecordCount ? startIndex + 1 : 0;
    const paginationEnd = paginationLimit ?
        Math.min(startIndex + paginationLimit, totalRecordCount) :
        totalRecordCount;
    /** True if the data is larger than the page limit */
    const isPaginationRequired = paginationLimit > 0 && paginationLimit < totalRecordCount;

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
                {!isPending && (
                    <>
                        <ButtonGroup
                            variant='contained'
                        >
                            {isBtnPlayAllEnabled && totalRecordCount > 0 && (
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

                            {isBtnShuffleEnabled && totalRecordCount > 1 && (
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

                        {isBtnNewCollectionEnabled && <NewCollectionButton isTextVisible={isSmallScreen} />}
                        {isBtnNewPlaylistEnabled && <NewPlaylistButton isTextVisible={isSmallScreen} />}
                    </>
                )}
            </Box>

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
                        marginTop: 0.5,
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
                        <Chip label={itemCountDisplay} />
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

                    {isPaginationEnabled && (
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
