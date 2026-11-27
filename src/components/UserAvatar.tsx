import React, { type FC } from 'react';
import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import PersonIcon from '@mui/icons-material/Person';
import Avatar, { type AvatarProps } from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import type {} from '@mui/material/themeCssVarsAugmentation';

import { useApi } from 'hooks/useApi';
import { getUserAvatarBackgroundClass } from 'utils/userAvatar';

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
                    bgcolor: theme.vars.palette.background.paper,
                    // Like the icon of the other cards without an image, the fallback icon takes the color of the
                    // text, unless the theme gives its card backgrounds a color of their own
                    color: imageUrl ? 'inherit' : theme.vars.palette.text.primary
                }),
                {
                    width: size,
                    height: size
                },
                ...(Array.isArray(sx) ? sx : [ sx ])
            ]}
        >
            {/* Shown without a picture. One of the theme's card background colors tells users apart (and stays the
                same for a user everywhere). It is applied to a child, where the theme's class does not compete with
                the background the avatar sets on itself */}
            <Box
                className={getUserAvatarBackgroundClass(user)}
                sx={{ width: 1, height: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <PersonIcon sx={{ width: '75%', height: '75%' }} />
            </Box>
        </Avatar>
    ) : null;
};

export default UserAvatar;
