import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { NameIdPair } from '@jellyfin/sdk/lib/generated-client/models/name-id-pair';
import React, { type FC } from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import globalize from 'scripts/globalize';

interface SelectPasswordResetProviderProps {
    passwordResetProviders: NameIdPair[] | undefined
    currentUser: UserDto;
    onSelectChange: (event: SelectChangeEvent<string>) => void
}

const SelectPasswordResetProvider: FC<SelectPasswordResetProviderProps> = ({
    passwordResetProviders,
    currentUser,
    onSelectChange
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel id='selectPasswordResetProvider-label'>
                {globalize.translate('LabelPasswordResetProvider')}
            </InputLabel>
            <Select
                labelId='selectPasswordResetProvider-label'
                id='selectPasswordResetProvider'
                name='PasswordResetProviderId'
                value={
                    currentUser?.Policy?.PasswordResetProviderId
                                || ''
                }
                onChange={onSelectChange}
            >
                {passwordResetProviders?.map((option) => (
                    <MenuItem
                        key={option.Id}
                        value={option.Id as string}
                    >
                        {option.Name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText className='fieldDescription'>
                {globalize.translate('PasswordResetProviderHelp')}
            </FormHelperText>
        </FormControl>
    );
};

export default SelectPasswordResetProvider;
