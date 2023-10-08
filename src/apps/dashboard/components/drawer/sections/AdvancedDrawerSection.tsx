import Article from '@mui/icons-material/Article';
import EditNotifications from '@mui/icons-material/EditNotifications';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Extension from '@mui/icons-material/Extension';
import Lan from '@mui/icons-material/Lan';
import Schedule from '@mui/icons-material/Schedule';
import VpnKey from '@mui/icons-material/VpnKey';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';
import { useLocation } from 'react-router-dom';

import ListItemLink from 'components/ListItemLink';
import globalize from 'scripts/globalize';

const PLUGIN_PATHS = [
    '/dashboard/plugins',
    '/dashboard/plugins/catalog',
    '/dashboard/plugins/repositories',
    '/dashboard/plugins/add',
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
                <ListItemLink to='/dashboard/networking'>
                    <ListItemIcon>
                        <Lan />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabNetworking')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/keys'>
                    <ListItemIcon>
                        <VpnKey />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderApiKeys')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/logs'>
                    <ListItemIcon>
                        <Article />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabLogs')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/notifications'>
                    <ListItemIcon>
                        <EditNotifications />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('Notifications')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/plugins' selected={false}>
                    <ListItemIcon>
                        <Extension />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabPlugins')} />
                    {isPluginSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isPluginSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/dashboard/plugins' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabMyPlugins')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/plugins/catalog' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabCatalog')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/plugins/repositories' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabRepositories')} />
                    </ListItemLink>
                </List>
            </Collapse>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/tasks'>
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
