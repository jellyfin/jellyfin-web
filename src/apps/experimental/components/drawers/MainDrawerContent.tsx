import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { SystemInfo } from '@jellyfin/sdk/lib/generated-client/models/system-info';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import Dashboard from '@mui/icons-material/Dashboard';
import Edit from '@mui/icons-material/Edit';
import Favorite from '@mui/icons-material/Favorite';
import Home from '@mui/icons-material/Home';
import Link from '@mui/icons-material/Link';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useApi } from 'hooks/useApi';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'scripts/globalize';
import { appRouter } from 'components/router/appRouter';

import ListItemLink from './ListItemLink';
import LibraryIcon from '../LibraryIcon';

const MainDrawerContent = () => {
    const { api, user } = useApi();
    const location = useLocation();
    const [ systemInfo, setSystemInfo ] = useState<SystemInfo>();
    const [ userViews, setUserViews ] = useState<BaseItemDto[]>([]);
    const webConfig = useWebConfig();

    const isHomeSelected = location.pathname === '/home.html' && (!location.search || location.search === '?tab=0');

    useEffect(() => {
        if (api && user?.Id) {
            getUserViewsApi(api)
                .getUserViews({ userId: user.Id })
                .then(({ data }) => {
                    setUserViews(data.Items || []);
                })
                .catch(err => {
                    console.warn('[MainDrawer] failed to fetch user views', err);
                    setUserViews([]);
                });

            getSystemApi(api)
                .getSystemInfo()
                .then(({ data }) => {
                    setSystemInfo(data);
                })
                .catch(err => {
                    console.warn('[MainDrawer] failed to fetch system info', err);
                });
        } else {
            setUserViews([]);
        }
    }, [ api, user?.Id ]);

    return (
        <>
            {/* MAIN LINKS */}
            <List>
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
                                        {/* TODO: Support custom icons */}
                                        <Link />
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
                            <ListItemLink to='/dashboard.html'>
                                <ListItemIcon>
                                    <Dashboard />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('TabDashboard')} />
                            </ListItemLink>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemLink to='/edititemmetadata.html'>
                                <ListItemIcon>
                                    <Edit />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('MetadataManager')} />
                            </ListItemLink>
                        </ListItem>
                    </List>
                </>
            )}

            {/* FOOTER */}
            <Divider style={{ marginTop: 'auto' }} />
            <List>
                <ListItem>
                    <ListItemText
                        primary={systemInfo?.ServerName ? systemInfo.ServerName : 'Jellyfin'}
                        secondary={systemInfo?.Version ? `v${systemInfo.Version}` : ''}
                    />
                </ListItem>
            </List>
        </>
    );
};

export default MainDrawerContent;
