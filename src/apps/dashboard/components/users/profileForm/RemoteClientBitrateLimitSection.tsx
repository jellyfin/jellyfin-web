import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import globalize from 'scripts/globalize';

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
        <FormControl fullWidth>
            <TextField
                id='txtRemoteClientBitrateLimit'
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
                            currentUser?.Policy
                                ?.RemoteClientBitrateLimit / 1e6
                        ).toLocaleString(undefined, {
                            maximumFractionDigits: 6
                        }) :
                        ''
                }
                name='RemoteClientBitrateLimit'
                onChange={onRemoteClientBitrateLimitChange}
            />
            <FormHelperText
                component={Stack}
                className='fieldDescription'
            >
                <span>
                    {globalize.translate(
                        'LabelRemoteClientBitrateLimitHelp'
                    )}
                </span>
                <span>
                    {globalize.translate(
                        'LabelUserRemoteClientBitrateLimitHelp'
                    )}
                </span>
            </FormHelperText>
        </FormControl>
    );
};

export default RemoteClientBitrateLimitSection;
