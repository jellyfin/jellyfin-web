import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import globalize from 'lib/globalize';

type PolicyKey = 'EnableAllFolders' | 'EnableAllChannels' | 'EnableAllDevices' | 'EnableContentDeletion';

interface SelectAllLibraryAccessProps {
    title: string;
    formLabel: string;
    policyKey: PolicyKey;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const SelectAllLibraryAccess: FC<SelectAllLibraryAccessProps> = ({
    title,
    formLabel,
    policyKey,
    currentUser,
    setCurrentUser
}) => {
    const onFormChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const target = event.target;
            const value =
                target.type === 'checkbox' ? target.checked : target.value;
            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    [policyKey]: value
                }
            }));
        },
        [policyKey, setCurrentUser]
    );

    return (
        <Box>
            <Typography variant='h2' className='checkboxListLabel'>
                {globalize.translate(title)}
            </Typography>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={currentUser?.Policy?.[policyKey] || false}
                        onChange={onFormChange}
                    />
                }
                label={globalize.translate(formLabel)}
            />
        </Box>
    );
};

export default SelectAllLibraryAccess;
