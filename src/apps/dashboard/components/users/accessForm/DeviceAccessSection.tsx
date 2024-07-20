import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { DeviceInfo } from '@jellyfin/sdk/lib/generated-client/models/device-info';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import SelectAllLibraryAccess from '../SelectAllLibraryAccess';
import SelectLibraryAccessList from '../SelectLibraryAccessList';

interface DeviceAccessSectionProps {
    devices: DeviceInfo[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const DeviceAccessSection: FC<DeviceAccessSectionProps> = ({
    devices,
    currentUser,
    setCurrentUser
}) => {
    return (
        <Box>
            <SelectAllLibraryAccess
                policyKey={'EnableAllDevices'}
                title={'HeaderDeviceAccess'}
                formLabel={'OptionEnableAccessFromAllDevices'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            {!currentUser?.Policy?.EnableAllDevices && (
                <SelectLibraryAccessList
                    policyKey={'EnabledDevices'}
                    title={'HeaderDevices'}
                    subTitle={'DeviceAccessHelp'}
                    items={devices}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
        </Box>
    );
};

export default DeviceAccessSection;
