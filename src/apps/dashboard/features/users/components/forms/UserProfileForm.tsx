import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { NetworkConfiguration } from '@jellyfin/sdk/lib/generated-client/models/network-configuration';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import FormHelperText from '@mui/material/FormHelperText';
import {
    type SubmitHandler,
    useForm,
    CheckboxButtonGroup,
    CheckboxElement,
    SelectElement,
    TextFieldElement
} from 'react-hook-form-mui';
import {
    sessionHooks,
    libraryHooks,
    channelsHooks,
    configurationHooks,
    userHooks
} from 'hooks/api';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';

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

interface UserProfileFormProps {
    currentUser: UserDto;
}

const UserProfileForm: FC<UserProfileFormProps> = ({ currentUser }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const updateUserMutation = userHooks.useUpdateUser();
    const updateUserPolicyMutation = userHooks.useUpdateUserPolicy();

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

    const { control, formState, handleSubmit, watch, reset } = useForm<UserDto>(
        {
            defaultValues: {
                ...currentUser,
                Policy: {
                    ...currentUser?.Policy,
                    AuthenticationProviderId:
                        currentUser.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        currentUser.Policy?.PasswordResetProviderId || '',
                    RemoteClientBitrateLimit: currentUser?.Policy
                        ?.RemoteClientBitrateLimit ?
                        currentUser.Policy.RemoteClientBitrateLimit / 1e6 :
                        0
                }
            }
        }
    );

    const onSubmit: SubmitHandler<UserDto> = useCallback(
        async (data) => {
            try {
                await updateUserMutation.mutateAsync({
                    userId: data?.Id || '',
                    userDto: {
                        ...data,
                        Name: data?.Name
                    }
                });

                await updateUserPolicyMutation.mutateAsync({
                    userId: data?.Id || '',
                    userPolicy: {
                        ...data?.Policy,
                        AuthenticationProviderId:
                            data.Policy?.AuthenticationProviderId || '',
                        PasswordResetProviderId:
                            data.Policy?.PasswordResetProviderId || '',
                        EnableContentDeletionFromFolders: data?.Policy
                            ?.EnableContentDeletion ?
                            [] :
                            data?.Policy?.EnableContentDeletionFromFolders,
                        RemoteClientBitrateLimit: Math.floor(
                            1e6 * (data.Policy?.RemoteClientBitrateLimit || 0)
                        )
                    }
                });

                toast(globalize.translate('SettingsSaved'));
                await queryClient.invalidateQueries({
                    queryKey: ['UserById', data?.Id || '']
                });
            } catch (error) {
                toast(globalize.translate('ErrorDefault'));
                console.error(
                    '[UserProfileForm] Error during submission:',
                    error
                );
            }
        },
        [queryClient, updateUserMutation, updateUserPolicyMutation]
    );

    const handleCancel = useCallback(() => {
        reset();
    }, [reset]);

    const mergedItems = React.useMemo(
        () => [...(mediaFolders || []), ...(channels || [])],
        [mediaFolders, channels]
    );

    return (
        <Stack component='form' spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <Box
                className='lnkEditUserPreferencesContainer'
                style={{ paddingBottom: '1em' }}
            >
                <Link
                    className='lnkEditUserPreferences button-link'
                    href={`#/mypreferencesmenu.html?userId=${currentUser.Id}`}
                    underline='hover'
                >
                    {globalize.translate('ButtonEditOtherUserPreferences')}
                </Link>
            </Box>

            {watch('Policy.IsDisabled') && (
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
            )}

            <TextFieldElement
                name={'Name'}
                control={control}
                label={globalize.translate('LabelName')}
                required
                fullWidth
            />

            {((authProviders && authProviders.length > 1)
                || (passwordResetProviders
                    && passwordResetProviders?.length > 1)) && (
                <Card sx={{ borderRadius: 2 }}>
                    <CardHeader
                        title={globalize.translate(
                            'HeaderAuthenticationSettings'
                        )}
                    />
                    <CardContent component={Stack}>
                        {authProviders && authProviders.length > 1 && (
                            <SelectElement
                                label={globalize.translate('LabelAuthProvider')}
                                name='Policy.AuthenticationProviderId'
                                control={control}
                                valueKey='Id'
                                labelKey='Name'
                                options={authProviders}
                                fullWidth
                                helperText={globalize.translate(
                                    'AuthProviderHelp'
                                )}
                            />
                        )}

                        {passwordResetProviders
                            && passwordResetProviders?.length > 1 && (
                            <SelectElement
                                label={globalize.translate(
                                    'LabelPasswordResetProvider'
                                )}
                                name='Policy.PasswordResetProviderId'
                                control={control}
                                valueKey='Id'
                                labelKey='Name'
                                options={passwordResetProviders}
                                fullWidth
                                helperText={globalize.translate(
                                    'PasswordResetProviderHelp'
                                )}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderUserPermissions')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.IsAdministrator'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowUserToManageServer'
                        )}
                        labelProps={{
                            disabled: !watch('HasConfiguredPassword')
                        }}
                        helperText={
                            !watch('HasConfiguredPassword') ?
                                globalize.translate(
                                    'ConfiguredPasswordRequiredForAdmin'
                                ) :
                                ''
                        }
                    />
                    <CheckboxElement
                        name={'Policy.EnableUserPreferenceAccess'}
                        control={control}
                        label={globalize.translate('AllowUserPreferenceAccess')}
                        helperText={globalize.translate(
                            'AllowUserPreferenceAccessHelp'
                        )}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderMediaManagementSettings')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.EnableCollectionManagement'}
                        control={control}
                        label={globalize.translate('AllowCollectionManagement')}
                    />
                    <CheckboxElement
                        name={'Policy.EnableSubtitleManagement'}
                        control={control}
                        label={globalize.translate('AllowSubtitleManagement')}
                    />
                    <CheckboxElement
                        name={'Policy.EnableLiveTvAccess'}
                        control={control}
                        label={globalize.translate('OptionAllowBrowsingLiveTv')}
                    />
                    <CheckboxElement
                        name={'Policy.EnableLiveTvManagement'}
                        control={control}
                        label={globalize.translate('OptionAllowManageLiveTv')}
                    />
                    <CheckboxElement
                        name={'Policy.EnableContentDownloading'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowContentDownload'
                        )}
                        helperText={globalize.translate(
                            'OptionAllowContentDownloadHelp'
                        )}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderSyncAndPlaybackSettings')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.EnableMediaPlayback'}
                        control={control}
                        label={globalize.translate('OptionAllowMediaPlayback')}
                    />
                    <CheckboxElement
                        name={'Policy.EnableAudioPlaybackTranscoding'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowAudioPlaybackTranscoding'
                        )}
                    />
                    <CheckboxElement
                        name={'Policy.EnableVideoPlaybackTranscoding'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowVideoPlaybackTranscoding'
                        )}
                    />
                    <CheckboxElement
                        name={'Policy.EnablePlaybackRemuxing'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowVideoPlaybackRemuxing'
                        )}
                    />
                    <CheckboxElement
                        name={'Policy.ForceRemoteSourceTranscoding'}
                        control={control}
                        label={globalize.translate(
                            'OptionForceRemoteSourceTranscoding'
                        )}
                    />
                    <FormHelperText>
                        {globalize.translate(
                            'OptionAllowMediaPlaybackTranscodingHelp'
                        )}
                    </FormHelperText>
                    <SelectElement
                        label={globalize.translate('LabelSyncPlayAccess')}
                        name='Policy.SyncPlayAccess'
                        control={control}
                        options={syncPlayAccessOptions.map((option) => ({
                            id: option.value,
                            label: globalize.translate(option.label)
                        }))}
                        sx={{ mt: 2 }}
                        fullWidth
                        helperText={globalize.translate('SyncPlayAccessHelp')}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderRemoteAccessSettings')}
                />
                <CardContent component={Stack}>
                    {(config as NetworkConfiguration)?.EnableRemoteAccess && (
                        <CheckboxElement
                            name={'Policy.EnableRemoteAccess'}
                            control={control}
                            label={globalize.translate('AllowRemoteAccess')}
                            helperText={globalize.translate(
                                'AllowRemoteAccessHelp'
                            )}
                        />
                    )}

                    <TextFieldElement
                        name={'Policy.RemoteClientBitrateLimit'}
                        control={control}
                        label={globalize.translate(
                            'LabelRemoteClientBitrateLimit'
                        )}
                        type='number'
                        inputProps={{
                            inputMode: 'decimal',
                            pattern: '[0-9]*(.[0-9]+)?',
                            min: 0,
                            step: 0.25
                        }}
                        fullWidth
                        helperText={
                            <>
                                {globalize.translate(
                                    'LabelRemoteClientBitrateLimitHelp'
                                )}
                                <br />
                                {globalize.translate(
                                    'LabelUserRemoteClientBitrateLimitHelp'
                                )}
                            </>
                        }
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderAllowMediaDeletionFrom')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.EnableContentDeletion'}
                        control={control}
                        label={globalize.translate('AllLibraries')}
                    />

                    {!watch('Policy.EnableContentDeletion') && (
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: theme.palette.background.paper
                            }}
                        >
                            <CheckboxButtonGroup
                                label={globalize.translate(
                                    'HeaderLibraryContentDeletion'
                                )}
                                name='Policy.EnableContentDeletionFromFolders'
                                control={control}
                                options={mergedItems.map((item) => ({
                                    id: item.Id,
                                    label: item.Name
                                }))}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderRemoteControl')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.EnableRemoteControlOfOtherUsers'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowRemoteControlOthers'
                        )}
                    />
                    <CheckboxElement
                        name={'Policy.EnableSharedDeviceControl'}
                        control={control}
                        label={globalize.translate(
                            'OptionAllowRemoteSharedDevices'
                        )}
                        helperText={globalize.translate(
                            'OptionAllowRemoteSharedDevicesHelp'
                        )}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderAccountSettings')}
                />
                <CardContent component={Stack}>
                    <CheckboxElement
                        name={'Policy.IsDisabled'}
                        control={control}
                        label={globalize.translate('OptionDisableUser')}
                        helperText={globalize.translate(
                            'OptionDisableUserHelp'
                        )}
                    />
                    <CheckboxElement
                        name={'Policy.IsHidden'}
                        control={control}
                        label={globalize.translate('OptionHideUser')}
                        helperText={globalize.translate(
                            'OptionHideUserFromLoginHelp'
                        )}
                    />
                    <TextFieldElement
                        name={'Policy.LoginAttemptsBeforeLockout'}
                        control={control}
                        label={globalize.translate(
                            'LabelUserLoginAttemptsBeforeLockout'
                        )}
                        type='number'
                        inputProps={{
                            min: -1,
                            step: 1
                        }}
                        sx={{ mt: 2 }}
                        fullWidth
                        helperText={
                            <>
                                {globalize.translate(
                                    'OptionLoginAttemptsBeforeLockout'
                                )}
                                <br />
                                {globalize.translate(
                                    'OptionLoginAttemptsBeforeLockoutHelp'
                                )}
                            </>
                        }
                    />
                    <TextFieldElement
                        name={'Policy.MaxActiveSessions'}
                        control={control}
                        label={globalize.translate(
                            'LabelUserMaxActiveSessions'
                        )}
                        type='number'
                        inputProps={{
                            min: 0,
                            step: 1
                        }}
                        sx={{ mt: 2 }}
                        fullWidth
                        helperText={
                            <>
                                {globalize.translate('OptionMaxActiveSessions')}
                                <br />
                                {globalize.translate(
                                    'OptionMaxActiveSessionsHelp'
                                )}
                            </>
                        }
                    />
                </CardContent>
            </Card>

            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit'
                    disabled={!formState.isDirty || formState.isSubmitting}
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    className='emby-button raised button-cancel'
                    disabled={!formState.isDirty}
                    onClick={handleCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserProfileForm;
