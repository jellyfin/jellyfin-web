import { Lan, VpnKey, Article, EditNotifications, Extension, Schedule, ExpandLess, ExpandMore } from '@mui/icons-material';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';
import { useLocation } from 'react-router-dom';

import globalize from 'scripts/globalize';

import ListItemLink from '../ListItemLink';

const PLUGIN_PATHS = [
    '/installedplugins.html',
    '/availableplugins.html',
    '/repositories.html',
    '/addplugin.html',
    '/configurationpage'
];

const AdvancedDrawerSection = () => {
    const location = useLocation();

    const isPluginSectionOpen = PLUGIN_PATHS.includes(location.pathname);

    return (
        <List
            aria-labelledby='advanced-subheader'
            subheader={
                <ListSubheader component='div' id='advanced-subheader'>
                    {globalize.translate('TabAdvanced')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/networking.html'>
                    <ListItemIcon>
                        <Lan />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabNetworking')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/apikeys.html'>
                    <ListItemIcon>
                        <VpnKey />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderApiKeys')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/log.html'>
                    <ListItemIcon>
                        <Article />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabLogs')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/notificationsettings.html'>
                    <ListItemIcon>
                        <EditNotifications />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabNotifications')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/installedplugins.html' selected={false}>
                    <ListItemIcon>
                        <Extension />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabPlugins')} />
                    {isPluginSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isPluginSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/installedplugins.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabMyPlugins')} />
                    </ListItemLink>
                    <ListItemLink to='/availableplugins.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabCatalog')} />
                    </ListItemLink>
                    <ListItemLink to='/repositories.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabRepositories')} />
                    </ListItemLink>
                </List>
            </Collapse>
            <ListItem disablePadding>
                <ListItemLink to='/scheduledtasks.html'>
                    <ListItemIcon>
                        <Schedule />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabScheduledTasks')} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default AdvancedDrawerSection;
