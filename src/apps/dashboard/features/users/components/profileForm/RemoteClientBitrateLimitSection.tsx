import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import globalize from 'lib/globalize';

interface RemoteClientBitrateLimitSectionProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const RemoteClientBitrateLimitSection: FC<
    RemoteClientBitrateLimitSectionProps
> = ({ currentUser, setCurrentUser }) => {
    const onRemoteClientBitrateLimitChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = Math.floor(
                1e6 * parseFloat(event.target.value || '0')
            );
            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                    RemoteClientBitrateLimit: newValue
                }
            }));
        },
        [setCurrentUser]
    );
    return (
        <TextField
            id='txtRemoteClientBitrateLimit'
            fullWidth
            label={globalize.translate('LabelRemoteClientBitrateLimit')}
            type='number'
            inputProps={{
                inputMode: 'decimal',
                pattern: '[0-9]*(.[0-9]+)?',
                min: 0,
                step: 0.25
            }}
            value={
                currentUser?.Policy?.RemoteClientBitrateLimit
                && currentUser?.Policy?.RemoteClientBitrateLimit > 0 ?
                    (
                        currentUser?.Policy?.RemoteClientBitrateLimit / 1e6
                    ).toLocaleString(undefined, {
                        maximumFractionDigits: 6
                    }) :
                    ''
            }
            name='RemoteClientBitrateLimit'
            onChange={onRemoteClientBitrateLimitChange}
            helperText={
                <>
                    {globalize.translate('LabelRemoteClientBitrateLimitHelp')}
                    <br />
                    {globalize.translate(
                        'LabelUserRemoteClientBitrateLimitHelp'
                    )}
                </>
            }
        />
    );
};

export default RemoteClientBitrateLimitSection;
