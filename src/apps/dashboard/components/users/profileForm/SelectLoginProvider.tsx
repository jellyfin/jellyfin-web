import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { NameIdPair } from '@jellyfin/sdk/lib/generated-client/models/name-id-pair';
import React, { type FC } from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import globalize from 'scripts/globalize';

interface SelectLoginProviderProps {
    authProviders: NameIdPair[] | undefined;
    currentUser: UserDto;
    onSelectChange: (event: SelectChangeEvent<string>) => void;
}

const SelectLoginProvider: FC<SelectLoginProviderProps> = ({
    authProviders,
    currentUser,
    onSelectChange
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel id='selectLoginProvider-label'>
                {globalize.translate('LabelAuthProvider')}
            </InputLabel>
            <Select
                labelId='selectLoginProvider-label'
                id='selectLoginProvider'
                name='AuthenticationProviderId'
                value={currentUser?.Policy?.AuthenticationProviderId || ''}
                onChange={onSelectChange}
            >
                {authProviders?.map((option) => (
                    <MenuItem key={option.Id} value={option.Id as string}>
                        {option.Name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText className='fieldDescription'>
                {globalize.translate('AuthProviderHelp')}
            </FormHelperText>
        </FormControl>
    );
};

export default SelectLoginProvider;
