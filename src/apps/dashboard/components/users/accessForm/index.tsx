import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import globalize from 'scripts/globalize';
import { libraryHooks, channelsHooks, devicesHooks } from 'hooks/api';
import MediaFoldersSection from './MediaFoldersSection';
import ChannelAccessSection from './ChannelAccessSection';
import DeviceAccessSection from './DeviceAccessSection';

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

    return (
        <Stack
            component='form'
            spacing={2}
            onSubmit={onFormSubmit}
        >
            <MediaFoldersSection
                mediaFolders={mediaFolders}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />

            {channels?.length ? (
                <ChannelAccessSection
                    channels={channels}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            ) : null}

            {!currentUser?.Policy?.IsAdministrator && (
                <DeviceAccessSection
                    devices={devices}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
            <Box>
                <Button
                    type='submit'
                    className='emby-button raised button-submit block'
                >
                    {globalize.translate('Save')}
                </Button>
            </Box>
        </Stack>
    );
};

export default UserLibraryAccessForm;
