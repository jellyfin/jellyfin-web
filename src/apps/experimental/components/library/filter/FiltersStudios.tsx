import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from '@/types/library';

interface FiltersStudiosProps {
    studiosOptions: BaseItemDto[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersStudios: FC<FiltersStudiosProps> = ({
    studiosOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersStudiosChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingStudioIds = libraryViewSettings?.Filters?.StudioIds ?? [];

            const updatedStudioIds = existingStudioIds.includes(value) ?
                existingStudioIds.filter((filter) => filter !== value) :
                [...existingStudioIds, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    StudioIds: updatedStudioIds.length ? updatedStudioIds : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings.Filters?.StudioIds]
    );

    return (
        <FormGroup>
            {studiosOptions?.map((filter) => (
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
