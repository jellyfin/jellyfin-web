import React, { type FC } from 'react';
import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import Avatar, { type AvatarProps } from '@mui/material/Avatar';
import type {} from '@mui/material/themeCssVarsAugmentation';

import { useApi } from 'hooks/useApi';

interface UserAvatarProps extends AvatarProps {
    /** Overrides the api from the ApiContext (e.g. before a user is signed in) */
    api?: Api,
    user?: UserDto,
    size?: number
}

const UserAvatar: FC<UserAvatarProps> = ({
    api: apiOverride,
    user,
    size,
    alt,
    sx,
    ...props
}) => {
    const { api: contextApi } = useApi();
    const api = apiOverride ?? contextApi;
    const imageParams = size ?
        { width: Math.round(size * (window.devicePixelRatio || 1)) } :
        undefined;
    const imageUrl = api ? getImageApi(api).getUserImageUrl(user, imageParams) : undefined;

    return user ? (
        <Avatar
            alt={alt ?? user.Name ?? undefined}
            src={imageUrl}
            {...props}
            sx={[
                (theme) => ({
                    bgcolor: imageUrl ?
                        theme.vars.palette.background.paper :
                        theme.vars.palette.primary.dark,
                    color: 'inherit',
                    width: size,
                    height: size
                }),
                ...(Array.isArray(sx) ? sx : [ sx ])
            ]}
        />
    ) : null;
};

export default UserAvatar;
