import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';
import React, { type FC, useCallback } from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import globalize from 'scripts/globalize';

interface SelectMaxParentalRatingProps {
    parentalRatings: ParentalRating[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const SelectMaxParentalRating: FC<SelectMaxParentalRatingProps> = ({
    parentalRatings,
    currentUser,
    setCurrentUser
}) => {
    const onSelectMaxParentalRatingChange = useCallback(
        (event: SelectChangeEvent) => {
            const target = event.target;
            const value = target.value;
            let maxParentalRating: number | null | undefined;
            if (value === '') {
                maxParentalRating = undefined;
            } else if (value === 'null') {
                maxParentalRating = null;
            } else {
                maxParentalRating = parseInt(value, 10);
            }

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    MaxParentalRating: maxParentalRating
                }
            }));
        },
        [setCurrentUser]
    );

    return (
        <FormControl variant='outlined' fullWidth>
            <InputLabel shrink id='selectMaxParentalRating-label'>
                {globalize.translate('LabelMaxParentalRating')}
            </InputLabel>
            <Select
                labelId='selectMaxParentalRating-label'
                id='selectMaxParentalRating'
                name='MaxParentalRating'
                value={
                    currentUser?.Policy?.MaxParentalRating !== undefined ?
                        String(currentUser?.Policy?.MaxParentalRating) :
                        ''
                }
                displayEmpty
                input={<OutlinedInput label={globalize.translate('LabelMaxParentalRating')} notched />}
                onChange={onSelectMaxParentalRatingChange}
            >
                <MenuItem value=''>
                    <em>None</em>
                </MenuItem>
                {parentalRatings?.map((rating) => (
                    <MenuItem
                        key={rating.Name}
                        value={String(rating.Value)}
                    >
                        {rating.Name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText className='fieldDescription'>
                {globalize.translate('MaxParentalRatingHelp')}
            </FormHelperText>
        </FormControl>
    );
};

export default SelectMaxParentalRating;
