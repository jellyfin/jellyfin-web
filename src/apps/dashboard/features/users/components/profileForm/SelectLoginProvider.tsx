import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { NameIdPair } from '@jellyfin/sdk/lib/generated-client/models/name-id-pair';
import React, { type FC } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import globalize from 'lib/globalize';

interface SelectLoginProviderProps {
    authProviders: NameIdPair[] | undefined;
    currentUser: UserDto;
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SelectLoginProvider: FC<SelectLoginProviderProps> = ({
    authProviders,
    currentUser,
    onFormChange
}) => {
    return (
        <TextField
            id='selectLoginProvider'
            name='AuthenticationProviderId'
            select
            fullWidth
            label={globalize.translate('LabelAuthProvider')}
            value={currentUser?.Policy?.AuthenticationProviderId}
            onChange={onFormChange}
            helperText={globalize.translate('AuthProviderHelp')}
        >
            {authProviders?.map((option) => (
                <MenuItem key={option.Id} value={option.Id as string}>
                    {option.Name}
                </MenuItem>
            ))}
        </TextField>
    );
};

export default SelectLoginProvider;
