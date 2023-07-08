import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import globalize from 'scripts/globalize';
import { LibraryViewSettings } from 'types/library';

const featuresOptions = [
    { label: 'Subtitles', value: 'HasSubtitles' },
    { label: 'Trailers', value: 'HasTrailer' },
    { label: 'Extras', value: 'HasSpecialFeature' },
    { label: 'ThemeSongs', value: 'HasThemeSong' },
    { label: 'ThemeVideos', value: 'HasThemeVideo' }
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
            const value = String(event.target.value);
            const existingValue =
                libraryViewSettings?.Filters?.Features;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: string) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, Features: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        Features: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Features]
    );

    return (
        <FormGroup>
            {featuresOptions
                .map((filter) => (
                    <FormControlLabel
                        key={filter.value}
                        control={
                            <Checkbox
                                checked={
                                    !!libraryViewSettings?.Filters?.Features?.includes(
                                        String(filter.value)
                                    )
                                }
                                onChange={onFiltersFeaturesChange}
                                value={String(filter.value)}
                            />
                        }
                        label={globalize.translate(filter.label)}
                    />
                ))}
        </FormGroup>
    );
};

export default FiltersFeatures;
