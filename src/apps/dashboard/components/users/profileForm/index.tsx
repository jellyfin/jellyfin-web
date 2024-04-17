import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { SelectChangeEvent } from '@mui/material/Select';
import globalize from 'scripts/globalize';
import {
    sessionHooks,
    libraryHooks,
    channelsHooks,
    configurationHooks
} from 'hooks/api';
import UserPermissionsSection from './UserPermissionsSection';
import FeatureAccessSection from './FeatureAccessSection';
import PlaybackSection from './PlaybackSection';
import RemoteClientBitrateLimitSection from './RemoteClientBitrateLimitSection';
import RemoteControlSection from './RemoteControlSection';
import AdvancedControlSection from './AdvancedControlSection';
import UserContentDeletionSection from './UserContentDeletionSection';
import SelectSyncPlayAccess from './SelectSyncPlayAccess';
import SelectLoginProvider from './SelectLoginProvider';
import SelectPasswordResetProvider from './SelectPasswordResetProvider';

interface UserProfileFormProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UserProfileForm: FC<UserProfileFormProps> = ({
    currentUser,
    setCurrentUser,
    onFormSubmit
}) => {
    const navigate = useNavigate();

    const { data: authProviders } = sessionHooks.useGetAuthProviders();
    const { data: passwordResetProviders } =
        sessionHooks.useGetPasswordResetProviders();
    const { data: mediaFolders } = libraryHooks.useGetMediaFolders({
        isHidden: false
    });
    const { data: channels } = channelsHooks.useGetChannels({
        supportsMediaDeletion: true
    });
    const { data: config } = configurationHooks.useGetNamedConfiguration({
        key: 'network'
    });

    const onNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentUser((prevState) => ({
                ...prevState,
                Name: event.target.value
            }));
        },
        [setCurrentUser]
    );

    const onFormChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const target = event.target;
            const name = target.name;
            const value =
                target.type === 'checkbox' ? target.checked : target.value;
            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                    [name]: value
                }
            }));
        },
        [setCurrentUser]
    );

    const onSelectChange = useCallback(
        (event: SelectChangeEvent<string>) => {
            const target = event.target;
            const name = target.name;
            const value = target.value;
            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                    [name]: value
                }
            }));
        },
        [setCurrentUser]
    );

    const onBtnCancelClick = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return (
        <Stack
            component='form'
            spacing={2}
            onSubmit={onFormSubmit}
        >
            {currentUser?.Policy?.IsDisabled ? (
                <Box id='disabledUserBanner'>
                    <Typography variant='h2' color={'red'}>
                        {globalize.translate(
                            'HeaderThisUserIsCurrentlyDisabled'
                        )}
                    </Typography>
                    <Typography variant='subtitle1'>
                        {globalize.translate('MessageReenableUser')}
                    </Typography>
                </Box>
            ) : null}

            <TextField
                id='txtUserName'
                label={globalize.translate('LabelName')}
                type='text'
                value={currentUser.Name}
                name='Name'
                onChange={onNameChange}
                fullWidth
                required
            />

            {authProviders && authProviders.length > 1 ? (
                <SelectLoginProvider
                    authProviders={authProviders}
                    currentUser={currentUser}
                    onSelectChange={onSelectChange}
                />
            ) : null}

            {passwordResetProviders
                && passwordResetProviders?.length > 1 ? (
                    <SelectPasswordResetProvider
                        passwordResetProviders={passwordResetProviders}
                        currentUser={currentUser}
                        onSelectChange={onSelectChange}
                    />
                ) : null}

            <UserPermissionsSection
                enableRemoteAccess={config?.EnableRemoteAccess}
                currentUser={currentUser}
                onFormChange={onFormChange}
            />

            <FeatureAccessSection
                currentUser={currentUser}
                onFormChange={onFormChange}
            />

            <PlaybackSection
                currentUser={currentUser}
                onFormChange={onFormChange}
            />

            <RemoteClientBitrateLimitSection
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />

            <SelectSyncPlayAccess
                currentUser={currentUser}
                onSelectChange={onSelectChange}
            />

            <UserContentDeletionSection
                mediaFolders={mediaFolders}
                channels={channels}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <RemoteControlSection
                currentUser={currentUser}
                onFormChange={onFormChange}
            />

            <AdvancedControlSection
                currentUser={currentUser}
                onFormChange={onFormChange}
            />

            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit'
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    type='button'
                    className='emby-button raised button-cancel'
                    onClick={onBtnCancelClick}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserProfileForm;
