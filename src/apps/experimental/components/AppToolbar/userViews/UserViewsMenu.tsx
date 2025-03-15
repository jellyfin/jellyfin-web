import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { appRouter } from 'components/router/appRouter';

import LibraryIcon from '../../LibraryIcon';
import { Divider } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import globalize from 'lib/globalize';

interface UserViewsMenuProps extends MenuProps {
    userViews: BaseItemDto[]
    selectedId?: string
    includeGlobalViews?: boolean
    onMenuClose: () => void
}

const UserViewsMenu: FC<UserViewsMenuProps> = ({
    userViews,
    selectedId,
    includeGlobalViews = false,
    onMenuClose,
    ...props
}) => {
    return (
        <Menu
            {...props}
            keepMounted
            onClose={onMenuClose}
        >
            {includeGlobalViews && (
                <>
                    <MenuItem
                        component={Link}
                        to='/home.html?tab=1'
                        onClick={onMenuClose}
                        selected={selectedId === 'favorites'}
                    >
                        <ListItemIcon>
                            <Favorite />
                        </ListItemIcon>
                        <ListItemText>
                            {globalize.translate('Favorites')}
                        </ListItemText>
                    </MenuItem>
                    <Divider />
                </>
            )}

            {userViews.map(view => (
                <MenuItem
                    key={view.Id}
                    component={Link}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                    onClick={onMenuClose}
                    selected={view.Id === selectedId}
                >
                    <ListItemIcon>
                        <LibraryIcon item={view} />
                    </ListItemIcon>
                    <ListItemText>
                        {view.Name}
                    </ListItemText>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default UserViewsMenu;
