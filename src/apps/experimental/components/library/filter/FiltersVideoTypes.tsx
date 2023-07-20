import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';
import { VideoType } from '@jellyfin/sdk/lib/generated-client';
import globalize from 'scripts/globalize';

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
    const onFiltersVideoTypesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as VideoType;
            const existingValue = libraryViewSettings?.Filters?.VideoTypes;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: VideoType) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, VideoTypes: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        VideoTypes: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.VideoTypes]
    );

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const name = event.target.name;

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                [name]: event.target.checked
            }));
        },
        [setLibraryViewSettings]
    );

    return (
        <FormGroup>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={libraryViewSettings.IsSD}
                        onChange={handleChange}
                        name='IsSD'
                    />
                }
                label={globalize.translate('SD')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={libraryViewSettings.IsHD}
                        onChange={handleChange}
                        name='IsHD'
                    />
                }
                label={globalize.translate('HD')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={
                            libraryViewSettings.Is4K
                        }
                        onChange={handleChange}
                        name='Is4K'
                    />
                }
                label={globalize.translate('4K')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={
                            libraryViewSettings.Is3D
                        }
                        onChange={handleChange}
                        name='Is3D'
                    />
                }
                label={globalize.translate('3D')}
            />
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
