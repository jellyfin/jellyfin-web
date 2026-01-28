import React, { useCallback, type FC, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { useUserViews } from '../../hooks/useUserViews';
import { List, ListItem, Text, Box, Flex, ListItemButton } from 'ui-primitives';
import { useUiStore } from '../../store/uiStore';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import Dashboard from '../../utils/dashboard';
import UserAvatar from '../UserAvatar';
import { vars } from '../../styles/tokens.css';
import globalize from '../../lib/globalize';
import { useVirtualizer } from '@tanstack/react-virtual';

// Helper to get icon for collection type
const getLibraryIcon = (type?: string) => {
    switch (type) {
        case 'movies': return 'movie';
        case 'tvshows': return 'tv';
        case 'music': return 'music_note';
        case 'livetv': return 'live_tv';
        case 'boxsets': return 'collections';
        case 'playlists': return 'queue_music';
        case 'folders': return 'folder';
        default: return 'folder';
    }
};

export const Sidebar: FC = () => {
    const { user } = useApi();
    const { t } = useTranslation();
    const { data: views } = useUserViews(user?.Id);
    const toggleDrawer = useUiStore((state) => state.toggleDrawer);
    const parentRef = useRef<HTMLDivElement>(null);

    const handleLogout = useCallback(() => {
        Dashboard.logout();
        toggleDrawer(false);
    }, [toggleDrawer]);

    const handleNavigation = useCallback(() => {
        toggleDrawer(false);
    }, [toggleDrawer]);

    const libraryItems = views?.Items || [];
    
    const rowVirtualizer = useVirtualizer({
        count: libraryItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 48, // Height of ListItemButton
        overscan: 5,
    });

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sidebar Header */}
            <Box style={{ padding: '1.5rem', borderBottom: `1px solid ${vars.colors.divider}` }}>
                <Flex style={{ alignItems: 'center', gap: '1rem' }}>
                    <UserAvatar user={user} style={{ width: 40, height: 40 }} />
                    <Box style={{ overflow: 'hidden' }}>
                        <Text weight="bold" noWrap>{user?.Name}</Text>
                        <Text size="xs" color="secondary" noWrap>{globalize.translate('LabelOnline')}</Text>
                    </Box>
                </Flex>
            </Box>

            <Box 
                ref={parentRef}
                style={{ flexGrow: 1, overflowY: 'auto', padding: '0.5rem 0' }}
            >
                <List>
                    <ListItem>
                        <Link
                            to="/home"
                            onClick={handleNavigation}
                            style={{ textDecoration: 'none', width: '100%' }}
                            activeProps={{ style: { color: vars.colors.primary, textDecoration: 'none', width: '100%' } }}
                        >
                            <ListItemButton>
                                <span className="material-icons" style={{ marginRight: '1rem' }}>home</span>
                                <Text color="inherit">{t('Home')}</Text>
                            </ListItemButton>
                        </Link>
                    </ListItem>

                    {/* Libraries Section */}
                    {libraryItems.length > 0 && (
                        <>
                            <Box style={{ padding: '1rem 1.5rem 0.5rem', textTransform: 'uppercase', opacity: 0.5 }}>
                                <Text size="xs" weight="bold">{globalize.translate('HeaderMedia')}</Text>
                            </Box>
                            
                            <Box
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const view = libraryItems[virtualRow.index];
                                    return (
                                        <Box
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <ListItem>
                                                <Link
                                                    to="/list"
                                                    search={{ parentId: view.Id } as any}
                                                    onClick={handleNavigation}
                                                    style={{ textDecoration: 'none', width: '100%' }}
                                                    activeProps={{ style: { color: vars.colors.primary, textDecoration: 'none', width: '100%' } }}
                                                >
                                                    <ListItemButton>
                                                        <span className="material-icons" style={{ marginRight: '1rem' }}>
                                                            {getLibraryIcon(view.CollectionType)}
                                                        </span>
                                                        <Text color="inherit" noWrap>{view.Name}</Text>
                                                    </ListItemButton>
                                                </Link>
                                            </ListItem>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    )}

                    {/* Admin Section */}
                    {user?.Policy?.IsAdministrator && (
                        <>
                            <Box style={{ padding: '1rem 1.5rem 0.5rem', textTransform: 'uppercase', opacity: 0.5 }}>
                                <Text size="xs" weight="bold">{globalize.translate('HeaderAdmin')}</Text>
                            </Box>
                            <ListItem>
                                <Link
                                    to={"/dashboard" as any}
                                    onClick={handleNavigation}
                                    style={{ textDecoration: 'none', width: '100%' }}
                                    activeProps={{ style: { color: vars.colors.primary, textDecoration: 'none', width: '100%' } }}
                                >
                                    <ListItemButton>
                                        <span className="material-icons" style={{ marginRight: '1rem' }}>dashboard</span>
                                        <Text color="inherit">{globalize.translate('TabDashboard')}</Text>
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                            <ListItem>
                                <Link
                                    to={"/metadata" as any}
                                    onClick={handleNavigation}
                                    style={{ textDecoration: 'none', width: '100%' }}
                                    activeProps={{ style: { color: vars.colors.primary, textDecoration: 'none', width: '100%' } }}
                                >
                                    <ListItemButton>
                                        <span className="material-icons" style={{ marginRight: '1rem' }}>mode_edit</span>
                                        <Text color="inherit">{globalize.translate('MetadataManager')}</Text>
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                        </>
                    )}
                </List>
            </Box>

            {/* Bottom Section */}
            <Box style={{ padding: '0.5rem 0', borderTop: `1px solid ${vars.colors.divider}` }}>
                <List>
                    <ListItem>
                        <Link
                            to="/mypreferencesmenu"
                            onClick={handleNavigation}
                            style={{ textDecoration: 'none', width: '100%' }}
                            activeProps={{ style: { color: vars.colors.primary, textDecoration: 'none', width: '100%' } }}
                        >
                            <ListItemButton>
                                <span className="material-icons" style={{ marginRight: '1rem' }}>settings</span>
                                <Text color="inherit">{t('Settings')}</Text>
                            </ListItemButton>
                        </Link>
                    </ListItem>

                    <ListItem>
                        <ListItemButton onClick={handleLogout}>
                            <span className="material-icons" style={{ marginRight: '1rem' }}>exit_to_app</span>
                            <Text>{t('SignOut')}</Text>
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );
};