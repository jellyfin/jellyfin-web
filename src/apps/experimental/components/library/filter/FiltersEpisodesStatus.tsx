import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import globalize from 'scripts/globalize';
import { LibraryViewSettings } from 'types/library';

const episodesStatusOptions = [
    { label: 'OptionSpecialEpisode', value: 'ParentIndexNumber' },
    { label: 'OptionMissingEpisode', value: 'IsMissing' },
    { label: 'OptionUnairedEpisode', value: 'IsUnaired' }
];

interface FiltersEpisodesStatusProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersEpisodesStatus: FC<FiltersEpisodesStatusProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersEpisodesStatusChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = String(event.target.value);
            const existingValue = libraryViewSettings?.Filters?.EpisodesStatus;

            if (existingValue?.includes(value)) {
                const newValue = existingValue?.filter(
                    (prevState: string) => prevState !== value
                );
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: { ...prevState.Filters, EpisodesStatus: newValue }
                }));
            } else {
                setLibraryViewSettings((prevState) => ({
                    ...prevState,
                    StartIndex: 0,
                    Filters: {
                        ...prevState.Filters,
                        EpisodesStatus: [...(existingValue ?? []), value]
                    }
                }));
            }
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.EpisodesStatus]
    );

    return (
        <FormGroup>
            {episodesStatusOptions.map((filter) => (
                <FormControlLabel
                    key={filter.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.EpisodesStatus?.includes(
                                    String( filter.value)
                                )
                            }
                            onChange={onFiltersEpisodesStatusChange}
                            value={String(filter.value)}
                        />
                    }
                    label={globalize.translate(filter.label)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersEpisodesStatus;
