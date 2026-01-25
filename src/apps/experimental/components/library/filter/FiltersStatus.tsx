import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';

import globalize from 'lib/globalize';
import { type LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const statusFiltersOptions = [
    { label: 'Played', value: ItemFilter.IsPlayed },
    { label: 'Unplayed', value: ItemFilter.IsUnplayed },
    { label: 'Favorite', value: ItemFilter.IsFavorite },
    { label: 'ContinueWatching', value: ItemFilter.IsResumable }
];

interface FiltersStatusProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersStatus: FC<FiltersStatusProps> = ({ viewType, libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersStatusChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as ItemFilter;
            const existingStatus = libraryViewSettings?.Filters?.Status ?? [];

            const updatedStatus = existingStatus.includes(value)
                ? existingStatus.filter(filter => filter !== value)
                : [...existingStatus, value];

            setLibraryViewSettings(prevState => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Status: updatedStatus.length ? updatedStatus : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Status]
    );

    const getVisibleFiltersStatus = () => {
        const visibleFiltersStatus: ItemFilter[] = [ItemFilter.IsFavorite];

        if (
            viewType !== LibraryTab.Albums &&
            viewType !== LibraryTab.Artists &&
            viewType !== LibraryTab.AlbumArtists &&
            viewType !== LibraryTab.Songs &&
            viewType !== LibraryTab.Channels &&
            viewType !== LibraryTab.PhotoAlbums &&
            viewType !== LibraryTab.Photos
        ) {
            visibleFiltersStatus.push(ItemFilter.IsUnplayed);
            visibleFiltersStatus.push(ItemFilter.IsPlayed);
            visibleFiltersStatus.push(ItemFilter.IsResumable);
        }

        return visibleFiltersStatus;
    };

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.xs }}>
            {statusFiltersOptions
                .filter(filter => getVisibleFiltersStatus().includes(filter.value))
                .map(filter => (
                    <Checkbox
                        key={filter.value}
                        checked={!!libraryViewSettings?.Filters?.Status?.includes(filter.value)}
                        onChange={onFiltersStatusChange}
                        value={filter.value}
                    >
                        {globalize.translate(filter.label)}
                    </Checkbox>
                ))}
        </Box>
    );
};

export default FiltersStatus;
