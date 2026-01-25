import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import React, { useCallback, useState } from 'react';

import UserAvatar from 'components/UserAvatar';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import AppUserMenu, { ID } from './AppUserMenu';

const UserMenuButton = () => {
    const { user } = useApi();

    const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            setUserMenuAnchorEl(event.currentTarget);
        },
        [setUserMenuAnchorEl]
    );

    const onUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, [setUserMenuAnchorEl]);

    return (
        <>
            <Tooltip title={globalize.translate('UserMenu')}>
                <IconButton
                    variant="plain"
                    color="neutral"
                    aria-label={globalize.translate('UserMenu')}
                    aria-controls={ID}
                    aria-haspopup="true"
                    onClick={onUserButtonClick}
                    style={{ padding: 4, borderRadius: '50%' }}
                >
                    <UserAvatar user={user} />
                </IconButton>
            </Tooltip>

            <AppUserMenu open={isUserMenuOpen} anchorEl={userMenuAnchorEl} onMenuClose={onUserMenuClose} />
        </>
    );
};

export default UserMenuButton;
