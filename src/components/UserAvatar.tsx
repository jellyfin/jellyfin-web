import React, { FC } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

import { useApi } from 'hooks/useApi';

interface UserAvatarProps {
    user?: UserDto
    showTitle?: boolean
}

const UserAvatar: FC<UserAvatarProps> = ({ user, showTitle = false }) => {
    const { api } = useApi();
    const theme = useTheme();

    return user ? (
        <Avatar
            alt={user.Name ?? undefined}
            title={showTitle && user.Name ? user.Name : undefined}
            src={
                api && user.Id && user.PrimaryImageTag ?
                    `${api.basePath}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}` :
                    undefined
            }
            sx={{
                bgcolor: theme.palette.primary.dark,
                color: 'inherit'
            }}
        />
    ) : null;
};

export default UserAvatar;
