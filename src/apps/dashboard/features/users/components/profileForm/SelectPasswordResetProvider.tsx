import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { NameIdPair } from '@jellyfin/sdk/lib/generated-client/models/name-id-pair';
import React, { type FC } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import globalize from 'lib/globalize';

interface SelectPasswordResetProviderProps {
    passwordResetProviders: NameIdPair[] | undefined;
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SelectPasswordResetProvider: FC<SelectPasswordResetProviderProps> = ({
    passwordResetProviders,
    currentUser,
    onFormChange
}) => {
    return (
        <TextField
            id='selectPasswordResetProvider'
            name='PasswordResetProviderId'
            select
            fullWidth
            label={globalize.translate('LabelPasswordResetProvider')}
            value={currentUser?.Policy?.PasswordResetProviderId}
            onChange={onFormChange}
            helperText={globalize.translate('PasswordResetProviderHelp')}
        >
            {passwordResetProviders?.map((option) => (
                <MenuItem key={option.Id} value={option.Id as string}>
                    {option.Name}
                </MenuItem>
            ))}
        </TextField>
    );
};

export default SelectPasswordResetProvider;
