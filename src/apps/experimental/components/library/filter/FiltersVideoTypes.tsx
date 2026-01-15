import { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';
import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { LibraryViewSettings, VideoBasicFilter } from '@/types/library';

const videoBasicFilterOptions = [
    { label: 'SD', value: VideoBasicFilter.IsSD },
    { label: 'HD', value: VideoBasicFilter.IsHD },
    { label: '4K', value: VideoBasicFilter.Is4K },
    { label: '3D', value: VideoBasicFilter.Is3D }
];

const videoTypesOptions = [
    { label: 'DVD', value: VideoType.Dvd },
    { label: 'Blu-ray', value: VideoType.BluRay },
    { label: 'ISO', value: VideoType.Iso }
];

interface FiltersVideoTypesProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersVideoTypes: FC<FiltersVideoTypesProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersvideoStandardChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as VideoBasicFilter;
            const existingVideoBasicFilter = libraryViewSettings?.Filters?.VideoBasicFilter ?? [];

            const updatedVideoBasicFilter = existingVideoBasicFilter.includes(value) ?
                existingVideoBasicFilter.filter((filter) => filter !== value) :
                [...existingVideoBasicFilter, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                Filters: {
                    ...prevState.Filters,
                    VideoBasicFilter: updatedVideoBasicFilter.length ? updatedVideoBasicFilter : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.VideoBasicFilter]
    );

    const onFiltersVideoTypesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as VideoType;
            const existingVideoTypes = libraryViewSettings?.Filters?.VideoTypes ?? [];

            const updatedVideoTypes = existingVideoTypes.includes(value) ?
                existingVideoTypes.filter((filter) => filter !== value) :
                [...existingVideoTypes, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    VideoTypes: updatedVideoTypes.length ? updatedVideoTypes : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.VideoTypes]
    );

    return (
        <FormGroup>
            {videoBasicFilterOptions
                .map((filter) => (
                    <FormControlLabel
                        key={filter.value}
                        control={
                            <Checkbox
                                checked={
                                    !!libraryViewSettings?.Filters?.VideoBasicFilter?.includes(filter.value)
                                }
                                onChange={onFiltersvideoStandardChange}
                                value={filter.value}
                            />
                        }
                        label={filter.label}
                    />
                ))}
            {videoTypesOptions
                .map((filter) => (
                    <FormControlLabel
                        key={filter.value}
                        control={
                            <Checkbox
                                checked={
                                    !!libraryViewSettings?.Filters?.VideoTypes?.includes(filter.value)
                                }
                                onChange={onFiltersVideoTypesChange}
                                value={filter.value}
                            />
                        }
                        label={filter.label}
                    />
                ))}
        </FormGroup>
    );
};

export default FiltersVideoTypes;
