import type { BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersStudiosProps {
    filters?: BaseItemDtoQueryResult;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersStudios: FC<FiltersStudiosProps> = ({
    filters,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersStudiosChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = String(event.target.value);
            const existingValue = libraryViewSettings?.Filters?.StudioIds;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: string) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, StudioIds: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        StudioIds: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.StudioIds]
    );

    return (
        <FormGroup>
            {filters?.Items?.map((filter) => (
                <FormControlLabel
                    key={filter.Id}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.StudioIds?.includes(
                                    String(filter.Id)
                                )
                            }
                            onChange={onFiltersStudiosChange}
                            value={String(filter.Id)}
                        />
                    }
                    label={filter.Name}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersStudios;
