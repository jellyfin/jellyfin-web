import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'hooks/useSearchParams';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { vars } from 'styles/tokens.css';
import { useServerStore } from 'store/serverStore';
import { LoadingView } from 'components/feedback/LoadingView';

export function ListView() {
    const [searchParams] = useSearchParams();
    const { currentServer } = useServerStore();
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    const serverId = searchParams.get('serverId') || currentServer?.id || '';
    const type = searchParams.get('type') || 'Movie';
    const page = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        async function loadItems() {
            if (!serverId) return;

            setIsLoading(true);
            try {
                const apiClient = (window as any).ApiClient;
                if (apiClient) {
                    const client = apiClient.getApiClient(serverId);
                    const userId = currentServer?.userId || '';
                    const result = await client.getItems(userId, {
                        StartIndex: (page - 1) * 50,
                        Limit: 50,
                        Recursive: true,
                        IncludeItemTypes: type,
                        Fields: 'PrimaryImageAspectRatio,SortName'
                    });
                    setItems(result.Items || []);
                }
            } catch (error) {
                console.error('Error loading items:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadItems();
    }, [serverId, type, page, currentServer?.userId]);

    if (!serverId) {
        return <LoadingView message="Select a server" />;
    }

    const title = type === 'Movie' ? 'Movies' : type === 'Series' ? 'TV Shows' : type;

    return (
        <Box style={{ padding: vars.spacing.md }}>
            <Flex align="center" wrap="wrap" gap="md" style={{ marginBottom: vars.spacing.lg, flexGrow: 1 }}>
                <Heading.H2>{title}</Heading.H2>
                <Text color="secondary">{items.length} items</Text>
                <Box style={{ flex: 1 }} />
                <Button variant="secondary" size="sm">
                    Sort
                </Button>
                <Button variant="secondary" size="sm">
                    Filters
                </Button>
            </Flex>

            {isLoading ? (
                <LoadingView />
            ) : items.length === 0 ? (
                <Box style={{ textAlign: 'center', padding: vars.spacing.xxl }}>
                    <Heading.H4 color="secondary">No items found</Heading.H4>
                </Box>
            ) : (
                <Box style={{ display: 'flex', flexWrap: 'wrap', gap: vars.spacing.md }}>
                    {items.map((item: any) => (
                        <a
                            key={item.Id}
                            href={`/details.html?serverId=${serverId}&id=${item.Id}`}
                            style={{
                                width: 180,
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'block'
                            }}
                        >
                            <Box
                                style={{
                                    width: '100%',
                                    aspectRatio: '2/3',
                                    backgroundColor: vars.colors.surface,
                                    borderRadius: vars.borderRadius.md,
                                    marginBottom: vars.spacing.sm
                                }}
                            />
                            <Text
                                size="sm"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {item.Name}
                            </Text>
                        </a>
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default ListView;
