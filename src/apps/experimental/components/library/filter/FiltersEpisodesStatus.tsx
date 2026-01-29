import globalize from 'lib/globalize';
import React, { type FC, useCallback } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { EpisodeFilter, type LibraryViewSettings } from 'types/library';
import { Box, Checkbox } from 'ui-primitives';

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
        (filterValue: EpisodeFilter) => {
            const existingEpisodeFilter = libraryViewSettings?.Filters?.EpisodeFilter ?? [];

            const updatedEpisodeFilter = existingEpisodeFilter.includes(filterValue)
                ? existingEpisodeFilter.filter((filter) => filter !== filterValue)
                : [...existingEpisodeFilter, filterValue];

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
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {episodeFilterOptions.map((filter) => (
                <Checkbox
                    key={filter.value}
                    checked={!!libraryViewSettings?.Filters?.EpisodeFilter?.includes(filter.value)}
                    onChangeChecked={(checked) => {
                        if (!checked) {
                            onFiltersEpisodesStatusChange(filter.value);
                        } else {
                            onFiltersEpisodesStatusChange(filter.value);
                        }
                    }}
                >
                    {globalize.translate(filter.label)}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersEpisodesStatus;
