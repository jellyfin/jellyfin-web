import React, { useEffect, useState, useCallback } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';

import { useServerStore } from 'store/serverStore';
import { LoadingView } from 'components/joy-ui/feedback/LoadingView';
import { vars } from 'styles/tokens.css';

export function TVStudios() {
    const { currentServer } = useServerStore();
    const [studios, setStudios] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStudios = useCallback(async () => {
        if (!currentServer?.id || !currentServer?.userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const apiClient = (window as any).ApiClient;
            if (apiClient) {
                const client = apiClient.getApiClient(currentServer.id);
                const result = await client.getStudios(currentServer.userId, {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Series',
                    Recursive: true,
                    Fields: 'DateCreated,PrimaryImageAspectRatio',
                    StartIndex: 0
                });
                setStudios(result.Items || []);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load studios');
        } finally {
            setIsLoading(false);
        }
    }, [currentServer?.id, currentServer?.userId]);

    useEffect(() => {
        loadStudios();
    }, [loadStudios]);

    if (!currentServer?.id) {
        return <LoadingView message="Select a server" />;
    }

    if (isLoading) {
        return <LoadingView />;
    }

    if (error) {
        return (
            <Box style={{ padding: vars.spacing.md }}>
                <Text color="error">{error}</Text>
                <Button variant="secondary" onClick={loadStudios} style={{ marginTop: vars.spacing.sm }}>
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing.md }}>
            <Box style={{ marginBottom: vars.spacing.lg }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Studios</Heading.H2>
                </Box>
            </Box>

            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: vars.spacing.md }}>
                {studios.map(studio => (
                    <a
                        key={studio.Id}
                        href={`/list.html?serverId=${currentServer.id}&studioId=${studio.Id}&type=Series`}
                        style={{
                            width: 180,
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: vars.spacing.md,
                            borderRadius: vars.borderRadius.lg
                        }}
                    >
                        <Box
                            style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.md,
                                marginBottom: vars.spacing.sm,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Text style={{ fontSize: 40, color: vars.colors.textMuted }}>business</Text>
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
                            {studio.Name}
                        </Text>
                    </a>
                ))}
            </Box>

            {studios.length === 0 && (
                <Box style={{ textAlign: 'center', padding: vars.spacing.xxl }}>
                    <Heading.H4 color="secondary">No items found</Heading.H4>
                </Box>
            )}
        </Box>
    );
}

export default TVStudios;
