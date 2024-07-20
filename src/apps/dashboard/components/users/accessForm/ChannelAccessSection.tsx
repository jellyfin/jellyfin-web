import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import SelectAllLibraryAccess from '../SelectAllLibraryAccess';
import SelectLibraryAccessList from '../SelectLibraryAccessList';

interface ChannelAccessSectionProps {
    channels: BaseItemDto[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const ChannelAccessSection: FC<ChannelAccessSectionProps> = ({
    channels,
    currentUser,
    setCurrentUser
}) => {
    return (
        <Box>
            <SelectAllLibraryAccess
                policyKey={'EnableAllChannels'}
                title={'HeaderChannelAccess'}
                formLabel={'OptionEnableAccessToAllChannels'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            {!currentUser?.Policy?.EnableAllChannels && (
                <SelectLibraryAccessList
                    policyKey={'EnabledChannels'}
                    title={'Channels'}
                    subTitle={'ChannelAccessHelp'}
                    items={channels}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
        </Box>
    );
};

export default ChannelAccessSection;
