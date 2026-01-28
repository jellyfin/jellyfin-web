import React, { useEffect, useState, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';

import { useServerStore } from '../store/serverStore';
import { LoadingView } from './feedback';
import { vars } from 'styles/tokens.css.ts';
import { logger } from '../utils/logger';

interface FavoriteItemsProps {
    serverId?: string;
    userId?: string;
}

interface SectionConfig {
    name: string;
    types: string[];
    id: string;
}

const SECTIONS: SectionConfig[] = [
    { name: 'Movies', types: ['Movie'], id: 'favoriteMovies' },
    { name: 'Shows', types: ['Series'], id: 'favoriteShows' },
    { name: 'Episodes', types: ['Episode'], id: 'favoriteEpisodes' },
    { name: 'Artists', types: ['MusicArtist'], id: 'favoriteArtists' },
    { name: 'Albums', types: ['MusicAlbum'], id: 'favoriteAlbums' },
    { name: 'Songs', types: ['Audio'], id: 'favoriteSongs' }
];

function FavoriteSection({ section, serverId, userId }: { section: SectionConfig; serverId: string; userId: string }) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSection = useCallback(async () => {
        if (!serverId || !userId) return;

        setIsLoading(true);
        try {
            const apiClient = (window as any).ApiClient;
            if (apiClient) {
                const client = apiClient.getApiClient(serverId);
                let result;
                if (section.types[0] === 'MusicArtist') {
                    result = await client.getArtists(userId, {
                        Filters: 'IsFavorite',
                        Recursive: true,
                        SortBy: 'SortName',
                        SortOrder: 'Ascending',
                        Fields: 'PrimaryImageAspectRatio',
                        Limit: 12
                    });
                } else {
                    result = await client.getItems(userId, {
                        Filters: 'IsFavorite',
                        Recursive: true,
                        SortBy: 'SeriesSortName,SortName',
                        SortOrder: 'Ascending',
                        Fields: 'PrimaryImageAspectRatio',
                        IncludeItemTypes: section.types,
                        Limit: 12
                    });
                }
                setItems(result.Items || []);
            }
        } catch (err) {
            logger.error('Error loading favorites', { component: 'FavoriteItems' }, err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [serverId, userId, section.types]);

    useEffect(() => {
        loadSection();
    }, [loadSection]);

    if (isLoading) {
        return (
            <Box className="verticalSection">
                <Box style={{ display: 'flex', gap: vars.spacing['4'], overflowX: 'auto', paddingTop: '16px' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Box
                            key={i}
                            style={{
                                width: 140,
                                height: 210,
                                backgroundColor: vars.colors.surfaceHover,
                                borderRadius: '8px',
                                flexShrink: 0
                            }}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    if (items.length === 0) {
        return null;
    }

    const getImageUrl = (item: any): string => {
        const apiClient = (window as any).ApiClient;
        if (!apiClient) return '';
        const client = apiClient.getApiClient(serverId);
        const tag = item.ImageTags?.Primary || item.PrimaryImageTag;
        if (!tag) return '';
        return client.getImageUrl(item.Id, { type: 'Primary', maxWidth: 280, tag });
    };

    return (
        <Box className="verticalSection">
            <Box className="sectionTitleContainer sectionTitleContainer-cards padded-left">
                <Text size="lg" weight="bold" className="sectionTitle sectionTitle-cards">
                    {section.name}
                </Text>
            </Box>
            <Box
                className="itemsContainer padded-top-focusscale padded-bottom-focusscale"
                style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    paddingTop: 16,
                    paddingBottom: 16
                }}
            >
                {items.map(item => (
                    <a
                        key={item.Id}
                        href={`/details.html?serverId=${serverId}&id=${item.Id}`}
                        style={{
                            width: 140,
                            textDecoration: 'none',
                            color: 'inherit',
                            flexShrink: 0
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                aspectRatio: '2/3',
                                backgroundColor: '#e0e0e0',
                                borderRadius: 8,
                                marginBottom: 8,
                                backgroundImage:
                                    item.PrimaryImageTag || item.ImageTags?.Primary
                                        ? `url(${getImageUrl(item)})`
                                        : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                        <Text
                            size="sm"
                            style={{
                                textAlign: 'center',
                                maxWidth: 140,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {item.Name || item.SeriesName || item.Title}
                        </Text>
                    </a>
                ))}
            </Box>
        </Box>
    );
}

export function FavoriteItems({ serverId: propsServerId, userId: propsUserId }: FavoriteItemsProps) {
    const { currentServer } = useServerStore();
    const serverId = propsServerId || currentServer?.id || '';
    const userId = propsUserId || currentServer?.userId || '';

    if (!serverId || !userId) {
        return <LoadingView message="Select a server" />;
    }

    return (
        <Box className="favoriteItemsPage libraryPage" style={{ padding: 16 }}>
            <Box className="sections">
                {SECTIONS.map(section => (
                    <FavoriteSection key={section.id} section={section} serverId={serverId} userId={userId} />
                ))}
            </Box>
        </Box>
    );
}

export default FavoriteItems;
