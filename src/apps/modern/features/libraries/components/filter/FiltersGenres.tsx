import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersGenresProps {
    genresOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersGenres: FC<FiltersGenresProps> = ({
    genresOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersGenresChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingGenres = libraryViewSettings?.Filters?.Genres ?? [];

            const updatedGenres = existingGenres.includes(value) ?
                existingGenres.filter((filter) => filter !== value) :
                [...existingGenres, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Genres: updatedGenres.length ? updatedGenres : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Genres]
    );

    return (
        <FormGroup>
            {genresOptions.map((filter) => (
                <FormControlLabel
                    key={filter}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.Genres?.includes(
                                    String(filter)
                                )
                            }
                            onChange={onFiltersGenresChange}
                            value={String(filter)}
                        />
                    }
                    label={filter}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersGenres;
