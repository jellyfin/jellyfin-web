import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import React, { type FC } from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import globalize from 'scripts/globalize';

const syncPlayAccessOptions = [
    {
        label: 'LabelSyncPlayAccessCreateAndJoinGroups',
        value: SyncPlayUserAccessType.CreateAndJoinGroups
    },
    {
        label: 'LabelSyncPlayAccessJoinGroups',
        value: SyncPlayUserAccessType.JoinGroups
    },
    {
        label: 'LabelSyncPlayAccessNone',
        value: SyncPlayUserAccessType.None
    }
];

interface SelectSyncPlayAccessProps {
    currentUser: UserDto;
    onSelectChange: (event: SelectChangeEvent<string>) => void;
}

const SelectSyncPlayAccess: FC<SelectSyncPlayAccessProps> = ({
    currentUser,
    onSelectChange
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel id='selectSyncPlayAccess-label'>
                {globalize.translate('LabelSyncPlayAccess')}
            </InputLabel>
            <Select
                labelId='selectSyncPlayAccess-label'
                id='selectSyncPlayAccess'
                name='SyncPlayAccess'
                value={currentUser?.Policy?.SyncPlayAccess}
                onChange={onSelectChange}
            >
                {syncPlayAccessOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {globalize.translate(option.label)}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText className='fieldDescription'>
                {globalize.translate('SyncPlayAccessHelp')}
            </FormHelperText>
        </FormControl>
    );
};

export default SelectSyncPlayAccess;
