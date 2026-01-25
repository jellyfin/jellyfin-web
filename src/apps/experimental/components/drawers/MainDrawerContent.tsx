import { HeartFilledIcon, HomeIcon, ListBulletIcon, PlayIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import React from 'react';
import { useLocation } from '@tanstack/react-router';
import { Divider } from 'ui-primitives/Divider';
import { Box, Flex } from 'ui-primitives/Box';
import { List, ListItem, ListItemContent, ListItemDecorator, ListSubheader } from 'ui-primitives/List';
import { ListItemButton } from 'ui-primitives/ListItemButton';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

import ListItemLink from 'components/ListItemLink';
import { appRouter } from 'components/router/appRouter';
import RemotePlayButton from '../AppToolbar/RemotePlayButton';
import SyncPlayButton from '../AppToolbar/SyncPlayButton';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';
import { selectCurrentPlayer, selectCurrentQueueItem, usePlayerStore, useQueueStore } from 'store';

import LibraryIcon from '../LibraryIcon';
import DrawerHeaderLink from './DrawerHeaderLink';

interface MainDrawerContentProps {
    isOpen?: boolean;
}

const MainDrawerContent = ({ isOpen }: MainDrawerContentProps) => {
    const { user } = useApi();
    const location = useLocation();
    const { data: userViewsData } = useUserViews(user?.Id);
    const userViews = userViewsData?.Items || [];
    const webConfig = useWebConfig();
    const currentPlayer = usePlayerStore(selectCurrentPlayer);
    const currentQueueItem = useQueueStore(selectCurrentQueueItem);

    const audioLinks = [
        {
            path: '/nowplaying',
            icon: PlayIcon,
            label: globalize.translate('NowPlaying')
        },
        {
            path: '/queue',
            icon: ListBulletIcon,
            label: globalize.translate('Queue')
        }
    ];

    const isDrawerVisible = isOpen ?? true;
    const getRowStyle = (index: number) => ({
        opacity: isDrawerVisible ? 1 : 0,
        transform: isDrawerVisible ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 220ms ease, transform 260ms ease',
        transitionDelay: `${index * 40}ms`
    });

    const isHomeSelected = location.pathname === '/home' && (!location.search || location.search === '?tab=0');

    return (
        <>
            {/* MAIN LINKS */}
            <List style={{ paddingTop: 0 }}>
                <ListItem disablePadding>
                    <DrawerHeaderLink />
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to="/home" selected={isHomeSelected}>
                        <ListItemDecorator>
                            <HomeIcon />
                        </ListItemDecorator>
                        <ListItemContent>
                            <Text>{globalize.translate('Home')}</Text>
                        </ListItemContent>
                    </ListItemLink>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to="/home?tab=1">
                        <ListItemDecorator>
                            <HeartFilledIcon />
                        </ListItemDecorator>
                        <ListItemContent>
                            <Text>{globalize.translate('Favorites')}</Text>
                        </ListItemContent>
                    </ListItemLink>
                </ListItem>
            </List>

            {/* CUSTOM LINKS */}
            {!!webConfig.menuLinks && webConfig.menuLinks.length > 0 && (
                <>
                    <Divider />
                    <List>
                        {webConfig.menuLinks.map(menuLink => (
                            <ListItem key={`${menuLink.name}_${menuLink.url}`} disablePadding>
                                <ListItemButton
                                    component="a"
                                    href={menuLink.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ListItemDecorator>
                                        <span className="material-icons">{menuLink.icon ?? 'link'}</span>
                                    </ListItemDecorator>
                                    <ListItemContent>
                                        <Text>{menuLink.name}</Text>
                                    </ListItemContent>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            {/* AUDIO QUICK ACTIONS */}
            <Divider />
            <List aria-labelledby="audio-subheader">
                <ListSubheader id="audio-subheader">Audio</ListSubheader>
                {audioLinks.map((link, index) => {
                    const Icon = link.icon;

                    return (
                        <ListItem key={link.path} disablePadding style={getRowStyle(index)}>
                            <ListItemLink to={link.path.substring(1)} selected={location.pathname === link.path}>
                                <ListItemDecorator>
                                    <Icon />
                                </ListItemDecorator>
                                <ListItemContent>
                                    <Text>{link.label}</Text>
                                </ListItemContent>
                            </ListItemLink>
                        </ListItem>
                    );
                })}
                <ListItem disablePadding style={getRowStyle(audioLinks.length)}>
                    <Box
                        style={{
                            width: '100%',
                            padding: vars.spacing.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: vars.spacing.sm
                        }}
                    >
                        <ListItemDecorator>
                            <SpeakerLoudIcon />
                        </ListItemDecorator>
                        <ListItemContent>
                            <Text weight="medium">{currentPlayer?.name || 'Local player'}</Text>
                            <Text size="sm" color="muted">
                                {currentQueueItem?.item.artist || currentQueueItem?.item.name || 'Idle'}
                            </Text>
                        </ListItemContent>
                    </Box>
                </ListItem>
                <ListItem disablePadding style={getRowStyle(audioLinks.length + 1)}>
                    <Box
                        style={{
                            width: '100%',
                            padding: vars.spacing.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: vars.spacing.sm,
                            flexWrap: 'wrap'
                        }}
                    >
                        <Flex align="center" gap={vars.spacing.sm}>
                            <SyncPlayButton />
                            <RemotePlayButton />
                        </Flex>
                    </Box>
                </ListItem>
            </List>

            {/* LIBRARY LINKS */}
            {userViews.length > 0 && (
                <>
                    <Divider />
                    <List
                        aria-labelledby="libraries-subheader"
                        subheader={
                            <ListSubheader id="libraries-subheader">
                                {globalize.translate('HeaderLibraries')}
                            </ListSubheader>
                        }
                    >
                        {userViews.map(view => (
                            <ListItem key={view.Id} disablePadding>
                                <ListItemLink
                                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                                >
                                    <ListItemDecorator>
                                        <LibraryIcon item={view} />
                                    </ListItemDecorator>
                                    <ListItemContent>
                                        <Text>{view.Name}</Text>
                                    </ListItemContent>
                                </ListItemLink>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
        </>
    );
};

export default MainDrawerContent;
