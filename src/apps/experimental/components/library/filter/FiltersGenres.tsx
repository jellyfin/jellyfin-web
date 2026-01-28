import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { type LibraryViewSettings } from 'types/library';

interface FiltersGenresProps {
    genresOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersGenres: FC<FiltersGenresProps> = ({ genresOptions, libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersGenresChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingGenres = libraryViewSettings?.Filters?.Genres ?? [];

            const updatedGenres = existingGenres.includes(value)
                ? existingGenres.filter(filter => filter !== value)
                : [...existingGenres, value];

            setLibraryViewSettings(prevState => ({
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
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {genresOptions.map(filter => (
                <Checkbox
                    key={filter}
                    checked={!!libraryViewSettings?.Filters?.Genres?.includes(String(filter))}
                    onChange={onFiltersGenresChange}
                    value={String(filter)}
                >
                    {filter}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersGenres;
