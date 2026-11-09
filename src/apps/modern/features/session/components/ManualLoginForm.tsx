import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { InputBaseComponentProps } from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, useCallback, useEffect, useId, useRef, useState } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import UserAvatar from 'components/UserAvatar';
import globalize from 'lib/globalize';
import appSettings from 'scripts/settings/appSettings';

import type { UserCredentials } from '../api/useAuthenticateUserByName';

import { AVATAR_SIZE, AVATAR_SIZE_SM } from './PublicUserList';

export interface LoginFormError {
    /**
     * Credential errors clear the password, mark the fields invalid and move the focus to the password,
     * which announces the message. Other errors keep the password and are announced by the message itself.
     * An incomplete login is one the server accepted, but that could not be completed on this device.
     */
    kind: 'credentials' | 'unauthorized' | 'connection' | 'incomplete'
    messageKey: string
    /** Changes with every failure, so repeated failures are announced again */
    id: number
}

interface ManualLoginFormProps {
    /** The user selected from the user list, shown instead of the username field */
    user?: UserDto
    /** The api to load the avatar of the selected user with, since the user is not signed in yet */
    api?: Api
    isSubmitting?: boolean
    /** Prevents signing in, while the server can not be reached. The fields can still be filled in */
    disabled?: boolean
    error?: LoginFormError
    onSubmit: (credentials: UserCredentials) => void
    /**
     * Shows a button to return to the user list when provided. For a selected user it is labelled as choosing
     * another user, since the person picked this user themselves and is not navigating back from anywhere.
     */
    onCancel?: () => void
}

interface EditedErrorIds {
    username?: number
    password?: number
}

// The default error label color has too little contrast on dark backgrounds; the red outline marks the field
const FIELD_SX = { '& .MuiInputLabel-root.Mui-error': { color: 'text.secondary' } };

const HEADING_SX = {
    width: '100%',
    color: 'text.primary',
    textAlign: 'center',
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    // Long names wrap instead of being cut off, but are limited to two lines so the form stays in place
    overflowWrap: 'anywhere',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
} as const;

const ManualLoginForm: FC<ManualLoginFormProps> = ({
    user,
    api,
    isSubmitting,
    disabled,
    error,
    onSubmit,
    onCancel
}) => {
    const [ username, setUsername ] = useState(user?.Name ?? '');
    const [ password, setPassword ] = useState('');
    const [ rememberMe, setRememberMe ] = useState(() => appSettings.enableAutoLogin());
    // The error the fields were last edited for, so a field is no longer invalid once its value changes
    const [ editedErrorIds, setEditedErrorIds ] = useState<EditedErrorIds>({});
    // The credential error that arrived while the focus was outside the form, so the password field can not announce it
    const [ unfocusedErrorId, setUnfocusedErrorId ] = useState<number>();
    const formRef = useRef<HTMLFormElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const errorId = useId();
    const headingId = useId();
    const isSmUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));

    const errorKind = error?.kind;
    const errorIdValue = error?.id;
    const isCredentialError = errorKind === 'credentials';
    // The username of a selected user is not shown as a field, and is unlikely to be the invalid part anyway
    const isUsernameInvalid = isCredentialError && !user && editedErrorIds.username !== errorIdValue;
    const isPasswordInvalid = isCredentialError && editedErrorIds.password !== errorIdValue;
    // The focused password field announces credential errors through its description. When the focus was left
    // elsewhere, the alert announces the error instead
    const isErrorAnnouncedByField = isCredentialError && unfocusedErrorId !== errorIdValue;

    const isUserSelected = !!user;

    useEffect(() => {
        // Focus the password when the user was selected, since there is no username to enter
        (isUserSelected ? passwordRef : usernameRef).current?.focus();
    }, [ isUserSelected ]);

    useEffect(() => {
        if (errorIdValue === undefined || errorKind !== 'credentials') return;

        setPassword('');
        // Only move the focus when it is still in the form, so it is not pulled away from where the user moved it
        const activeElement = document.activeElement;
        if (!activeElement || activeElement === document.body || formRef.current?.contains(activeElement)) {
            passwordRef.current?.focus();
        } else {
            setUnfocusedErrorId(errorIdValue);
        }
    }, [ errorIdValue, errorKind ]);

    const onUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        setEditedErrorIds(ids => ({ ...ids, username: errorIdValue }));
    }, [ errorIdValue ]);

    const onPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setEditedErrorIds(ids => ({ ...ids, password: errorIdValue }));
    }, [ errorIdValue ]);

    const onRememberMeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRememberMe(e.target.checked);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // The submit button is not disabled while submitting (to keep its focus), so guard against resubmits here.
        // Pressing enter in a field also submits the form, so the disabled state is checked here as well
        if (isSubmitting || disabled) return;

        appSettings.enableAutoLogin(rememberMe);
        onSubmit({ username, password });
    }, [ disabled, isSubmitting, onSubmit, password, rememberMe, username ]);

    // The fields stay focusable and readable while submitting, but can not be edited
    const getInputSlotProps = (isInvalid: boolean, htmlInput?: InputBaseComponentProps) => ({
        input: { readOnly: isSubmitting },
        htmlInput: {
            ...htmlInput,
            'aria-invalid': isInvalid || undefined,
            'aria-describedby': isInvalid ? errorId : undefined
        }
    });

    return (
        <form
            ref={formRef}
            onSubmit={onFormSubmit}
            aria-busy={isSubmitting || undefined}
            // Names the form after the selected user, since the heading replaces the username field
            aria-labelledby={user ? headingId : undefined}
            // Contains the visually hidden username input
            style={{ position: 'relative' }}
        >
            <Stack spacing={2}>
                {user && (
                    <Stack spacing={1} alignItems='center'>
                        <UserAvatar
                            api={api}
                            user={user}
                            size={isSmUp ? AVATAR_SIZE_SM : AVATAR_SIZE}
                            // The name is shown next to the avatar, so the image is decorative
                            alt=''
                        />
                        <Typography
                            component='h2'
                            variant='h5'
                            id={headingId}
                            title={user.Name ?? undefined}
                            sx={HEADING_SX}
                        >
                            {user.Name}
                        </Typography>
                    </Stack>
                )}

                {error && (
                    <Alert
                        // Remount on every failure, so a repeated message is announced again. An alert that turns
                        // out not to be announced by the field is remounted too, since only a mounting alert is read
                        key={`${error.id}-${isErrorAnnouncedByField ? 'field' : 'alert'}`}
                        severity='error'
                        role={isErrorAnnouncedByField ? 'none' : 'alert'}
                    >
                        <span id={errorId}>{globalize.translate(error.messageKey)}</span>
                    </Alert>
                )}

                {user ? (
                    // Lets password managers match the saved password to the selected user. The submitted
                    // username comes from the selected user, not from this input. Password managers skip inputs
                    // that are hidden with display: none or type='hidden', so it is clipped instead.
                    <input
                        type='text'
                        name='username'
                        autoComplete='username'
                        value={username}
                        readOnly
                        tabIndex={-1}
                        aria-hidden='true'
                        style={VISUALLY_HIDDEN_STYLE}
                    />
                ) : (
                    <TextField
                        id='txtManualName'
                        label={globalize.translate('LabelUsername')}
                        value={username}
                        onChange={onUsernameChange}
                        autoComplete='username'
                        inputRef={usernameRef}
                        error={isUsernameInvalid}
                        // autoCapitalize is passed through to the input element, since TextField would put it on
                        // the root element where it has no effect
                        slotProps={getInputSlotProps(isUsernameInvalid, { autoCapitalize: 'off' })}
                        sx={FIELD_SX}
                        required
                    />
                )}

                <TextField
                    id='txtManualPassword'
                    type='password'
                    label={globalize.translate('LabelPassword')}
                    value={password}
                    onChange={onPasswordChange}
                    autoComplete='current-password'
                    inputRef={passwordRef}
                    error={isPasswordInvalid}
                    slotProps={getInputSlotProps(isPasswordInvalid)}
                    sx={FIELD_SX}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={rememberMe}
                            onChange={onRememberMeChange}
                            disabled={isSubmitting}
                        />
                    }
                    label={globalize.translate('LabelKeepMeSignedIn')}
                    sx={{ ml: '-11px' }}
                />

                <Button
                    type='submit'
                    size='large'
                    color='primary'
                    // Nothing can be done without a server, so the button is really disabled. While submitting,
                    // aria-disabled keeps the focus on the button instead.
                    // MUI's loading prop would disable the button, so the spinner is rendered manually.
                    disabled={disabled}
                    aria-disabled={isSubmitting || undefined}
                    startIcon={isSubmitting ? <CircularProgress size={16} color='inherit' aria-hidden /> : undefined}
                >
                    {globalize.translate('ButtonSignIn')}
                </Button>

                {onCancel && (
                    <Button
                        variant='text'
                        size='large'
                        // Leaving the form would not abandon the login in progress, so it waits for the outcome
                        disabled={isSubmitting}
                        onClick={onCancel}
                    >
                        {globalize.translate(user ? 'ButtonChooseAnotherUser' : 'ButtonBack')}
                    </Button>
                )}
            </Stack>
        </form>
    );
};

export default ManualLoginForm;
