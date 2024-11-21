import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { FC, useCallback, useState } from 'react';

import UserAvatar from 'components/UserAvatar';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';

import AppUserMenu, { ID } from './AppUserMenu';

interface UserMenuButtonProps {
    userId?: string
}

const UserMenuButton: FC<UserMenuButtonProps> = ({ userId }) => {
    const { data: user } = userHooks.useGetUserById(userId);

    const [ userMenuAnchorEl, setUserMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchorEl(event.currentTarget);
    }, [ setUserMenuAnchorEl ]);

    const onUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, [ setUserMenuAnchorEl ]);

    return (
        <>
            <Tooltip title={globalize.translate('UserMenu')}>
                <IconButton
                    size='large'
                    edge='end'
                    aria-label={globalize.translate('UserMenu')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onUserButtonClick}
                    color='inherit'
                    sx={{ padding: 0 }}
                >
                    <UserAvatar user={user} />
                </IconButton>
            </Tooltip>

            <AppUserMenu
                open={isUserMenuOpen}
                anchorEl={userMenuAnchorEl}
                onMenuClose={onUserMenuClose}
            />
        </>
    );
};

export default UserMenuButton;
