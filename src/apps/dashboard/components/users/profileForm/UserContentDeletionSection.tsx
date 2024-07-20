import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import React, { type FC } from 'react';
import Stack from '@mui/material/Stack';
import SelectAllLibraryAccess from '../SelectAllLibraryAccess';
import SelectLibraryAccessList from '../SelectLibraryAccessList';

const getMergedItems = (
    mediaFolders: BaseItemDto[],
    channels: BaseItemDto[]
) => {
    return [...mediaFolders, ...channels];
};

interface UserContentDeletionSectionProps {
    mediaFolders: BaseItemDto[] | undefined;
    channels: BaseItemDto[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const UserContentDeletionSection: FC<UserContentDeletionSectionProps> = ({
    mediaFolders = [],
    channels = [],
    currentUser,
    setCurrentUser
}) => {
    const items = React.useMemo(
        () => getMergedItems(mediaFolders, channels),
        [mediaFolders, channels]
    );

    return (
        <Stack spacing={2}>
            <SelectAllLibraryAccess
                policyKey={'EnableContentDeletion'}
                title={'HeaderAllowMediaDeletionFrom'}
                formLabel={'AllLibraries'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            {!currentUser?.Policy?.EnableContentDeletion && (
                <SelectLibraryAccessList
                    policyKey={'EnableContentDeletionFromFolders'}
                    title={'HeaderLibraries'}
                    subTitle={'LibraryAccessHelp'}
                    items={items}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
        </Stack>
    );
};

export default UserContentDeletionSection;
