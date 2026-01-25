import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';
import { type LibraryViewSettings } from 'types/library';

interface FiltersYearsProps {
    yearsOptions: number[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersYears: FC<FiltersYearsProps> = ({
    yearsOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersYearsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = Number(event.target.value);
            const existingYears = libraryViewSettings?.Filters?.Years ?? [];

            const updatedYears = existingYears.includes(value) ?
                existingYears.filter((filter) => filter !== value) :
                [...existingYears, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Years: updatedYears.length ? updatedYears : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.Years]
    );

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.xs }}>
            {yearsOptions.map((filter) => (
                <Checkbox
                    key={filter}
                    checked={
                        !!libraryViewSettings?.Filters?.Years?.includes(
                            Number(filter)
                        )
                    }
                    onChange={onFiltersYearsChange}
                    value={String(filter)}
                >
                    {filter}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersYears;
