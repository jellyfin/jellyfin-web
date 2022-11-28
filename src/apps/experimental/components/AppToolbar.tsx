import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';

import { ID as UserMenuId } from './AppUserMenu';
import AppTabs from './tabs/AppTabs';
import { isDrawerPath } from './drawers/AppDrawer';

interface AppToolbarProps {
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
    onUserButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const AppToolbar: FC<AppToolbarProps> = ({
    isDrawerOpen,
    onDrawerButtonClick,
    onUserButtonClick
}) => {
    const theme = useTheme();
    const { api, user } = useApi();
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
                    src='/assets/img/icon-transparent.png'
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
                        <Tooltip title={globalize.translate('UserMenu')}>
                            <IconButton
                                size='large'
                                edge='end'
                                aria-label={globalize.translate('UserMenu')}
                                aria-controls={UserMenuId}
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
                    </Box>
                </>
            )}
        </Toolbar>
    );
};

export default AppToolbar;
