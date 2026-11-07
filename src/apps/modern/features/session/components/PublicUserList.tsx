import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Box from '@mui/material/Box';
import ButtonBase, { buttonBaseClasses } from '@mui/material/ButtonBase';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, useCallback } from 'react';

import UserAvatar from 'components/UserAvatar';

const AVATAR_SIZE = 72;
const AVATAR_SIZE_SM = 96;

interface PublicUserItemProps {
    api?: Api
    user: UserDto
    avatarSize: number
    disabled?: boolean
    onSelect: (user: UserDto) => void
}

const PublicUserItem: FC<PublicUserItemProps> = ({
    api,
    user,
    avatarSize,
    disabled,
    onSelect
}) => {
    const onClick = useCallback(() => {
        if (!disabled) onSelect(user);
    }, [ disabled, onSelect, user ]);

    return (
        <Box component='li' sx={{ width: '100%', minWidth: 0 }}>
            <ButtonBase
                focusRipple
                // aria-disabled instead of disabled keeps the focus on the user while a login is in progress
                aria-disabled={disabled || undefined}
                disableRipple={disabled}
                onClick={onClick}
                sx={theme => ({
                    flexDirection: 'column',
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    width: '100%',
                    '&:hover': {
                        bgcolor: theme.vars.palette.action.hover,
                        '@media (hover: none)': {
                            bgcolor: 'transparent'
                        }
                    },
                    // The focus background alone is too faint, so add an outline for keyboard users
                    [`&.${buttonBaseClasses.focusVisible}`]: {
                        bgcolor: theme.vars.palette.action.focus,
                        outline: `2px solid ${theme.vars.palette.primary.main}`,
                        outlineOffset: 2
                    },
                    '&[aria-disabled="true"]': {
                        cursor: 'default',
                        opacity: theme.vars.palette.action.disabledOpacity,
                        '&:hover': {
                            bgcolor: 'transparent'
                        }
                    }
                })}
            >
                <UserAvatar
                    api={api}
                    user={user}
                    size={avatarSize}
                    alt=''
                />
                <Typography
                    variant='body2'
                    noWrap
                    title={user.Name ?? undefined}
                    sx={{ width: '100%', textAlign: 'center' }}
                >
                    {user.Name}
                </Typography>
            </ButtonBase>
        </Box>
    );
};

interface PublicUserListProps {
    api?: Api
    users: UserDto[]
    disabled?: boolean
    onUserSelect: (user: UserDto) => void
}

const PublicUserList: FC<PublicUserListProps> = ({
    api,
    users,
    disabled,
    onUserSelect
}) => {
    const isSmUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
    const avatarSize = isSmUp ? AVATAR_SIZE_SM : AVATAR_SIZE;

    return (
        <Box
            component='ul'
            sx={{
                display: 'grid',
                // Fixed-width tracks with auto-fit collapse the unused tracks,
                // so a few users are centered instead of packed to the left
                gridTemplateColumns: {
                    xs: 'repeat(auto-fit, 5.5rem)',
                    sm: 'repeat(auto-fit, 7rem)'
                },
                justifyContent: 'center',
                justifyItems: 'center',
                gap: 2,
                listStyle: 'none',
                m: 0,
                p: 0,
                width: '100%'
            }}
        >
            {users.map(user => (
                <PublicUserItem
                    key={user.Id}
                    api={api}
                    user={user}
                    avatarSize={avatarSize}
                    disabled={disabled}
                    onSelect={onUserSelect}
                />
            ))}
        </Box>
    );
};

export default PublicUserList;
