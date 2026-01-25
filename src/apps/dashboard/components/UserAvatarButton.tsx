import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';

import UserAvatar from 'components/UserAvatar';
import { IconButton } from 'ui-primitives/IconButton';

interface UserAvatarButtonProps {
    user?: UserDto;
    style?: React.CSSProperties;
}

export const UserAvatarButton: FC<UserAvatarButtonProps> = ({ user, style }) => {
    const userId = user?.Id;

    if (userId == null) {
        return undefined;
    }

    return (
        <a
            href={`/dashboard/users/profile?userId=${userId}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
        >
            <IconButton variant="plain" size="lg" title={user?.Name ?? undefined} style={{ padding: 0, ...style }}>
                <UserAvatar user={user} />
            </IconButton>
        </a>
    );
};

export default UserAvatarButton;
