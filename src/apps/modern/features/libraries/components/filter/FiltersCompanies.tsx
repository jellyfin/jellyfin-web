import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

interface FiltersCompaniesProps {
    companiesOptions: BaseItemDto[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersCompanies: FC<FiltersCompaniesProps> = ({
    companiesOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersCompaniesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingCompanyIds = libraryViewSettings?.Filters?.CompanyIds ?? [];

            const updatedCompanyIds = existingCompanyIds.includes(value) ?
                existingCompanyIds.filter((filter) => filter !== value) :
                [...existingCompanyIds, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    CompanyIds: updatedCompanyIds.length ? updatedCompanyIds : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings.Filters?.CompanyIds]
    );

    return (
        <FormGroup>
            {companiesOptions?.map((filter) => (
                <FormControlLabel
                    key={filter.Id}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.CompanyIds?.includes(
                                    String(filter.Id)
                                )
                            }
                            onChange={onFiltersCompaniesChange}
                            value={String(filter.Id)}
                        />
                    }
                    label={filter.Name}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersCompanies;
