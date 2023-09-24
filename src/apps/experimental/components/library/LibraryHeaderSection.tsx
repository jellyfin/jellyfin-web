import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';

import {
    Chip,
    CircularProgress,
    Divider,
    MenuItem,
    TextField,
    Typography,
    useScrollTrigger
} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';

import globalize from 'scripts/globalize';
import { useLibrarySettings } from 'hooks/useLibrarySettings';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import { getItemTypesEnum } from 'utils/items';

import PlayAllButton from './PlayAllButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import FilterButton from './filter/FilterButton';
import NewCollectionButton from './NewCollectionButton';
import GridListViewButton from './GridListViewButton';

import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from 'types/collectionType';
import { ParentId } from 'types/library';

const visibleBtn = [
    LibraryTab.Movies,
    LibraryTab.Favorites,
    LibraryTab.Trailers,
    LibraryTab.Series,
    LibraryTab.Episodes,
    LibraryTab.Albums,
    LibraryTab.AlbumArtists,
    LibraryTab.Artists,
    LibraryTab.Collections,
    LibraryTab.Songs,
    LibraryTab.Photos,
    LibraryTab.Videos,
    LibraryTab.Channels
];

interface LibraryHeaderSectionProps {
    collectionType?: CollectionType;
    parentId?: ParentId;
    item?: BaseItemDto;
}

const LibraryHeaderSection: FC<LibraryHeaderSectionProps> = () => {
    const {
        item,
        viewSelectOptions,
        viewType,
        setViewType,
        libraryViewSettings,
        setLibraryViewSettings
    } = useLibrarySettings();

    const {
        isLoading,
        data: itemsResult,
        isFetching
    } = useGetItemsViewByType(viewType, item);

    const handleViewType = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value as LibraryTab;
            setViewType(value);
        },
        [setViewType]
    );

    const isBtnPlayAllEnabled =
        viewType !== LibraryTab.Collections
        && viewType !== LibraryTab.Trailers
        && viewType !== LibraryTab.AlbumArtists
        && viewType !== LibraryTab.Artists
        && viewType !== LibraryTab.Photos;

    const isBtnShuffleEnabled =
        viewType !== LibraryTab.Collections
        && viewType !== LibraryTab.Trailers
        && viewType !== LibraryTab.AlbumArtists
        && viewType !== LibraryTab.Artists
        && viewType !== LibraryTab.Photos;

    const isBtnGridListEnabled =
        viewType !== LibraryTab.Songs && viewType !== LibraryTab.Trailers;

    const isBtnSortEnabled = viewType !== LibraryTab.Collections;

    const isBtnFilterEnabled = viewType !== LibraryTab.Collections;

    const isBtnNewCollectionEnabled = viewType === LibraryTab.Collections;

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 1
    });

    return (
        <AppBar
            position='sticky'
            elevation={trigger ? 1 : 0}
            sx={{
                margin: 0,
                top: 48,
                background: trigger ? 'primary' : 'transparent'
            }}
        >
            <Toolbar
                variant='dense'
                sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: { xs: 2, sm: 5 }
                }}
            >
                <Stack
                    display='flex'
                    alignItems='center'
                    direction='row'
                    divider={<Divider orientation='vertical' flexItem />}
                    spacing={2}
                    sx={{
                        py: { xs: 1, sm: 0 }
                    }}
                >
                    <TextField
                        select
                        hiddenLabel
                        value={viewType}
                        size='small'
                        variant='filled'
                        onChange={handleViewType}
                    >
                        {viewSelectOptions.map((option) => {
                            return (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {globalize.translate(option.title)}
                                </MenuItem>
                            );
                        })}
                    </TextField>

                    {visibleBtn.includes(viewType) && (
                        <Chip
                            label={
                                isLoading || isFetching ? (
                                    <CircularProgress
                                        color='inherit'
                                        size={18}
                                    />
                                ) : (
                                    <Typography variant='subtitle1'>
                                        {totalRecordCount}
                                    </Typography>
                                )
                            }
                        />
                    )}
                </Stack>

                {visibleBtn.includes(viewType) && (
                    <Stack
                        display='flex'
                        alignItems='center'
                        direction='row'
                        spacing={1}
                        divider={
                            <Divider
                                orientation='vertical'
                                flexItem
                                variant='inset'
                            />
                        }
                        sx={{
                            py: { xs: 1, sm: 0 }
                        }}
                    >
                        {isBtnPlayAllEnabled && (
                            <PlayAllButton
                                item={item}
                                items={items}
                                viewType={viewType}
                                hasFilters={hasFilters}
                                libraryViewSettings={libraryViewSettings}
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
                                parentId={item?.Id}
                                itemType={getItemTypesEnum(viewType)}
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
                    </Stack>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default LibraryHeaderSection;
