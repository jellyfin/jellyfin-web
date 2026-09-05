import React, { FC, useCallback } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import globalize from 'lib/globalize';
import { LibraryViewSettings } from 'types/library';

/** Offered thresholds for the "at least this good" filter. */
const MIN_RATING_OPTIONS = [9, 8, 7, 6, 5];

const ANY_RATING = 'any';

interface FiltersMyRatingProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const FiltersMyRating: FC<FiltersMyRatingProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersMyRatingChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    MinUserRating: value === ANY_RATING ? undefined : Number(value)
                }
            }));
        },
        [setLibraryViewSettings]
    );

    const selected = libraryViewSettings?.Filters?.MinUserRating;

    return (
        <RadioGroup
            value={selected === undefined ? ANY_RATING : String(selected)}
            onChange={onFiltersMyRatingChange}
        >
            <FormControlLabel
                value={ANY_RATING}
                control={<Radio />}
                label={globalize.translate('All')}
            />
            {MIN_RATING_OPTIONS.map((value) => (
                <FormControlLabel
                    key={value}
                    value={String(value)}
                    control={<Radio />}
                    label={globalize.translate('OptionMinUserRating', value)}
                />
            ))}
        </RadioGroup>
    );
};

export default FiltersMyRating;
