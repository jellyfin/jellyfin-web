import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import SelectAllLibraryAccess from '../SelectAllLibraryAccess';
import SelectLibraryAccessList from '../SelectLibraryAccessList';

interface MediaFoldersSectionProps {
    mediaFolders: BaseItemDto[] | undefined;
    currentUser: UserDto;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserDto>>;
}

const MediaFoldersSection: FC<MediaFoldersSectionProps> = ({
    mediaFolders,
    currentUser,
    setCurrentUser
}) => {
    return (
        <Box>
            <SelectAllLibraryAccess
                policyKey={'EnableAllFolders'}
                title={'HeaderLibraryAccess'}
                formLabel={'OptionEnableAccessToAllLibraries'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            {!currentUser?.Policy?.EnableAllFolders && (
                <SelectLibraryAccessList
                    policyKey={'EnabledFolders'}
                    title={'HeaderLibraries'}
                    subTitle={'LibraryAccessHelp'}
                    items={mediaFolders}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                />
            )}
        </Box>
    );
};

export default MediaFoldersSection;
