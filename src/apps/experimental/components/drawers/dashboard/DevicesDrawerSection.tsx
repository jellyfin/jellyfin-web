import { Devices, Analytics, Input, ExpandLess, ExpandMore } from '@mui/icons-material';
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

const DLNA_PATHS = [
    '/dlnasettings.html',
    '/dlnaprofiles.html'
];

const DevicesDrawerSection = () => {
    const location = useLocation();

    const isDlnaSectionOpen = DLNA_PATHS.includes(location.pathname);

    return (
        <List
            aria-labelledby='devices-subheader'
            subheader={
                <ListSubheader component='div' id='devices-subheader'>
                    {globalize.translate('HeaderDevices')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/devices.html'>
                    <ListItemIcon>
                        <Devices />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderDevices')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/serveractivity.html'>
                    <ListItemIcon>
                        <Analytics />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderActivity')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dlnasettings.html' selected={false}>
                    <ListItemIcon>
                        <Input />
                    </ListItemIcon>
                    <ListItemText primary={'DLNA'} />
                    {isDlnaSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isDlnaSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/dlnasettings.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Settings')} />
                    </ListItemLink>
                    <ListItemLink to='/dlnaprofiles.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabProfiles')} />
                    </ListItemLink>
                </List>
            </Collapse>
        </List>
    );
};

export default DevicesDrawerSection;
