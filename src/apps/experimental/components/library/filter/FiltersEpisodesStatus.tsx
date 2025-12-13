import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import globalize from '@/lib/globalize';
import { EpisodeFilter, LibraryViewSettings } from '@/types/library';

const episodeFilterOptions = [
    { label: 'OptionSpecialEpisode', value: EpisodeFilter.ParentIndexNumber },
    { label: 'OptionMissingEpisode', value: EpisodeFilter.IsMissing },
    { label: 'OptionUnairedEpisode', value: EpisodeFilter.IsUnaired }
];

interface FiltersEpisodesStatusProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersEpisodesStatus: FC<FiltersEpisodesStatusProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersEpisodesStatusChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as EpisodeFilter;
            const existingEpisodeFilter = libraryViewSettings?.Filters?.EpisodeFilter ?? [];

            const updatedEpisodeFilter = existingEpisodeFilter.includes(value) ?
                existingEpisodeFilter.filter((filter) => filter !== value) :
                [...existingEpisodeFilter, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    EpisodeFilter: updatedEpisodeFilter.length ? updatedEpisodeFilter : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.EpisodeFilter]
    );

    return (
        <FormGroup>
            {episodeFilterOptions.map((filter) => (
                <FormControlLabel
                    key={filter.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.EpisodeFilter?.includes(
                                    filter.value
                                )
                            }
                            onChange={onFiltersEpisodesStatusChange}
                            value={filter.value}
                        />
                    }
                    label={globalize.translate(filter.label)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersEpisodesStatus;
