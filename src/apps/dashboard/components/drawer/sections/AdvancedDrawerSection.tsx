import Article from '@mui/icons-material/Article';
import Backup from '@mui/icons-material/Backup';
import Lan from '@mui/icons-material/Lan';
import Schedule from '@mui/icons-material/Schedule';
import VpnKey from '@mui/icons-material/VpnKey';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

const AdvancedDrawerSection = () => {
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
                <ListItemLink to='/dashboard/backups'>
                    <ListItemIcon>
                        <Backup />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabBackups')} />
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
