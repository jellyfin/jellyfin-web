import { Dashboard, ExpandLess, ExpandMore, LibraryAdd, People, PlayCircle, Settings } from '@mui/icons-material';
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

const LIBRARY_PATHS = [
    '/dashboard/libraries',
    '/dashboard/libraries/display',
    '/dashboard/libraries/metadata',
    '/dashboard/libraries/nfo'
];

const PLAYBACK_PATHS = [
    '/dashboard/playback/transcoding',
    '/dashboard/playback/resume',
    '/dashboard/playback/streaming',
    '/dashboard/playback/trickplay'
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
                <ListItemLink to='/dashboard'>
                    <ListItemIcon>
                        <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabDashboard')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/settings'>
                    <ListItemIcon>
                        <Settings />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('General')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/users'>
                    <ListItemIcon>
                        <People />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderUsers')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/libraries' selected={false}>
                    <ListItemIcon>
                        <LibraryAdd />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderLibraries')} />
                    {isLibrarySectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isLibrarySectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/dashboard/libraries' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('HeaderLibraries')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/libraries/display' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Display')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/libraries/metadata' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Metadata')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/libraries/nfo' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabNfoSettings')} />
                    </ListItemLink>
                </List>
            </Collapse>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/playback/transcoding' selected={false}>
                    <ListItemIcon>
                        <PlayCircle />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TitlePlayback')} />
                    {isPlaybackSectionOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemLink>
            </ListItem>
            <Collapse in={isPlaybackSectionOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                    <ListItemLink to='/dashboard/playback/transcoding' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Transcoding')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/playback/resume' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('ButtonResume')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/playback/streaming' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('TabStreaming')} />
                    </ListItemLink>
                    <ListItemLink to='/dashboard/playback/trickplay' sx={{ pl: 4 }}>
                        <ListItemText inset primary={globalize.translate('Trickplay')} />
                    </ListItemLink>
                </List>
            </Collapse>
        </List>
    );
};

export default ServerDrawerSection;
