import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives/Text';

import { useServerStore } from 'store/serverStore';
import { LoadingView } from 'components/joy-ui/feedback/LoadingView';
import { vars } from 'styles/tokens.css';

interface TVUpcomingParams {
    topParentId?: string;
}

export function TVUpcoming() {
    const { currentServer } = useServerStore();
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUpcoming = useCallback(async () => {
        if (!currentServer?.id || !currentServer?.userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const apiClient = (window as any).ApiClient;
            if (apiClient) {
                const client = apiClient.getApiClient(currentServer.id);
                const url = client.getUrl('Shows/Upcoming', {
                    Limit: 48,
                    Fields: 'AirTime',
                    UserId: currentServer.userId,
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                    EnableTotalRecordCount: false
                });
                const result = await client.getJSON(url);
                setUpcoming(result.Items || []);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load upcoming shows');
        } finally {
            setIsLoading(false);
        }
    }, [currentServer?.id, currentServer?.userId]);

    useEffect(() => {
        loadUpcoming();
    }, [loadUpcoming]);

    const groupedItems = useMemo(() => {
        const groups: { name: string; items: any[] }[] = [];
        let currentGroupName = '';
        let currentGroup: any[] = [];

        const parseDate = (dateStr: string): Date | null => {
            try {
                return new Date(dateStr);
            } catch {
                return null;
            }
        };

        const formatDate = (date: Date): string => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            }
            if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        };

        upcoming.forEach(item => {
            let dateText = '';
            if (item.PremiereDate) {
                const date = parseDate(item.PremiereDate);
                if (date) {
                    dateText = formatDate(date);
                }
            }

            if (dateText !== currentGroupName && dateText) {
                if (currentGroup.length > 0) {
                    groups.push({ name: currentGroupName, items: currentGroup });
                }
                currentGroupName = dateText;
                currentGroup = [item];
            } else {
                currentGroup.push(item);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ name: currentGroupName, items: currentGroup });
        }

        return groups;
    }, [upcoming]);

    const getImageUrl = (item: any): string => {
        if (!currentServer?.id) return '';
        const apiClient = (window as any).ApiClient;
        if (!apiClient) return '';

        const client = apiClient.getApiClient(currentServer.id);
        const imageTag = item.ImageTags?.Primary || item.PrimaryImageTag;
        if (!imageTag) return '';

        return client.getImageUrl(item.Id, {
            type: 'Primary',
            maxWidth: 400,
            tag: imageTag
        });
    };

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
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing.md }}>
            <Box style={{ marginBottom: vars.spacing.lg }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Upcoming</Heading.H2>
                </Box>
            </Box>

            {upcoming.length === 0 ? (
                <Box style={{ textAlign: 'center', padding: vars.spacing.xxl }}>
                    <Heading.H4 color="secondary">No upcoming episodes</Heading.H4>
                </Box>
            ) : (
                <Box>
                    {groupedItems.map(group => (
                        <Box key={group.name} style={{ marginBottom: vars.spacing.xl }}>
                            <Heading.H3 style={{ marginBottom: vars.spacing.md, paddingLeft: vars.spacing.sm }}>
                                {group.name}
                            </Heading.H3>

                            <Box
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: vars.spacing.md,
                                    paddingLeft: vars.spacing.sm,
                                    paddingRight: vars.spacing.sm
                                }}
                            >
                                {group.items.map(item => (
                                    <a
                                        key={item.Id}
                                        href={`/details.html?serverId=${currentServer.id}&id=${item.Id}`}
                                        style={{
                                            width: 280,
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
                                                aspectRatio: '16/9',
                                                backgroundColor: vars.colors.surface,
                                                borderRadius: vars.borderRadius.md,
                                                marginBottom: vars.spacing.sm,
                                                backgroundImage: getImageUrl(item)
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
                                                maxWidth: 260,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {item.SeriesName || item.Name}
                                        </Text>
                                        {item.EpisodeTitle && (
                                            <Text
                                                size="xs"
                                                color="secondary"
                                                style={{
                                                    textAlign: 'center',
                                                    maxWidth: 260,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {item.EpisodeTitle}
                                            </Text>
                                        )}
                                    </a>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default TVUpcoming;
