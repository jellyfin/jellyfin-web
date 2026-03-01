import Article from '@mui/icons-material/Article';
import Backup from '@mui/icons-material/Backup';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import Lan from '@mui/icons-material/Lan';
import Schedule from '@mui/icons-material/Schedule';
import VpnKey from '@mui/icons-material/VpnKey';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React, { type MouseEvent, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

const LOG_PATHS = [
    '/dashboard/logs/settings',
    '/dashboard/logs/files'
];

const AdvancedDrawerSection = () => {
    const location = useLocation();

    const [ isLogSectionOpen, setIsLogSectionOpen ] = useState(LOG_PATHS.includes(location.pathname));

    const onLogSectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLogSectionOpen(isOpen => !isOpen);
    }, []);

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
                    <ListItemText primary={globalize.translate('HeaderBackups')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={onLogSectionClick}>
                    <ListItemIcon>
                        <Article />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabLogs')} />
                    {isLogSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
            </ListItem>
            <Collapse in={isLogSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/dashboard/logs/settings' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabLogSettings')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/logs/files' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabLogFiles')} />
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
