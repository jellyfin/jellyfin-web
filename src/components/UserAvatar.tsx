import React, { FC } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

import { imageHooks } from 'hooks/api';

interface UserAvatarProps {
    user?: UserDto
}

const UserAvatar: FC<UserAvatarProps> = ({ user }) => {
    const { data: imgUrl } = imageHooks.useGetUserImageUrl(user, {
        tag: user?.PrimaryImageTag || ''
    });
    const theme = useTheme();

    return user ? (
        <Avatar
            alt={user.Name ?? undefined}
            src={imgUrl}
            sx={{
                bgcolor: theme.palette.primary.dark,
                color: 'inherit'
            }}
        />
    ) : null;
};

export default UserAvatar;
