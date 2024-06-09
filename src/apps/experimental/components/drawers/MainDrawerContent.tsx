import Dashboard from '@mui/icons-material/Dashboard';
import Edit from '@mui/icons-material/Edit';
import Favorite from '@mui/icons-material/Favorite';
import Home from '@mui/icons-material/Home';
import Divider from '@mui/material/Divider';
import Icon from '@mui/material/Icon';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';
import { useLocation } from 'react-router-dom';

import ListItemLink from 'components/ListItemLink';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'scripts/globalize';

import LibraryIcon from '../LibraryIcon';
import DrawerHeaderLink from './DrawerHeaderLink';

const MainDrawerContent = () => {
    const { user } = useApi();
    const location = useLocation();
    const { data: userViewsData } = useUserViews(user?.Id);
    const userViews = userViewsData?.Items || [];
    const webConfig = useWebConfig();

    const isHomeSelected = location.pathname === '/home.html' && (!location.search || location.search === '?tab=0');

    return (
        <>
            {/* MAIN LINKS */}
            <List sx={{ paddingTop: 0 }}>
                <ListItem disablePadding>
                    <DrawerHeaderLink />
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to='/home.html' selected={isHomeSelected}>
                        <ListItemIcon>
                            <Home />
                        </ListItemIcon>
                        <ListItemText primary={globalize.translate('Home')} />
                    </ListItemLink>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to='/home.html?tab=1'>
                        <ListItemIcon>
                            <Favorite />
                        </ListItemIcon>
                        <ListItemText primary={globalize.translate('Favorites')} />
                    </ListItemLink>
                </ListItem>
            </List>

            {/* CUSTOM LINKS */}
            {(!!webConfig.menuLinks && webConfig.menuLinks.length > 0) && (
                <>
                    <Divider />
                    <List>
                        {webConfig.menuLinks.map(menuLink => (
                            <ListItem
                                key={`${menuLink.name}_${menuLink.url}`}
                                disablePadding
                            >
                                <ListItemButton
                                    component='a'
                                    href={menuLink.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    <ListItemIcon>
                                        <Icon>{menuLink.icon ?? 'link'}</Icon>
                                    </ListItemIcon>
                                    <ListItemText primary={menuLink.name} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            {/* LIBRARY LINKS */}
            {userViews.length > 0 && (
                <>
                    <Divider />
                    <List
                        aria-labelledby='libraries-subheader'
                        subheader={
                            <ListSubheader component='div' id='libraries-subheader'>
                                {globalize.translate('HeaderLibraries')}
                            </ListSubheader>
                        }
                    >
                        {userViews.map(view => (
                            <ListItem key={view.Id} disablePadding>
                                <ListItemLink
                                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                                >
                                    <ListItemIcon>
                                        <LibraryIcon item={view} />
                                    </ListItemIcon>
                                    <ListItemText primary={view.Name} />
                                </ListItemLink>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            {/* ADMIN LINKS */}
            {user?.Policy?.IsAdministrator && (
                <>
                    <Divider />
                    <List
                        aria-labelledby='admin-subheader'
                        subheader={
                            <ListSubheader component='div' id='admin-subheader'>
                                {globalize.translate('HeaderAdmin')}
                            </ListSubheader>
                        }
                    >
                        <ListItem disablePadding>
                            <ListItemLink to='/dashboard'>
                                <ListItemIcon>
                                    <Dashboard />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('TabDashboard')} />
                            </ListItemLink>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemLink to='/metadata'>
                                <ListItemIcon>
                                    <Edit />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('MetadataManager')} />
                            </ListItemLink>
                        </ListItem>
                    </List>
                </>
            )}
        </>
    );
};

export default MainDrawerContent;
