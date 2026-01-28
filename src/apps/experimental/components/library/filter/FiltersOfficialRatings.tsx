import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';
import { type LibraryViewSettings } from 'types/library';

interface FiltersOfficialRatingsProps {
    OfficialRatingsOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersOfficialRatings: FC<FiltersOfficialRatingsProps> = ({
    OfficialRatingsOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersOfficialRatingsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingOfficialRatings = libraryViewSettings?.Filters?.OfficialRatings ?? [];

            const updatedOfficialRatings = existingOfficialRatings.includes(value)
                ? existingOfficialRatings.filter(filter => filter !== value)
                : [...existingOfficialRatings, value];

            setLibraryViewSettings(prevState => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    OfficialRatings: updatedOfficialRatings.length ? updatedOfficialRatings : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.OfficialRatings]
    );

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {OfficialRatingsOptions.map(filter => (
                <Checkbox
                    key={filter}
                    checked={!!libraryViewSettings?.Filters?.OfficialRatings?.includes(String(filter))}
                    onChange={onFiltersOfficialRatingsChange}
                    value={String(filter)}
                >
                    {filter}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersOfficialRatings;
