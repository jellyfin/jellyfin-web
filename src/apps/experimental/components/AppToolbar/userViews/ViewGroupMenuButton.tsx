import IconButton from '@mui/material/IconButton/IconButton';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import React, { useCallback, useState, type FC } from 'react';
import { Link } from 'react-router-dom';

import globalize from 'lib/globalize';
import { appRouter } from 'components/router/appRouter';

import type { ViewGroup } from './types';
import { getGroupLabel } from './utils';

const getId = ({ type }: ViewGroup) => `view-group-menu-${type}`;

interface ViewGroupMenuProps extends MenuProps {
    onMenuClose: () => void,
    viewGroup: ViewGroup
}

const ViewGroupMenu: FC<ViewGroupMenuProps> = ({
    anchorEl,
    open,
    onMenuClose,
    viewGroup
}) => {
    return (
        <Menu
            anchorEl={anchorEl}
            id={getId(viewGroup)}
            keepMounted
            open={open}
            onClose={onMenuClose}
        >
            {viewGroup.views.map(view => (
                <MenuItem
                    key={view.Id}
                    component={Link}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                    onClick={onMenuClose}
                >
                    <ListItemText>
                        {view.Name}
                    </ListItemText>
                </MenuItem>
            ))}
        </Menu>
    );
};

const ViewGroupMenuButton = ({
    viewGroup
}: {
    viewGroup: ViewGroup
}) => {
    const [ mainMenuAnchorEl, setMainMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isMainMenuOpen = Boolean(mainMenuAnchorEl);

    const onMainButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setMainMenuAnchorEl(event.currentTarget);
    }, [ setMainMenuAnchorEl ]);

    const onMainMenuClose = useCallback(() => {
        setMainMenuAnchorEl(null);
    }, [ setMainMenuAnchorEl ]);

    return (
        <>
            <Tooltip title={globalize.translate(getGroupLabel(viewGroup.type))}>
                <IconButton
                    size='large'
                    aria-label={globalize.translate(getGroupLabel(viewGroup.type))}
                    aria-controls={getId(viewGroup)}
                    aria-haspopup='true'
                    onClick={onMainButtonClick}
                    color='inherit'
                >
                    {viewGroup.icon}
                </IconButton>
            </Tooltip>

            <ViewGroupMenu
                open={isMainMenuOpen}
                anchorEl={mainMenuAnchorEl}
                onMenuClose={onMainMenuClose}
                viewGroup={viewGroup}
            />
        </>
    );
};

export default ViewGroupMenuButton;
