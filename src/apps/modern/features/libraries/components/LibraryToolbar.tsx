import FilterAltOff from '@mui/icons-material/FilterAltOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type SetStateAction, useMemo, type FC } from 'react';

import { playbackManager } from 'components/playback/playbackmanager';
import { useApi } from 'hooks/useApi';
import { useItem } from 'hooks/useItem';
import globalize from 'lib/globalize';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import FilterButton from './filter/FilterButton';
import LibraryViewMenu from './LibraryViewMenu';
import NewCollectionButton from './NewCollectionButton';
import NewPlaylistButton from './NewPlaylistButton';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import ViewSettingsButton from './ViewSettingsButton';

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
    const { itemType, isBtnPlayAllEnabled, isBtnQueueEnabled, isBtnShuffleEnabled, isBtnSortEnabled, isBtnFilterEnabled, isBtnNewCollectionEnabled, isBtnNewPlaylistEnabled, isBtnGridListEnabled } = content ?? {};

    const isSmallScreen = useMediaQuery(t => t.breakpoints.up('sm'));

    const { data: item } = useItem(parentId || undefined);

    const isPending = itemsResult?.isPending ?? true;
    const totalRecordCount = itemsResult?.data?.pages[0]?.TotalRecordCount ?? 0;
    const items = useMemo(
        () => itemsResult?.data?.pages.flatMap((page) => page?.Items ?? []) ?? [],
        [itemsResult?.data]
    );
    const hasFilterOptions = Object.values(viewSettings?.Filters ?? {}).some(f => !!f);
    const hasFilters = !!viewSettings?.Alphabet || hasFilterOptions;
    const { user } = useApi();
    const canCreateCollections = user?.Policy?.IsAdministrator || user?.Policy?.EnableCollectionManagement;

    // The query key for all items for the current user.
    // This should be used to invalidate queries that affect multiple parents, such as collections and playlists.
    const allItemsQueryKey = useMemo(() => ['User', user?.Id, 'Items'], [user?.Id]);

    const itemCountDisplay = useMemo(
        // Bullet "operator" character as a loading indicator
        () => (isPending ? '\u2219' : totalRecordCount.toLocaleString()),
        [isPending, totalRecordCount]
    );

    if (!isLibraryPath) return null;

    return (
        <Toolbar
            variant='dense'
            className='padded-left padded-right'
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}
        >
            <LibraryViewMenu />

            {!MENU_ONLY_VIEWS.includes(viewType) && (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {
                                xs: 'row-reverse',
                                sm: 'row'
                            },
                            flexGrow: {
                                xs: 1,
                                sm: 0
                            },
                            justifyContent: 'flex-start',
                            marginLeft: 1
                        }}
                    >
                        <Chip label={itemCountDisplay} />

                        {hasFilters && (
                            <Button
                                variant='text'
                                color='primary'
                                startIcon={<FilterAltOff />}
                                onClick={() => setLibraryViewSettings(prevState => ({
                                    ...prevState,
                                    StartIndex: 0,
                                    Alphabet: undefined,
                                    Filters: undefined
                                }))}
                                sx={{
                                    marginLeft: {
                                        xs: 0,
                                        sm: 1
                                    },
                                    marginRight: {
                                        xs: 1,
                                        sm: 0
                                    }
                                }}
                            >
                                {globalize.translate('ResetFilters')}
                            </Button>
                        )}
                    </Box>

                    <Stack
                        direction='row'
                        spacing={1}
                        sx={{
                            justifyContent: {
                                xs: 'auto',
                                sm: 'flex-end'
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
                                size={isSmallScreen ? undefined : 'small'}
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
                            size={isSmallScreen ? undefined : 'small'}
                        >
                            {isBtnFilterEnabled && (
                                <FilterButton
                                    parentId={parentId}
                                    itemType={itemType ?? []}
                                    viewType={viewType}
                                    hasFilters={hasFilterOptions}
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

                    </Stack>
                </>
            )}
        </Toolbar>
    );
};

export default LibraryToolbar;
