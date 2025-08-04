import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import globalize from 'lib/globalize';
import { FeatureFilters, LibraryViewSettings } from 'types/library';

const featuresOptions = [
    { label: 'Subtitles', value: FeatureFilters.HasSubtitles },
    { label: 'Trailers', value: FeatureFilters.HasTrailer },
    { label: 'Extras', value: FeatureFilters.HasSpecialFeature },
    { label: 'ThemeSongs', value: FeatureFilters.HasThemeSong },
    { label: 'ThemeVideos', value: FeatureFilters.HasThemeVideo }
];

interface FiltersFeaturesProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const FiltersFeatures: FC<FiltersFeaturesProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersFeaturesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as FeatureFilters;
            const existingFeatures =
                libraryViewSettings?.Filters?.Features ?? [];

            const updatedFeatures = existingFeatures.includes(value)
                ? existingFeatures.filter((filter) => filter !== value)
                : [...existingFeatures, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Features: updatedFeatures.length
                        ? updatedFeatures
                        : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Features]
    );

    return (
        <FormGroup>
            {featuresOptions.map((filter) => (
                <FormControlLabel
                    key={filter.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.Features?.includes(
                                    filter.value
                                )
                            }
                            onChange={onFiltersFeaturesChange}
                            value={filter.value}
                        />
                    }
                    label={globalize.translate(filter.label)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersFeatures;
