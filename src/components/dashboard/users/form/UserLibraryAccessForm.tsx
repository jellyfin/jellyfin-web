import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import globalize from 'scripts/globalize';
import { libraryHooks, channelsHooks, devicesHooks } from 'hooks/api';

interface UserLibraryAccessFormProps {
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const UserLibraryAccessForm: FC<UserLibraryAccessFormProps> = ({
    currentUser,
    setCurrentUser,
    onFormSubmit
}) => {
    const { data: mediaFolders } = libraryHooks.useGetMediaFolders({
        isHidden: false
    });
    const { data: channels } = channelsHooks.useGetChannels({
        userId: currentUser?.Id
    });
    const { data: devices } = devicesHooks.useGetDevices({
        userId: currentUser?.Id
    });

    const onEnabledFoldersChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as string;
            const existingValue = currentUser?.Policy?.EnabledFolders ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    EnabledFolders: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser?.Policy?.EnabledFolders, setCurrentUser]
    );

    const onEnabledChannelsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as string;
            const existingValue = currentUser?.Policy?.EnabledChannels ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    EnabledChannels: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser?.Policy?.EnabledChannels, setCurrentUser]
    );

    const onEnabledDevicesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value as string;
            const existingValue = currentUser?.Policy?.EnabledDevices ?? [];

            const updatedValue = existingValue.includes(value) ?
                existingValue.filter((filter) => filter !== value) :
                [...existingValue, value];

            setCurrentUser((prevState) => ({
                ...prevState,
                Policy: {
                    ...prevState?.Policy,
                    AuthenticationProviderId:
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    EnabledDevices: updatedValue.length ?
                        updatedValue :
                        undefined
                }
            }));
        },
        [currentUser?.Policy?.EnabledDevices, setCurrentUser]
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
                        prevState?.Policy?.AuthenticationProviderId || '',
                    PasswordResetProviderId:
                        prevState?.Policy?.PasswordResetProviderId || '',
                    [name]: value
                }
            }));
        },
        [setCurrentUser]
    );

    return (
        <form onSubmit={onFormSubmit} className='userLibraryAccessForm'>
            <Box className='folderAccessContainer verticalSection-extrabottompadding'>
                <Typography variant='h2' className='checkboxListLabel'>
                    {globalize.translate('HeaderLibraryAccess')}
                </Typography>
                <Box className='checkboxContainer checkboxContainer-withDescription'>
                    <FormControlLabel
                        control={
                            <Checkbox
                                className='chkEnableAllFolders'
                                checked={currentUser?.Policy?.EnableAllFolders}
                                onChange={onFormChange}
                                name='EnableAllFolders'
                            />
                        }
                        label={globalize.translate(
                            'OptionEnableAccessToAllLibraries'
                        )}
                    />
                </Box>

                {!currentUser?.Policy?.EnableAllFolders ? (
                    <Box className='folderAccessListContainer'>
                        <Box className='folderAccess'>
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
                                        {mediaFolders?.map((mediaFolder) => (
                                            <FormControlLabel
                                                key={mediaFolder.Id}
                                                control={
                                                    <Checkbox
                                                        className='chkFolder'
                                                        checked={
                                                            !!currentUser
                                                                ?.Policy
                                                                ?.EnableAllFolders
                                                            || currentUser?.Policy?.EnabledFolders?.includes(
                                                                mediaFolder.Id
                                                                    || ''
                                                            )
                                                        }
                                                        onChange={
                                                            onEnabledFoldersChange
                                                        }
                                                        value={
                                                            mediaFolder.Id || ''
                                                        }
                                                    />
                                                }
                                                label={mediaFolder.Name}
                                            />
                                        ))}
                                    </FormGroup>
                                </FormControl>
                            </Box>
                        </Box>
                        <FormHelperText>
                            {globalize.translate('LibraryAccessHelp')}
                        </FormHelperText>
                    </Box>
                ) : null}
            </Box>

            {channels?.length ? (
                <Box className='channelAccessContainer verticalSection-extrabottompadding'>
                    <Typography variant='h2' className='checkboxListLabel'>
                        {globalize.translate('HeaderChannelAccess')}
                    </Typography>
                    <Box className='checkboxContainer checkboxContainer-withDescription'>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    className='chkEnableAllChannels'
                                    checked={
                                        currentUser?.Policy?.EnableAllChannels
                                    }
                                    onChange={onFormChange}
                                    name='EnableAllChannels'
                                />
                            }
                            label={globalize.translate(
                                'OptionEnableAccessToAllChannels'
                            )}
                        />
                    </Box>

                    {!currentUser?.Policy?.EnableAllChannels ? (
                        <Box className='channelAccessListContainer'>
                            <Box className='channelAccess'>
                                <Typography
                                    variant='h2'
                                    className='checkboxListLabel'
                                >
                                    {globalize.translate('Channels')}
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
                                            {channels?.map((channel) => (
                                                <FormControlLabel
                                                    key={channel.Id}
                                                    control={
                                                        <Checkbox
                                                            className='chkChannel'
                                                            checked={
                                                                !!currentUser
                                                                    ?.Policy
                                                                    ?.EnableAllChannels
                                                                || currentUser?.Policy?.EnabledChannels?.includes(
                                                                    channel.Id
                                                                        || ''
                                                                )
                                                            }
                                                            onChange={
                                                                onEnabledChannelsChange
                                                            }
                                                            value={
                                                                channel.Id || ''
                                                            }
                                                        />
                                                    }
                                                    label={channel.Name}
                                                />
                                            ))}
                                        </FormGroup>
                                    </FormControl>
                                </Box>
                            </Box>
                            <FormHelperText>
                                {globalize.translate('ChannelAccessHelp')}
                            </FormHelperText>
                        </Box>
                    ) : null}
                </Box>
            ) : null}

            {!currentUser?.Policy?.IsAdministrator ? (
                <Box className='deviceAccessContainer verticalSection-extrabottompadding'>
                    <Typography variant='h2' className='checkboxListLabel'>
                        {globalize.translate('HeaderDeviceAccess')}
                    </Typography>
                    <Box className='checkboxContainer checkboxContainer-withDescription'>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    className='chkEnableAllDevices'
                                    checked={
                                        currentUser?.Policy?.EnableAllDevices
                                    }
                                    onChange={onFormChange}
                                    name='EnableAllDevices'
                                />
                            }
                            label={globalize.translate(
                                'OptionEnableAccessFromAllDevices'
                            )}
                        />
                    </Box>

                    {!currentUser?.Policy?.EnableAllDevices ? (
                        <Box className='deviceAccessListContainer'>
                            <Box className='deviceAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('HeaderDevices')}
                                </h3>
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
                                            {devices?.map((device) => (
                                                <FormControlLabel
                                                    key={device.Id}
                                                    control={
                                                        <Checkbox
                                                            className='chkDevice'
                                                            checked={
                                                                !!currentUser
                                                                    ?.Policy
                                                                    ?.EnableAllDevices
                                                                || currentUser?.Policy?.EnabledDevices?.includes(
                                                                    device.Id
                                                                        || ''
                                                                )
                                                            }
                                                            onChange={
                                                                onEnabledDevicesChange
                                                            }
                                                            value={
                                                                device.Id || ''
                                                            }
                                                        />
                                                    }
                                                    label={`${device.Name} - ${device.AppName}`}
                                                />
                                            ))}
                                        </FormGroup>
                                    </FormControl>
                                </Box>
                            </Box>
                            <FormHelperText>
                                {globalize.translate('DeviceAccessHelp')}
                            </FormHelperText>
                        </Box>
                    ) : null}
                </Box>
            ) : null}

            <Box>
                <Button
                    type='submit'
                    className='emby-button raised button-submit block'
                >
                    {globalize.translate('Save')}
                </Button>
            </Box>
        </form>
    );
};

export default UserLibraryAccessForm;
