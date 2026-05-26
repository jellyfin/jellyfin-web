import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import Icon from '@mui/material/Icon';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import LibraryIcon from 'apps/experimental/components/LibraryIcon';
import { appRouter } from 'components/router/appRouter';
import type { MenuLink } from 'types/webConfig';

interface UserViewsMenuProps extends MenuProps {
    userViews: (BaseItemDto | MenuLink)[]
    selectedId?: string
    includeGlobalViews?: boolean
    onMenuClose: () => void
}

const UserViewsMenu: FC<UserViewsMenuProps> = ({
    userViews,
    selectedId,
    onMenuClose,
    ...props
}) => {
    return (
        <Menu
            {...props}
            keepMounted
            onClose={onMenuClose}
        >
            {userViews.map(navItem => {
                if ('url' in navItem) {
                    return (
                        <MenuItem
                            key={navItem.name}
                            component='a'
                            href={navItem.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={onMenuClose}
                        >
                            <ListItemIcon>
                                <Icon>{navItem.icon || 'link'}</Icon>
                            </ListItemIcon>
                            <ListItemText>
                                {navItem.name}
                            </ListItemText>
                        </MenuItem>
                    );
                }

                return (
                    <MenuItem
                        key={navItem.Id}
                        component={Link}
                        to={appRouter.getRouteUrl(navItem, { context: navItem.CollectionType }).substring(1)}
                        onClick={onMenuClose}
                        selected={navItem.Id === selectedId}
                    >
                        <ListItemIcon>
                            <LibraryIcon item={navItem} />
                        </ListItemIcon>
                        <ListItemText>
                            {navItem.Name}
                        </ListItemText>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

export default UserViewsMenu;
