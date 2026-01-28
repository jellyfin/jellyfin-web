import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import globalize from 'lib/globalize';
import { FeatureFilters, type LibraryViewSettings } from 'types/library';

const featuresOptions = [
    { label: 'Subtitles', value: FeatureFilters.HasSubtitles },
    { label: 'Trailers', value: FeatureFilters.HasTrailer },
    { label: 'Extras', value: FeatureFilters.HasSpecialFeature },
    { label: 'ThemeSongs', value: FeatureFilters.HasThemeSong },
    { label: 'ThemeVideos', value: FeatureFilters.HasThemeVideo }
];

interface FiltersFeaturesProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersFeatures: FC<FiltersFeaturesProps> = ({ libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersFeaturesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as FeatureFilters;
            const existingFeatures = libraryViewSettings?.Filters?.Features ?? [];

            const updatedFeatures = existingFeatures.includes(value)
                ? existingFeatures.filter(filter => filter !== value)
                : [...existingFeatures, value];

            setLibraryViewSettings(prevState => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Features: updatedFeatures.length ? updatedFeatures : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Features]
    );

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {featuresOptions.map(filter => (
                <Checkbox
                    key={filter.value}
                    checked={!!libraryViewSettings?.Filters?.Features?.includes(filter.value)}
                    onChange={onFiltersFeaturesChange}
                    value={filter.value}
                >
                    {globalize.translate(filter.label)}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersFeatures;
