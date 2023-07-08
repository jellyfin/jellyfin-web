import type { QueryFiltersLegacy } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersGenresProps {
    filtes?: QueryFiltersLegacy;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersGenres: FC<FiltersGenresProps> = ({
    filtes,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersGenresChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = String(event.target.value);
            const existingValue = libraryViewSettings?.Filters?.Genres;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: string) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, Genres: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        Genres: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Genres]
    );

    return (
        <FormGroup>
            {filtes?.Genres?.map((filter) => (
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
