import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import React, { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import globalize from 'scripts/globalize';
import {
    sessionHooks,
    libraryHooks,
    channelsHooks,
    configurationHooks
} from 'hooks/api';

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

    const onRemoteClientBitrateLimitChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            console.log(
                'onRemoteClientBitrateLimitChange-value',
                event.target.value
            );
            console.log(
                'onRemoteClientBitrateLimitChange-value',
                event.target.value
            );
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

    const onContentDeletionFromFoldersChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as string;
            const existingValue =
                currentUser?.Policy?.EnableContentDeletionFromFolders ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState.Policy?.PasswordResetProviderId || '',
                    EnableContentDeletionFromFolders: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser?.Policy?.EnableContentDeletionFromFolders, setCurrentUser]
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
        <form onSubmit={onFormSubmit} className='userProfileForm'>
            {currentUser?.Policy?.IsDisabled ? (
                <Box className='disabledUserBanner'>
                    <Box className='btn btnDarkAccent btnStatic'>
                        <Box>
                            {globalize.translate(
                                'HeaderThisUserIsCurrentlyDisabled'
                            )}
                        </Box>
                        <Box style={{ marginTop: 5 }}>
                            {globalize.translate('MessageReenableUser')}
                        </Box>
                    </Box>
                </Box>
            ) : null}

            <Box id='fldUserName' className='inputContainer'>
                <Stack spacing={1}>
                    <InputLabel className='inputLabel' htmlFor='txtUserName'>
                        {globalize.translate('LabelName')}
                    </InputLabel>
                    <OutlinedInput
                        id='txtUserName'
                        type='text'
                        value={currentUser.Name}
                        name='Name'
                        onChange={onNameChange}
                        fullWidth
                        required
                    />
                </Stack>
            </Box>

            {authProviders && authProviders.length > 1 ? (
                <Box className='selectContainer fldSelectLoginProvider'>
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='selectLoginProvider-label'
                        >
                            {globalize.translate('LabelAuthProvider')}
                        </InputLabel>
                        <Select
                            id='selectLoginProvider'
                            name='AuthenticationProviderId'
                            value={
                                currentUser?.Policy?.AuthenticationProviderId
                                || ''
                            }
                            onChange={onSelectChange}
                        >
                            {authProviders?.map((option) => (
                                <MenuItem
                                    key={option.Id}
                                    value={option.Id as string}
                                >
                                    {option.Name}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {globalize.translate('AuthProviderHelp')}
                        </FormHelperText>
                    </Stack>
                </Box>
            ) : null}

            {passwordResetProviders && passwordResetProviders?.length > 1 ? (
                <Box className='selectContainer fldSelectPasswordResetProvider'>
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='selectPasswordResetProvider-label'
                        >
                            {globalize.translate('LabelPasswordResetProvider')}
                        </InputLabel>
                        <Select
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
                        <FormHelperText>
                            {globalize.translate('PasswordResetProviderHelp')}
                        </FormHelperText>
                    </Stack>
                </Box>
            ) : null}

            <Box className='verticalSection verticalSection-extrabottompadding'>
                {config?.EnableRemoteAccess ? (
                    <Box className='checkboxContainer checkboxContainer-withDescription fldRemoteAccess'>
                        <FormControl>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            className='chkRemoteAccess'
                                            checked={
                                                currentUser?.Policy
                                                    ?.EnableRemoteAccess
                                            }
                                            onChange={onFormChange}
                                            name='EnableRemoteAccess'
                                        />
                                    }
                                    label={globalize.translate(
                                        'AllowRemoteAccess'
                                    )}
                                />
                            </FormGroup>
                            <FormHelperText>
                                {globalize.translate('AllowRemoteAccessHelp')}
                            </FormHelperText>
                        </FormControl>
                    </Box>
                ) : null}

                <FormControl>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    className='chkIsAdmin'
                                    checked={
                                        currentUser?.Policy?.IsAdministrator
                                    }
                                    onChange={onFormChange}
                                    name='IsAdministrator'
                                />
                            }
                            label={globalize.translate(
                                'OptionAllowUserToManageServer'
                            )}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    className='chkEnableCollectionManagement'
                                    checked={
                                        currentUser?.Policy
                                            ?.EnableCollectionManagement
                                    }
                                    onChange={onFormChange}
                                    name='EnableCollectionManagement'
                                />
                            }
                            label={globalize.translate(
                                'AllowCollectionManagement'
                            )}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    className='chkEnableSubtitleManagement'
                                    checked={
                                        currentUser?.Policy
                                            ?.EnableSubtitleManagement
                                    }
                                    onChange={onFormChange}
                                    name='EnableSubtitleManagement'
                                />
                            }
                            label={globalize.translate(
                                'AllowSubtitleManagement'
                            )}
                        />
                    </FormGroup>
                </FormControl>
            </Box>
            <Box
                id='featureAccessFields'
                className='verticalSection verticalSection-extrabottompadding'
            >
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderFeatureAccess')}
                </Typography>
                <Box
                    className='checkboxList paperList'
                    style={{ padding: '.5em 1em' }}
                >
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableLiveTvAccess'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableLiveTvAccess
                                        }
                                        onChange={onFormChange}
                                        name='EnableLiveTvAccess'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowBrowsingLiveTv'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkManageLiveTv'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableLiveTvManagement
                                        }
                                        onChange={onFormChange}
                                        name='EnableLiveTvManagement'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowManageLiveTv'
                                )}
                            />
                        </FormGroup>
                    </FormControl>
                </Box>
            </Box>

            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderPlayback')}
                </Typography>

                <Box
                    className='checkboxList paperList'
                    style={{ padding: '.5em 1em' }}
                >
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableMediaPlayback'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableMediaPlayback
                                        }
                                        onChange={onFormChange}
                                        name='EnableMediaPlayback'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowMediaPlayback'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableAudioPlaybackTranscoding'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableAudioPlaybackTranscoding
                                        }
                                        onChange={onFormChange}
                                        name='EnableAudioPlaybackTranscoding'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowAudioPlaybackTranscoding'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableVideoPlaybackTranscoding'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableVideoPlaybackTranscoding
                                        }
                                        onChange={onFormChange}
                                        name='EnableVideoPlaybackTranscoding'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowVideoPlaybackTranscoding'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableVideoPlaybackRemuxing'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnablePlaybackRemuxing
                                        }
                                        onChange={onFormChange}
                                        name='EnablePlaybackRemuxing'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowVideoPlaybackRemuxing'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkForceRemoteSourceTranscoding'
                                        checked={
                                            currentUser?.Policy
                                                ?.ForceRemoteSourceTranscoding
                                        }
                                        onChange={onFormChange}
                                        name='ForceRemoteSourceTranscoding'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionForceRemoteSourceTranscoding'
                                )}
                            />
                        </FormGroup>
                    </FormControl>
                </Box>
                <FormHelperText>
                    {globalize.translate(
                        'OptionAllowMediaPlaybackTranscodingHelp'
                    )}
                </FormHelperText>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Box className='inputContainer'>
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='txtRemoteClientBitrateLimit'
                        >
                            {globalize.translate(
                                'LabelRemoteClientBitrateLimit'
                            )}
                        </InputLabel>
                        <OutlinedInput
                            id='txtRemoteClientBitrateLimit'
                            type='number'
                            inputProps={{
                                inputMode: 'decimal',
                                pattern: '[0-9]*(.[0-9]+)?',
                                min: 0,
                                step: 0.25
                            }}
                            value={
                                currentUser?.Policy?.RemoteClientBitrateLimit
                                && currentUser?.Policy?.RemoteClientBitrateLimit
                                    > 0 ?
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
                            fullWidth
                        />

                        <FormHelperText>
                            {globalize.translate(
                                'LabelRemoteClientBitrateLimitHelp'
                            )}
                        </FormHelperText>

                        <FormHelperText>
                            {globalize.translate(
                                'LabelUserRemoteClientBitrateLimitHelp'
                            )}
                        </FormHelperText>
                    </Stack>
                </Box>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Box className='selectContainer fldSelectSyncPlayAccess'>
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='selectSyncPlayAccess-label'
                        >
                            {globalize.translate('LabelSyncPlayAccess')}
                        </InputLabel>
                        <Select
                            id='selectSyncPlayAccess'
                            name='SyncPlayAccess'
                            value={currentUser?.Policy?.SyncPlayAccess}
                            onChange={onSelectChange}
                        >
                            {syncPlayAccessOptions.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {globalize.translate(option.label)}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {globalize.translate('SyncPlayAccessHelp')}
                        </FormHelperText>
                    </Stack>
                </Box>
            </Box>
            <Box className='deleteAccessAccessContainer verticalSection-extrabottompadding'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderAllowMediaDeletionFrom')}
                </Typography>
                <Box className='checkboxContainer checkboxContainer-withDescription'>
                    <FormControlLabel
                        control={
                            <Checkbox
                                className='chkEnableDeleteAllFolders'
                                checked={
                                    currentUser?.Policy?.EnableContentDeletion
                                }
                                onChange={onFormChange}
                                name='EnableContentDeletion'
                            />
                        }
                        label={globalize.translate('AllLibraries')}
                    />
                </Box>

                {!currentUser?.Policy?.EnableContentDeletion ? (
                    <Box className='deleteAccessListContainer'>
                        <Box className='deleteAccess'>
                            <Typography
                                variant='h2'
                                className='checkboxListLabel'
                            >
                                {globalize.translate('HeaderLibraries')}
                            </Typography>

                            <Box
                                className='checkboxList paperList'
                                style={{
                                    padding: '.5em 1em'
                                }}
                            >
                                <FormControl
                                    component='fieldset'
                                    variant='standard'
                                >
                                    <FormGroup>
                                        {mediaFolders?.map((folder) => (
                                            <FormControlLabel
                                                key={folder.Id}
                                                control={
                                                    <Checkbox
                                                        className='chkFolder'
                                                        checked={
                                                            !!currentUser
                                                                ?.Policy
                                                                ?.EnableContentDeletion
                                                            || currentUser?.Policy?.EnableContentDeletionFromFolders?.includes(
                                                                String(
                                                                    folder.Id
                                                                )
                                                            )
                                                        }
                                                        onChange={
                                                            onContentDeletionFromFoldersChange
                                                        }
                                                        value={String(
                                                            folder.Id
                                                        )}
                                                    />
                                                }
                                                label={folder.Name}
                                            />
                                        ))}

                                        {channels?.map((folder) => (
                                            <FormControlLabel
                                                key={folder.Id}
                                                control={
                                                    <Checkbox
                                                        className='chkFolder'
                                                        checked={
                                                            !!currentUser
                                                                ?.Policy
                                                                ?.EnableContentDeletion
                                                            || currentUser?.Policy?.EnableContentDeletionFromFolders?.includes(
                                                                String(
                                                                    folder.Id
                                                                )
                                                            )
                                                        }
                                                        onChange={
                                                            onContentDeletionFromFoldersChange
                                                        }
                                                        value={String(
                                                            folder.Id
                                                        )}
                                                    />
                                                }
                                                label={folder.Name}
                                            />
                                        ))}
                                    </FormGroup>
                                </FormControl>
                            </Box>
                        </Box>
                    </Box>
                ) : null}
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderRemoteControl')}
                </Typography>

                <Box
                    className='checkboxList paperList'
                    style={{ padding: '.5em 1em' }}
                >
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableRemoteControlOtherUsers'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableRemoteControlOfOtherUsers
                                        }
                                        onChange={onFormChange}
                                        name='EnableRemoteControlOfOtherUsers'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowRemoteControlOthers'
                                )}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkRemoteControlSharedDevices'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableSharedDeviceControl
                                        }
                                        onChange={onFormChange}
                                        name='EnableSharedDeviceControl'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowRemoteSharedDevices'
                                )}
                            />
                        </FormGroup>
                    </FormControl>
                </Box>
                <FormHelperText>
                    {globalize.translate(
                        'OptionAllowMediaPlaybackTranscodingHelp'
                    )}
                </FormHelperText>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('Other')}
                </Typography>

                <Box className='checkboxContainer checkboxContainer-withDescription'>
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkEnableDownloading'
                                        checked={
                                            currentUser?.Policy
                                                ?.EnableContentDownloading
                                        }
                                        onChange={onFormChange}
                                        name='EnableContentDownloading'
                                    />
                                }
                                label={globalize.translate(
                                    'OptionAllowRemoteControlOthers'
                                )}
                            />
                        </FormGroup>
                        <FormHelperText>
                            {globalize.translate(
                                'OptionAllowContentDownloadHelp'
                            )}
                        </FormHelperText>
                    </FormControl>
                </Box>
                <Box
                    className='checkboxContainer checkboxContainer-withDescription'
                    id='fldIsEnabled'
                >
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkDisabled'
                                        checked={
                                            currentUser?.Policy?.IsDisabled
                                        }
                                        onChange={onFormChange}
                                        name='IsDisabled'
                                    />
                                }
                                label={globalize.translate('OptionDisableUser')}
                            />
                        </FormGroup>
                        <FormHelperText>
                            {globalize.translate('OptionDisableUserHelp')}
                        </FormHelperText>
                    </FormControl>
                </Box>

                <Box
                    className='checkboxContainer checkboxContainer-withDescription'
                    id='fldIsHidden'
                >
                    <FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className='chkIsHidden'
                                        checked={currentUser?.Policy?.IsHidden}
                                        onChange={onFormChange}
                                        name='IsHidden'
                                    />
                                }
                                label={globalize.translate('OptionHideUser')}
                            />
                        </FormGroup>
                        <FormHelperText>
                            {globalize.translate('OptionHideUserFromLoginHelp')}
                        </FormHelperText>
                    </FormControl>
                </Box>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Box
                    className='inputContainer'
                    id='fldLoginAttemptsBeforeLockout'
                >
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='txtLoginAttemptsBeforeLockout'
                        >
                            {globalize.translate(
                                'LabelUserLoginAttemptsBeforeLockout'
                            )}
                        </InputLabel>
                        <OutlinedInput
                            id='txtLoginAttemptsBeforeLockout'
                            type='number'
                            inputProps={{
                                min: -1,
                                step: 1
                            }}
                            value={
                                currentUser?.Policy
                                    ?.LoginAttemptsBeforeLockout || 0
                            }
                            name='LoginAttemptsBeforeLockout'
                            onChange={onFormChange}
                            fullWidth
                        />

                        <FormHelperText>
                            {globalize.translate(
                                'OptionLoginAttemptsBeforeLockout'
                            )}
                        </FormHelperText>

                        <FormHelperText>
                            {globalize.translate(
                                'OptionLoginAttemptsBeforeLockoutHelp'
                            )}
                        </FormHelperText>
                    </Stack>
                </Box>
            </Box>
            <Box className='verticalSection verticalSection-extrabottompadding'>
                <Box className='inputContainer' id='fldMaxActiveSessions'>
                    <Stack spacing={1}>
                        <InputLabel
                            className='inputLabel'
                            htmlFor='txtMaxActiveSessions'
                        >
                            {globalize.translate('LabelUserMaxActiveSessions')}
                        </InputLabel>
                        <OutlinedInput
                            id='txtMaxActiveSessions'
                            type='number'
                            inputProps={{
                                min: 0,
                                step: 1
                            }}
                            value={currentUser?.Policy?.MaxActiveSessions || 0}
                            name='MaxActiveSessions'
                            onChange={onFormChange}
                            fullWidth
                        />

                        <FormHelperText>
                            {globalize.translate('OptionMaxActiveSessions')}
                        </FormHelperText>

                        <FormHelperText>
                            {globalize.translate('OptionMaxActiveSessionsHelp')}
                        </FormHelperText>
                    </Stack>
                </Box>
            </Box>
            <Box>
                <Stack spacing={2} direction='column'>
                    <Button
                        type='submit'
                        className='emby-button raised button-submit block'
                    >
                        {globalize.translate('Save')}
                    </Button>
                    <Button
                        type='button'
                        id='btnCancel'
                        className='emby-button raised button-cancel block'
                        onClick={onBtnCancelClick}
                    >
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </Stack>
            </Box>
        </form>
    );
};

export default UserProfileForm;
