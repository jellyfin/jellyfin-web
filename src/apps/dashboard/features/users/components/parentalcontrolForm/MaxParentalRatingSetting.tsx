import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';
import React, { type FC, useCallback, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { groupRating } from '../../utils/item';
import globalize from 'lib/globalize';

interface MaxParentalRatingSettingProps {
    parentalRatings: ParentalRating[];
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const MaxParentalRatingSetting: FC<MaxParentalRatingSettingProps> = ({
    parentalRatings,
    currentUser,
    setCurrentUser
}) => {
    const onSelectMaxParentalRatingChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const target = event.target;
            const value = target.value;
            let maxParentalRating: number | null | undefined;
            if (value === 'undefined') {
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

    const ratings = useMemo(
        () => groupRating(parentalRatings),
        [parentalRatings]
    );

    return (
        <TextField
            id='selectMaxParentalRating'
            name='MaxParentalRating'
            select
            fullWidth
            label={globalize.translate('LabelMaxParentalRating')}
            value={String(currentUser?.Policy?.MaxParentalRating)}
            onChange={onSelectMaxParentalRatingChange}
            helperText={globalize.translate('MaxParentalRatingHelp')}
        >
            {ratings?.map((rating) => (
                <MenuItem key={rating.Name} value={String(rating.Value)}>
                    <Typography noWrap>{rating.Name}</Typography>
                </MenuItem>
            ))}
        </TextField>
    );
};

export default MaxParentalRatingSetting;
