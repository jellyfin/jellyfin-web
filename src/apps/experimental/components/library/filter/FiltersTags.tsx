import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from '@/types/library';

interface FiltersTagsProps {
    tagsOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersTags: FC<FiltersTagsProps> = ({
    tagsOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersTagsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingTags = libraryViewSettings?.Filters?.Tags ?? [];

            const updatedTags = existingTags.includes(value) ?
                existingTags.filter((filter) => filter !== value) :
                [...existingTags, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    Tags: updatedTags.length ? updatedTags : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings.Filters?.Tags]
    );

    return (
        <FormGroup>
            {tagsOptions.map((filter) => (
                <FormControlLabel
                    key={filter}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.Tags?.includes(
                                    String(filter)
                                )
                            }
                            onChange={onFiltersTagsChange}
                            value={String(filter)}
                        />
                    }
                    label={filter}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersTags;
