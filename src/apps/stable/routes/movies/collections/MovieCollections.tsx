import React, { useEffect, useState, useCallback } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';

import { useServerStore } from 'store/serverStore';
import { LoadingView } from 'components/feedback/LoadingView';
import { vars } from 'styles/tokens.css';

export function MovieCollections() {
    const { currentServer } = useServerStore();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);

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
                        setCollections(prev => [...prev, ...newItems]);
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

    if (!currentServer?.id) {
        return <LoadingView message="Select a server" />;
    }

    if (isLoading && collections.length === 0) {
        return <LoadingView />;
    }

    if (error && collections.length === 0) {
        return (
            <Box style={{ padding: vars.spacing.md }}>
                <Text color="error">{error}</Text>
                <Button
                    variant="secondary"
                    onClick={() => loadCollections(true)}
                    style={{ marginTop: vars.spacing.sm }}
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
        <Box style={{ padding: vars.spacing.md }}>
            <Box style={{ marginBottom: vars.spacing.lg }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Collections</Heading.H2>
                </Box>
            </Box>

            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: vars.spacing.md }}>
                {collections.map(collection => (
                    <a
                        key={collection.Id}
                        href={`/details.html?serverId=${currentServer.id}&id=${collection.Id}`}
                        style={{
                            width: 180,
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: vars.spacing.md,
                            borderRadius: vars.borderRadius.lg
                        }}
                    >
                        <Box
                            style={{
                                width: '100%',
                                aspectRatio: '2/3',
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.md,
                                marginBottom: vars.spacing.sm,
                                backgroundImage: collection.PrimaryImageTag
                                    ? `url(${getImageUrl(collection)})`
                                    : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
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
                    </a>
                ))}
            </Box>

            {hasMore && (
                <Box style={{ textAlign: 'center', marginTop: vars.spacing.lg }}>
                    <Button variant="secondary" onClick={handleLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load More'}
                    </Button>
                </Box>
            )}

            {collections.length === 0 && (
                <Box style={{ textAlign: 'center', padding: vars.spacing.xxl }}>
                    <Heading.H4 color="secondary">No collections found</Heading.H4>
                </Box>
            )}
        </Box>
    );
}

export default MovieCollections;
