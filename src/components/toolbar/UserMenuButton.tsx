import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import React, { useCallback, useState } from 'react';

import UserAvatar from 'components/UserAvatar';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import AppUserMenu, { ID } from './AppUserMenu';

const UserMenuButton = () => {
    const { user } = useApi();

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
            <Tooltip title={globalize.translate('UserMenu')} variant="soft">
                <IconButton
                    variant="plain"
                    color="neutral"
                    aria-label={globalize.translate('UserMenu')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onUserButtonClick}
                    sx={{ p: 0.5, borderRadius: '50%' }}
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