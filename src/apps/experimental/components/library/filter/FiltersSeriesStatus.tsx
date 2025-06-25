import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';
import { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';

const statusFiltersOptions = [
    { label: 'Continuing', value: SeriesStatus.Continuing },
    { label: 'Ended', value: SeriesStatus.Ended },
    { label: 'Unreleased', value: SeriesStatus.Unreleased }
];

interface FiltersSeriesStatusProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersSeriesStatus: FC<FiltersSeriesStatusProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersSeriesStatusChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as SeriesStatus;
            const existingSeriesStatus = libraryViewSettings?.Filters?.SeriesStatus ?? [];

            const updatedSeriesStatus = existingSeriesStatus.includes(value) ?
                existingSeriesStatus.filter((filter) => filter !== value) :
                [...existingSeriesStatus, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    SeriesStatus: updatedSeriesStatus.length ? updatedSeriesStatus : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.SeriesStatus]
    );

    return (
        <FormGroup>
            {statusFiltersOptions.map((filter) => (
                <FormControlLabel
                    key={filter.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.SeriesStatus?.includes( filter.value)
                            }
                            onChange={onFiltersSeriesStatusChange}
                            value={filter.value}
                        />
                    }
                    label={globalize.translate(filter.label)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersSeriesStatus;
