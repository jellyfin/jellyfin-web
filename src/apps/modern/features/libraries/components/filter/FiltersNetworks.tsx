import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersNetworksProps {
    networksOptions: BaseItemDto[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersNetworks: FC<FiltersNetworksProps> = ({
    networksOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersNetworksChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingNetworkIds = libraryViewSettings?.Filters?.NetworkIds ?? [];

            const updatedNetworkIds = existingNetworkIds.includes(value) ?
                existingNetworkIds.filter((filter) => filter !== value) :
                [...existingNetworkIds, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    NetworkIds: updatedNetworkIds.length ? updatedNetworkIds : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings.Filters?.NetworkIds]
    );

    return (
        <FormGroup>
            {networksOptions?.map((filter) => (
                <FormControlLabel
                    key={filter.Id}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.NetworkIds?.includes(
                                    String(filter.Id)
                                )
                            }
                            onChange={onFiltersNetworksChange}
                            value={String(filter.Id)}
                        />
                    }
                    label={filter.Name}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersNetworks;
