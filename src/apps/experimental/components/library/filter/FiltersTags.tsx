import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { type LibraryViewSettings } from 'types/library';

interface FiltersTagsProps {
    tagsOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersTags: FC<FiltersTagsProps> = ({ tagsOptions, libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersTagsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingTags = libraryViewSettings?.Filters?.Tags ?? [];

            const updatedTags = existingTags.includes(value)
                ? existingTags.filter(filter => filter !== value)
                : [...existingTags, value];

            setLibraryViewSettings(prevState => ({
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
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
            {tagsOptions.map(filter => (
                <Checkbox
                    key={filter}
                    checked={!!libraryViewSettings?.Filters?.Tags?.includes(String(filter))}
                    onChange={onFiltersTagsChange}
                    value={String(filter)}
                >
                    {filter}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersTags;
