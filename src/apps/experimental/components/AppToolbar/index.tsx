import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import appIcon from 'assets/img/icon-transparent.png';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';

import AppTabs from '../tabs/AppTabs';
import { isDrawerPath } from '../drawers/AppDrawer';
import UserMenuButton from './UserMenuButton';

interface AppToolbarProps {
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const AppToolbar: FC<AppToolbarProps> = ({
    isDrawerOpen,
    onDrawerButtonClick
}) => {
    const { user } = useApi();
    const isUserLoggedIn = Boolean(user);
    const location = useLocation();

    const isDrawerAvailable = isDrawerPath(location.pathname);

    return (
        <Toolbar
            variant='dense'
            sx={{
                flexWrap: {
                    xs: 'wrap',
                    lg: 'nowrap'
                }
            }}
        >
            {isUserLoggedIn && isDrawerAvailable && (
                <Tooltip title={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}>
                    <IconButton
                        size='large'
                        edge='start'
                        color='inherit'
                        aria-label={globalize.translate(isDrawerOpen ? 'MenuClose' : 'MenuOpen')}
                        sx={{ mr: 2 }}
                        onClick={onDrawerButtonClick}
                    >
                        <MenuIcon />
                    </IconButton>
                </Tooltip>
            )}

            <Box
                component={Link}
                to='/'
                color='inherit'
                aria-label={globalize.translate('Home')}
                sx={{
                    display: 'inline-flex',
                    textDecoration: 'none'
                }}
            >
                <Box
                    component='img'
                    src={appIcon}
                    sx={{
                        height: '2rem',
                        marginInlineEnd: 1
                    }}
                />
                <Typography
                    variant='h6'
                    noWrap
                    component='div'
                    sx={{ display: { xs: 'none', sm: 'inline-block' } }}
                >
                    Jellyfin
                </Typography>
            </Box>

            <AppTabs isDrawerOpen={isDrawerOpen} />

            {isUserLoggedIn && (
                <>
                    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title={globalize.translate('Search')}>
                            <IconButton
                                size='large'
                                aria-label={globalize.translate('Search')}
                                color='inherit'
                                component={Link}
                                to='/search.html'
                            >
                                <SearchIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={{ flexGrow: 0 }}>
                        <UserMenuButton />
                    </Box>
                </>
            )}
        </Toolbar>
    );
};

export default AppToolbar;
