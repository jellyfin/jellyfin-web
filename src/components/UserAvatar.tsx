import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { useApi } from 'hooks/useApi';
import React, { type CSSProperties, type FC } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Avatar } from 'ui-primitives';

interface UserAvatarProps {
    user?: UserDto;
    style?: CSSProperties;
}

const UserAvatar: FC<UserAvatarProps> = ({ user, style }) => {
    const { api } = useApi();

    return user ? (
        <Avatar
            alt={user.Name ?? undefined}
            src={
                api && user.Id && user.PrimaryImageTag
                    ? `${api.basePath}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}`
                    : undefined
            }
            style={{
                backgroundColor:
                    api && user.Id && user.PrimaryImageTag
                        ? vars.colors.surface
                        : vars.colors.primaryHover,
                color: 'inherit',
                ...style
            }}
        />
    ) : null;
};

export default UserAvatar;
