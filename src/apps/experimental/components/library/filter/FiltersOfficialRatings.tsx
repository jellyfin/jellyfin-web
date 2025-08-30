import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersOfficialRatingsProps {
    OfficialRatingsOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
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
            const existingOfficialRatings =
                libraryViewSettings?.Filters?.OfficialRatings ?? [];

            const updatedOfficialRatings = existingOfficialRatings.includes(
                value
            )
                ? existingOfficialRatings.filter((filter) => filter !== value)
                : [...existingOfficialRatings, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    OfficialRatings: updatedOfficialRatings.length
                        ? updatedOfficialRatings
                        : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.OfficialRatings]
    );

    return (
        <FormGroup>
            {OfficialRatingsOptions.map((filter) => (
                <FormControlLabel
                    key={filter}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.OfficialRatings?.includes(
                                    String(filter)
                                )
                            }
                            onChange={onFiltersOfficialRatingsChange}
                            value={String(filter)}
                        />
                    }
                    label={filter}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersOfficialRatings;
