import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import type { SxProps, Theme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

import UserAvatar from '@/components/UserAvatar';

interface UserAvatarButtonProps {
    user?: UserDto
    sx?: SxProps<Theme>
}

const UserAvatarButton: FC<UserAvatarButtonProps> = ({
    user,
    sx
}) => (
    user?.Id ? (
        <IconButton
            size='large'
            color='inherit'
            sx={{
                padding: 0,
                ...sx
            }}
            title={user.Name || undefined}
            component={Link}
            to={`/dashboard/users/profile?userId=${user.Id}`}
        >
            <UserAvatar user={user} />
        </IconButton>
    ) : undefined
);

export default UserAvatarButton;
