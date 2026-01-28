import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'hooks/useSearchParams';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { useServerStore } from 'store/serverStore';
import { LoadingView } from 'components/feedback/LoadingView';
import { PageContainer } from 'components/layout/PageContainer';
import { useUserViews } from 'hooks/useUserViews';
import { useNavigate } from '@tanstack/react-router';

export function ListView() {
    const [searchParams] = useSearchParams();
    const { currentServer } = useServerStore();
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const navigate = useNavigate();

    const serverId = searchParams.get('serverId') || currentServer?.id || '';
    const type = searchParams.get('type') || '';
    const parentId = searchParams.get('parentId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);

    const { data: userViews } = useUserViews(currentServer?.userId ?? undefined);

    const resolvedTitle = useMemo(() => {
        if (parentId && userViews?.Items) {
            const view = userViews.Items.find(v => v.Id === parentId);
            if (view) return view.Name;
        }
        
        if (type === 'Movie') return 'Movies';
        if (type === 'Series') return 'TV Shows';
        if (type === 'MusicAlbum') return 'Albums';
        if (type) return type;
        
        return 'Items';
    }, [parentId, userViews, type]);

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
                        ParentId: parentId || undefined,
                        StartIndex: (page - 1) * 100,
                        Limit: 100,
                        Recursive: !parentId,
                        IncludeItemTypes: type || undefined,
                        Fields: 'PrimaryImageAspectRatio,SortName,ProductionYear'
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
    }, [serverId, type, parentId, page, currentServer?.userId]);

    if (!serverId) {
        return <LoadingView message="Select a server" />;
    }

    return (
        <PageContainer>
            <Box style={{ paddingBottom: vars.spacing['7'] }}>
                <Flex align="center" wrap="wrap" gap="md" style={{ marginBottom: vars.spacing['6'] }}>
                    <Box style={{ flexGrow: 1 }}>
                        <Heading.H2>{resolvedTitle}</Heading.H2>
                        <Text color="secondary">{items.length} items</Text>
                    </Box>
                    <Flex gap="sm">
                        <Button variant="secondary" size="sm">
                            Sort
                        </Button>
                        <Button variant="secondary" size="sm">
                            Filters
                        </Button>
                    </Flex>
                </Flex>

                {isLoading ? (
                    <LoadingView />
                ) : items.length === 0 ? (
                    <Box style={{ textAlign: 'center', padding: vars.spacing['8'] }}>
                        <Heading.H4 color="secondary">No items found</Heading.H4>
                    </Box>
                ) : (
                    <Box 
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                            gap: vars.spacing['5'] 
                        }}
                    >
                        {items.map((item: any) => {
                            const imageTag = item.ImageTags?.Primary;
                            const imageUrl = item.Id && imageTag
                                ? `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`
                                : null;

                            return (
                                <Box
                                    key={item.Id}
                                    onClick={() => navigate({ to: '/details', search: { id: item.Id } as any })}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'block'
                                    }}
                                >
                                    <Box
                                        style={{
                                            width: '100%',
                                            aspectRatio: '2/3',
                                            backgroundColor: vars.colors.surface,
                                            borderRadius: vars.borderRadius.md,
                                            marginBottom: vars.spacing['3'],
                                            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            transition: vars.transitions.normal
                                        }}
                                    />
                                    <Text
                                        size="sm"
                                        weight="medium"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {item.Name}
                                    </Text>
                                    {item.ProductionYear && (
                                        <Text size="xs" color="secondary">
                                            {item.ProductionYear}
                                        </Text>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </PageContainer>
    );
}

export default ListView;
