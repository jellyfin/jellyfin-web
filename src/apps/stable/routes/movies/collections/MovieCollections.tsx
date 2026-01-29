import { PlayIcon } from '@radix-ui/react-icons';
import { LoadingView } from 'components/feedback/LoadingView';
import { appRouter } from 'components/router/appRouter';
import { itemsApi } from 'lib/api/items';
import { toVideoItem } from 'lib/utils/playbackUtils';
import React, { useCallback, useEffect, useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { useServerStore } from 'store/serverStore';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, Flex, Heading, IconButton, Text } from 'ui-primitives';
import { logger } from 'utils/logger';

export function MovieCollections() {
    const { currentServer } = useServerStore();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [hoveredCollectionId, setHoveredCollectionId] = useState<string | null>(null);
    const [playingCollectionId, setPlayingCollectionId] = useState<string | null>(null);

    const loadCollections = useCallback(
        async (reset = false) => {
            if (!currentServer?.id || !currentServer?.userId) return;

            const index = reset ? 0 : startIndex;
            setIsLoading(true);
            setError(null);

            try {
                const apiClient = (window as any).ApiClient;
                if (apiClient) {
                    const client = apiClient.getApiClient(currentServer.id);
                    const limit = 24;
                    const result = await client.getItems(currentServer.userId, {
                        SortBy: 'SortName',
                        SortOrder: 'Ascending',
                        IncludeItemTypes: 'BoxSet',
                        Recursive: true,
                        Fields: 'PrimaryImageAspectRatio,SortName',
                        ImageTypeLimit: 1,
                        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                        StartIndex: index,
                        Limit: limit
                    });

                    const newItems = result.Items || [];
                    if (reset) {
                        setCollections(newItems);
                    } else {
                        setCollections((prev) => [...prev, ...newItems]);
                    }
                    setStartIndex(index + limit);
                    setHasMore(newItems.length >= limit);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load collections');
            } finally {
                setIsLoading(false);
            }
        },
        [currentServer?.id, currentServer?.userId, startIndex]
    );

    useEffect(() => {
        loadCollections(true);
    }, [loadCollections]);

    const handleLoadMore = () => {
        loadCollections(false);
    };

    const handleCollectionPlay = useCallback(
        async (collectionId: string, collectionName: string) => {
            if (!currentServer?.id) return;

            try {
                setPlayingCollectionId(collectionId);
                // Fetch all movies in the collection
                const items = await itemsApi.getItems(collectionId, {
                    recursive: true,
                    limit: 1000
                });

                if (!items.Items || items.Items.length === 0) {
                    logger.warn('[MovieCollections] No movies found in collection', {
                        collectionId
                    });
                    setPlayingCollectionId(null);
                    return;
                }

                // Convert to playable items
                const playableItems = items.Items.map(toVideoItem);
                await playbackManagerBridge.setQueue(playableItems, 0);
                await playbackManagerBridge.play();
                setPlayingCollectionId(null);
            } catch (err) {
                logger.error('[MovieCollections] Failed to play collection', {
                    collectionId,
                    error: err
                });
                setPlayingCollectionId(null);
            }
        },
        [currentServer?.id]
    );

    const handleCollectionClick = useCallback((collectionId: string) => {
        appRouter.showItem({ Id: collectionId });
    }, []);

    if (!currentServer?.id) {
        return <LoadingView message="Select a server" />;
    }

    if (isLoading && collections.length === 0) {
        return <LoadingView />;
    }

    if (error && collections.length === 0) {
        return (
            <Box style={{ padding: vars.spacing['5'] }}>
                <Text color="error">{error}</Text>
                <Button
                    variant="secondary"
                    onClick={() => loadCollections(true)}
                    style={{ marginTop: vars.spacing['4'] }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    const getImageUrl = (item: any): string => {
        if (!item.PrimaryImageTag) return '';
        const apiClient = (window as any).ApiClient;
        if (!apiClient) return '';
        const client = apiClient.getApiClient(currentServer.id);
        return client.getImageUrl(item.Id, {
            type: 'Primary',
            maxWidth: 300,
            tag: item.PrimaryImageTag
        });
    };

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Collections</Heading.H2>
                </Box>
            </Box>

            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: vars.spacing['5'] }}>
                {collections.map((collection) => (
                    <Box
                        key={collection.Id}
                        style={{
                            width: 180,
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredCollectionId(collection.Id)}
                        onMouseLeave={() => setHoveredCollectionId(null)}
                        onClick={() => handleCollectionClick(collection.Id)}
                    >
                        <Box
                            style={{
                                width: '100%',
                                aspectRatio: '2/3',
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.md,
                                marginBottom: vars.spacing['4'],
                                backgroundImage: collection.PrimaryImageTag
                                    ? `url(${getImageUrl(collection)})`
                                    : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative'
                            }}
                        >
                            {hoveredCollectionId === collection.Id && (
                                <Box
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        bottom: 0,
                                        left: 0,
                                        backgroundColor: 'rgba(0,0,0,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: vars.borderRadius.md
                                    }}
                                >
                                    <IconButton
                                        size="lg"
                                        variant="solid"
                                        disabled={playingCollectionId === collection.Id}
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleCollectionPlay(collection.Id, collection.Name);
                                        }}
                                        style={{ borderRadius: '50%' }}
                                    >
                                        <PlayIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        <Text
                            size="sm"
                            style={{
                                textAlign: 'center',
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {collection.Name}
                        </Text>
                        {collection.ChildCount > 0 && (
                            <Text size="xs" color="secondary" style={{ textAlign: 'center' }}>
                                {collection.ChildCount} items
                            </Text>
                        )}
                    </Box>
                ))}
            </Box>

            {hasMore && (
                <Box style={{ textAlign: 'center', marginTop: vars.spacing['6'] }}>
                    <Button variant="secondary" onClick={handleLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load More'}
                    </Button>
                </Box>
            )}

            {collections.length === 0 && (
                <Box style={{ textAlign: 'center', padding: vars.spacing['8'] }}>
                    <Heading.H4 color="secondary">No collections found</Heading.H4>
                </Box>
            )}
        </Box>
    );
}

export default MovieCollections;
