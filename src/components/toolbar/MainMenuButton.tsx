import Favorite from '@mui/icons-material/Favorite';
import Home from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import React, { useCallback, useState, type FC } from 'react';
import { Link } from 'react-router-dom';

import globalize from 'lib/globalize';
import { appRouter } from 'components/router/appRouter';

export const ID = 'app-main-menu';

interface AppMainMenuProps extends MenuProps {
    onMenuClose: () => void
}

const AppMainMenu: FC<AppMainMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    return (
        <Menu
            anchorEl={anchorEl}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
        >
            <MenuItem
                component={Link}
                to='/home.html'
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <Home />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Home')}
                </ListItemText>
            </MenuItem>
            <MenuItem
                component={Link}
                to='/home.html?tab=1'
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <Favorite />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Favorites')}
                </ListItemText>
            </MenuItem>
        </Menu>
    );
};

const MainMenuButton = ({
    disabled
}: {
    disabled?: boolean
}) => {
    const isBackButtonAvailable = appRouter.canGoBack();

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
            <Tooltip title={globalize.translate('MainMenu')}>
                <IconButton
                    size='large'
                    edge={isBackButtonAvailable ? undefined : 'start'}
                    aria-label={globalize.translate('MainMenu')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onMainButtonClick}
                    color='inherit'
                    disabled={disabled}
                >
                    <img
                        src='assets/img/icon-transparent.png'
                        alt=''
                        aria-hidden
                        style={{
                            maxHeight: '1em',
                            maxWidth: '1em'
                        }}
                    />
                </IconButton>
            </Tooltip>

            <AppMainMenu
                open={isMainMenuOpen}
                anchorEl={mainMenuAnchorEl}
                onMenuClose={onMainMenuClose}
            />
        </>
    );
};

export default MainMenuButton;
