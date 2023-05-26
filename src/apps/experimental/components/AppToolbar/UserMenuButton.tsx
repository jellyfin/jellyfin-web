import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';

import AppUserMenu, { ID } from './menus/AppUserMenu';

const UserMenuButton = () => {
    const theme = useTheme();
    const { api, user } = useApi();

    const [ userMenuAnchorEl, setUserMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback((event) => {
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
                    <Avatar
                        alt={user?.Name || undefined}
                        src={
                            api && user?.Id ?
                                `${api.basePath}/Users/${user.Id}/Images/Primary?tag=${user.PrimaryImageTag}` :
                                undefined
                        }
                        sx={{
                            bgcolor: theme.palette.primary.dark,
                            color: 'inherit'
                        }}
                    />
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
