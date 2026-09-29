import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import React, { FC, useCallback } from 'react';
import { LibraryViewSettings } from 'types/library';

interface FiltersAudioLanguagesProps {
    options: { Name?: string | null, Value?: string | null }[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersAudioLanguages: FC<FiltersAudioLanguagesProps> = ({
    options,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingValues = libraryViewSettings?.Filters?.AudioLanguages ?? [];

            const updatedValues = existingValues.includes(value) ?
                existingValues.filter((filter) => filter !== value) :
                [...existingValues, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    AudioLanguages: updatedValues.length ? updatedValues : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.AudioLanguages]
    );

    return (
        <FormGroup>
            {options.filter((filter) => filter?.Value != null).map((filter) => (
                <FormControlLabel
                    key={filter.Value}
                    control={
                        <Checkbox
                            checked={!!libraryViewSettings?.Filters?.AudioLanguages?.includes(filter.Value!)}
                            onChange={onFiltersChange}
                            value={filter.Value}
                        />
                    }
                    label={filter.Name}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersAudioLanguages;
