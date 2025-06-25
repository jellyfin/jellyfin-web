import { FC } from 'react';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

import { useApi } from 'hooks/useApi';

interface UserAvatarProps {
    user?: UserDto
}

const UserAvatar: FC<UserAvatarProps> = ({ user }) => {
    const { api } = useApi();
    const theme = useTheme();

    return user ? (
        <Avatar
            alt={user.Name ?? undefined}
            src={
                api && user.Id && user.PrimaryImageTag ?
                    `${api.basePath}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}` :
                    undefined
            }
            sx={{
                bgcolor: api && user.Id && user.PrimaryImageTag ?
                    theme.palette.background.paper :
                    theme.palette.primary.dark,
                color: 'inherit'
            }}
        />
    ) : null;
};

export default UserAvatar;
