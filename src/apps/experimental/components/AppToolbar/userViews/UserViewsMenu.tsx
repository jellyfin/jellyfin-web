import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import { FC } from 'react';
import { Link } from 'react-router-dom';

import LibraryIcon from 'apps/experimental/components/LibraryIcon';
import { appRouter } from 'components/router/appRouter';

interface UserViewsMenuProps extends MenuProps {
    userViews: BaseItemDto[]
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
