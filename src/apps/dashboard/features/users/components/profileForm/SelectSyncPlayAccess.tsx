import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import React, { type FC } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import globalize from 'lib/globalize';

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
    onFormChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SelectSyncPlayAccess: FC<SelectSyncPlayAccessProps> = ({
    currentUser,
    onFormChange
}) => {
    return (
        <TextField
            id='selectSyncPlayAccess'
            name='SyncPlayAccess'
            select
            fullWidth
            label={globalize.translate('LabelSyncPlayAccess')}
            value={currentUser?.Policy?.SyncPlayAccess}
            onChange={onFormChange}
            helperText={globalize.translate('SyncPlayAccessHelp')}
        >
            {syncPlayAccessOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {globalize.translate(option.label)}
                </MenuItem>
            ))}
        </TextField>

    );
};

export default SelectSyncPlayAccess;
