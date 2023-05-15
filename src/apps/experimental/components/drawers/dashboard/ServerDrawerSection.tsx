import { Dashboard, ExpandLess, ExpandMore, LibraryAdd, People, PlayCircle, Settings } from '@mui/icons-material';
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

const LIBRARY_PATHS = [
    '/library.html',
    '/librarydisplay.html',
    '/metadataimages.html',
    '/metadatanfo.html'
];

const PLAYBACK_PATHS = [
    '/encodingsettings.html',
    '/playbackconfiguration.html',
    '/streamingsettings.html'
];

const ServerDrawerSection = () => {
    const location = useLocation();

    const isLibrarySectionOpen = LIBRARY_PATHS.includes(location.pathname);
    const isPlaybackSectionOpen = PLAYBACK_PATHS.includes(location.pathname);

    return (
        <List
            aria-labelledby='server-subheader'
            subheader={
                <ListSubheader component='div' id='server-subheader'>
                    {globalize.translate('TabServer')}
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
                <ListItemLink to='/dashboardgeneral.html'>
                    <ListItemIcon>
                        <Settings />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('General')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/userprofiles.html'>
                    <ListItemIcon>
                        <People />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderUsers')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/library.html' selected={false}>
                    <ListItemIcon>
                        <LibraryAdd />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderLibraries')} />
                    {isLibrarySectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isLibrarySectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/library.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('HeaderLibraries')} />
                    </ListItemLink>
                    <ListItemLink to='/librarydisplay.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Display')} />
                    </ListItemLink>
                    <ListItemLink to='/metadataimages.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Metadata')} />
                    </ListItemLink>
                    <ListItemLink to='/metadatanfo.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabNfoSettings')} />
                    </ListItemLink>
                </List>
            </Collapse>
            <ListItem disablePadding>
                <ListItemLink to='/encodingsettings.html' selected={false}>
                    <ListItemIcon>
                        <PlayCircle />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TitlePlayback')} />
                    {isPlaybackSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isPlaybackSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/encodingsettings.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Transcoding')} />
                    </ListItemLink>
                    <ListItemLink to='/playbackconfiguration.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('ButtonResume')} />
                    </ListItemLink>
                    <ListItemLink to='/streamingsettings.html' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabStreaming')} />
                    </ListItemLink>
                </List>
            </Collapse>
        </List>
    );
};

export default ServerDrawerSection;
