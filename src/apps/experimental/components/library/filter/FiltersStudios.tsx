import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { type LibraryViewSettings } from 'types/library';

interface FiltersStudiosProps {
    studiosOptions: BaseItemDto[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersStudios: FC<FiltersStudiosProps> = ({ studiosOptions, libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersStudiosChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingStudioIds = libraryViewSettings?.Filters?.StudioIds ?? [];

            const updatedStudioIds = existingStudioIds.includes(value)
                ? existingStudioIds.filter(filter => filter !== value)
                : [...existingStudioIds, value];

            setLibraryViewSettings(prevState => ({
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
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {studiosOptions?.map(filter => (
                <Checkbox
                    key={filter.Id}
                    checked={!!libraryViewSettings?.Filters?.StudioIds?.includes(String(filter.Id))}
                    onChange={onFiltersStudiosChange}
                    value={String(filter.Id)}
                >
                    {filter.Name}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersStudios;
