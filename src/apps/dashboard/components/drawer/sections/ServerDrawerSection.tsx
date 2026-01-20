import Dashboard from '@mui/icons-material/Dashboard';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import LibraryAdd from '@mui/icons-material/LibraryAdd';
import Palette from '@mui/icons-material/Palette';
import People from '@mui/icons-material/People';
import PlayCircle from '@mui/icons-material/PlayCircle';
import Settings from '@mui/icons-material/Settings';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import ListSubheader from '@mui/joy/ListSubheader';
import React, { type MouseEvent, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

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

    const [ isLibrarySectionOpen, setIsLibrarySectionOpen ] = useState(LIBRARY_PATHS.includes(location.pathname));
    const [ isPlaybackSectionOpen, setIsPlaybackSectionOpen ] = useState(PLAYBACK_PATHS.includes(location.pathname));

    const onLibrarySectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLibrarySectionOpen(isOpen => !isOpen);
    }, []);

    const onPlaybackSectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaybackSectionOpen(isOpen => !isOpen);
    }, []);

    return (
        <List
            size="sm"
            sx={{ '--ListItem-radius': '8px', '--List-gap': '4px', '--List-padding': '8px' }}
        >
            <ListSubheader sticky>
                {globalize.translate('TabServer')}
            </ListSubheader>
            
            <ListItem>
                <ListItemLink to='/dashboard'>
                    <ListItemDecorator>
                        <Dashboard />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('TabDashboard')}</ListItemContent>
                </ListItemLink>
            </ListItem>
            
            <ListItem>
                <ListItemLink to='/dashboard/settings'>
                    <ListItemDecorator>
                        <Settings />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('General')}</ListItemContent>
                </ListItemLink>
            </ListItem>
            
            <ListItem>
                <ListItemLink to='/dashboard/branding'>
                    <ListItemDecorator>
                        <Palette />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderBranding')}</ListItemContent>
                </ListItemLink>
            </ListItem>
            
            <ListItem>
                <ListItemLink to='/dashboard/users'>
                    <ListItemDecorator>
                        <People />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderUsers')}</ListItemContent>
                </ListItemLink>
            </ListItem>
            
            <ListItem nested>
                <ListItemButton onClick={onLibrarySectionClick}>
                    <ListItemDecorator>
                        <LibraryAdd />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderLibraries')}</ListItemContent>
                    {isLibrarySectionOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </ListItemButton>
                {isLibrarySectionOpen && (
                    <List sx={{ '--List-gap': '0px' }}>
                        <ListItem>
                            <ListItemLink to='/dashboard/libraries' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('HeaderLibraries')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/libraries/display' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('Display')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/libraries/metadata' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('LabelMetadata')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/libraries/nfo' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('TabNfoSettings')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                    </List>
                )}
            </ListItem>
            
            <ListItem nested>
                <ListItemButton onClick={onPlaybackSectionClick}>
                    <ListItemDecorator>
                        <PlayCircle />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('TitlePlayback')}</ListItemContent>
                    {isPlaybackSectionOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </ListItemButton>
                {isPlaybackSectionOpen && (
                    <List sx={{ '--List-gap': '0px' }}>
                        <ListItem>
                            <ListItemLink to='/dashboard/playback/transcoding' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('Transcoding')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/playback/resume' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('ButtonResume')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/playback/streaming' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('TabStreaming')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink to='/dashboard/playback/trickplay' sx={{ pl: 4 }}>
                                <ListItemContent>{globalize.translate('Trickplay')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                    </List>
                )}
            </ListItem>
        </List>
    );
};

export default ServerDrawerSection;