import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';
import React, { type FC, useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';

import globalize from 'lib/globalize';
import { type LibraryViewSettings } from 'types/library';

const statusFiltersOptions = [
    { label: 'Continuing', value: SeriesStatus.Continuing },
    { label: 'Ended', value: SeriesStatus.Ended },
    { label: 'Unreleased', value: SeriesStatus.Unreleased }
];

interface FiltersSeriesStatusProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersSeriesStatus: FC<FiltersSeriesStatusProps> = ({ libraryViewSettings, setLibraryViewSettings }) => {
    const onFiltersSeriesStatusChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as SeriesStatus;
            const existingSeriesStatus = libraryViewSettings?.Filters?.SeriesStatus ?? [];

            const updatedSeriesStatus = existingSeriesStatus.includes(value)
                ? existingSeriesStatus.filter(filter => filter !== value)
                : [...existingSeriesStatus, value];

            setLibraryViewSettings(prevState => ({
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
        <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing.xs }}>
            {statusFiltersOptions.map(filter => (
                <Checkbox
                    key={filter.value}
                    checked={!!libraryViewSettings?.Filters?.SeriesStatus?.includes(filter.value)}
                    onChange={onFiltersSeriesStatusChange}
                    value={filter.value}
                >
                    {globalize.translate(filter.label)}
                </Checkbox>
            ))}
        </Box>
    );
};

export default FiltersSeriesStatus;
