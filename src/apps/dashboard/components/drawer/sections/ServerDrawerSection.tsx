import {
    ChevronDownIcon,
    ChevronUpIcon,
    ColorWheelIcon,
    DashboardIcon,
    GearIcon,
    PersonIcon,
    PlayIcon,
    PlusIcon
} from '@radix-ui/react-icons';
import { useLocation } from '@tanstack/react-router';
import React, { type MouseEvent, useCallback, useState } from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';
import { vars } from 'styles/tokens.css.ts';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemContent,
    ListItemDecorator,
    ListSubheader
} from 'ui-primitives';

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

function ServerDrawerSection(): React.ReactElement {
    const location = useLocation();

    const [isLibrarySectionOpen, setIsLibrarySectionOpen] = useState(
        LIBRARY_PATHS.includes(location.pathname)
    );
    const [isPlaybackSectionOpen, setIsPlaybackSectionOpen] = useState(
        PLAYBACK_PATHS.includes(location.pathname)
    );

    const onLibrarySectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsLibrarySectionOpen((isOpen) => !isOpen);
    }, []);

    const onPlaybackSectionClick = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaybackSectionOpen((isOpen) => !isOpen);
    }, []);

    return (
        <List
            size='sm'
            style={{ '--list-item-radius': '8px', '--list-gap': '4px', '--list-padding': '8px' }}
        >
            <ListSubheader sticky>{globalize.translate('TabServer')}</ListSubheader>

            <ListItem>
                <ListItemLink to='/dashboard'>
                    <ListItemDecorator>
                        <DashboardIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('TabDashboard')}</ListItemContent>
                </ListItemLink>
            </ListItem>

            <ListItem>
                <ListItemLink to='/dashboard/settings'>
                    <ListItemDecorator>
                        <GearIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('General')}</ListItemContent>
                </ListItemLink>
            </ListItem>

            <ListItem>
                <ListItemLink to='/dashboard/branding'>
                    <ListItemDecorator>
                        <ColorWheelIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderBranding')}</ListItemContent>
                </ListItemLink>
            </ListItem>

            <ListItem>
                <ListItemLink to='/dashboard/users'>
                    <ListItemDecorator>
                        <PersonIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderUsers')}</ListItemContent>
                </ListItemLink>
            </ListItem>

            <ListItem nested>
                <ListItemButton onClick={onLibrarySectionClick}>
                    <ListItemDecorator>
                        <PlusIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('HeaderLibraries')}</ListItemContent>
                    {isLibrarySectionOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </ListItemButton>
                {isLibrarySectionOpen && (
                    <List style={{ '--list-gap': '0px' }}>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/libraries'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('HeaderLibraries')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/libraries/display'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>{globalize.translate('Display')}</ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/libraries/metadata'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('LabelMetadata')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/libraries/nfo'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('TabNfoSettings')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                    </List>
                )}
            </ListItem>

            <ListItem nested>
                <ListItemButton onClick={onPlaybackSectionClick}>
                    <ListItemDecorator>
                        <PlayIcon />
                    </ListItemDecorator>
                    <ListItemContent>{globalize.translate('TitlePlayback')}</ListItemContent>
                    {isPlaybackSectionOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </ListItemButton>
                {isPlaybackSectionOpen && (
                    <List style={{ '--list-gap': '0px' }}>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/playback/transcoding'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('Transcoding')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/playback/resume'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('ButtonResume')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/playback/streaming'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('TabStreaming')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                        <ListItem>
                            <ListItemLink
                                to='/dashboard/playback/trickplay'
                                style={{ paddingLeft: vars.spacing['6'] }}
                            >
                                <ListItemContent>
                                    {globalize.translate('Trickplay')}
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                    </List>
                )}
            </ListItem>
        </List>
    );
}

export default ServerDrawerSection;
