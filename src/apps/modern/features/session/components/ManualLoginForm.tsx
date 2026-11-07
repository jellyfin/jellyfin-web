import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import globalize from 'lib/globalize';
import appSettings from 'scripts/settings/appSettings';

import type { UserCredentials } from '../api/useAuthenticateUserByName';

interface ManualLoginFormProps {
    initialUsername?: string
    isSubmitting?: boolean
    /** Called when the form is submitted. The password field is cleared if the promise rejects. */
    onSubmit: (credentials: UserCredentials) => Promise<unknown>
    /** Shows a cancel button when provided. */
    onCancel?: () => void
}

const ManualLoginForm: FC<ManualLoginFormProps> = ({
    initialUsername = '',
    isSubmitting,
    onSubmit,
    onCancel
}) => {
    const [ username, setUsername ] = useState(initialUsername);
    const [ password, setPassword ] = useState('');
    const [ rememberMe, setRememberMe ] = useState(() => appSettings.enableAutoLogin());
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus the password when the username was filled in by selecting a user
        (initialUsername ? passwordRef : usernameRef).current?.focus();
    }, [ initialUsername ]);

    const onUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    }, []);

    const onPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    }, []);

    const onRememberMeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRememberMe(e.target.checked);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        appSettings.enableAutoLogin(rememberMe);
        onSubmit({ username, password })
            .catch(() => setPassword(''));
    }, [ onSubmit, password, rememberMe, username ]);

    return (
        <form onSubmit={onFormSubmit}>
            <Stack spacing={2}>
                <TextField
                    id='txtManualName'
                    label={globalize.translate('LabelUser')}
                    value={username}
                    onChange={onUsernameChange}
                    autoComplete='username'
                    autoCapitalize='off'
                    inputRef={usernameRef}
                    required
                />

                <TextField
                    id='txtManualPassword'
                    type='password'
                    label={globalize.translate('LabelPassword')}
                    value={password}
                    onChange={onPasswordChange}
                    autoComplete='current-password'
                    inputRef={passwordRef}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={rememberMe}
                            onChange={onRememberMeChange}
                        />
                    }
                    label={globalize.translate('RememberMe')}
                    sx={{ ml: '-11px' }}
                />

                <Button
                    type='submit'
                    size='large'
                    color='primary'
                    disabled={isSubmitting}
                >
                    {globalize.translate('ButtonSignIn')}
                </Button>

                {onCancel && (
                    <Button
                        variant='text'
                        onClick={onCancel}
                    >
                        {globalize.translate('ButtonCancel')}
                    </Button>
                )}
            </Stack>
        </form>
    );
};

export default ManualLoginForm;
