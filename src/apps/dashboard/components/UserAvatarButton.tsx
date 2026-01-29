import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import UserAvatar from 'components/UserAvatar';
import React from 'react';
import { IconButton } from 'ui-primitives';

interface UserAvatarButtonProps {
    readonly user?: UserDto;
    readonly style?: React.CSSProperties;
}

export function UserAvatarButton({
    user,
    style
}: UserAvatarButtonProps): React.ReactElement | null {
    const userId = user?.Id;

    if (userId == null) {
        return null;
    }

    return (
        <a
            href={`/dashboard/users/profile?userId=${userId}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
        >
            <IconButton
                variant="plain"
                size="lg"
                title={user?.Name ?? undefined}
                style={{ padding: 0, ...style }}
            >
                <UserAvatar user={user} />
            </IconButton>
        </a>
    );
}

export default UserAvatarButton;
