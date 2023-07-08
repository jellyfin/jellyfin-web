import type { QueryFiltersLegacy } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersOfficialRatingsProps {
    filtes?: QueryFiltersLegacy;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersOfficialRatings: FC<FiltersOfficialRatingsProps> = ({
    filtes,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersOfficialRatingsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = String(event.target.value);
            const existingValue = libraryViewSettings?.Filters?.OfficialRatings;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: string) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, OfficialRatings: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        OfficialRatings: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.OfficialRatings]
    );

    return (
        <FormGroup>
            {filtes?.OfficialRatings?.map((filter) => (
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
