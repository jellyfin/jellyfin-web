import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { PlayIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';

import { useServerStore } from 'store/serverStore';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { appRouter } from 'components/router/appRouter';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { LoadingView } from 'components/feedback/LoadingView';
import { logger } from 'utils/logger';
import { vars } from 'styles/tokens.css';

interface TVUpcomingParams {
    topParentId?: string;
}

interface EpisodeCardProps {
    item: any;
    onPlay: () => void;
    onClick: () => void;
    getImageUrl: (item: any) => string;
}

const UpcomingEpisodeCard: React.FC<EpisodeCardProps> = ({ item, onPlay, onClick, getImageUrl }) => {
    const [isHovering, setIsHovering] = useState(false);
    const imageUrl = getImageUrl(item);

    return (
        <motion.div
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={onClick}
        >
            <Box
                style={{
                    width: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: vars.spacing['5'],
                    borderRadius: vars.borderRadius.lg,
                    position: 'relative'
                }}
            >
                <Box
                    style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md,
                        marginBottom: vars.spacing['4'],
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <AnimatePresence>
                        {isHovering && (
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    backdropFilter: 'blur(2px)'
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <IconButton
                                    variant="solid"
                                    color="primary"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onPlay();
                                    }}
                                    aria-label="Play episode"
                                >
                                    <PlayIcon />
                                </IconButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
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
            </Box>
        </motion.div>
    );
};

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

    const handleItemClick = useCallback((item: any) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: any) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            logger.error('[TVUpcoming] Failed to play episode', { error });
        }
    }, []);

    if (!currentServer?.id) {
        return <LoadingView message="Select a server" />;
    }

    if (isLoading) {
        return <LoadingView />;
    }

    if (error) {
        return (
            <Box style={{ padding: vars.spacing['5'] }}>
                <Text color="error">{error}</Text>
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Upcoming</Heading.H2>
                </Box>
            </Box>

            {upcoming.length === 0 ? (
                <Box style={{ textAlign: 'center', padding: vars.spacing['8'] }}>
                    <Heading.H4 color="secondary">No upcoming episodes</Heading.H4>
                </Box>
            ) : (
                <Box>
                    {groupedItems.map(group => (
                        <Box key={group.name} style={{ marginBottom: vars.spacing['7'] }}>
                            <Heading.H3 style={{ marginBottom: vars.spacing['5'], paddingLeft: vars.spacing['4'] }}>
                                {group.name}
                            </Heading.H3>

                            <Box
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: vars.spacing['5'],
                                    paddingLeft: vars.spacing['4'],
                                    paddingRight: vars.spacing['4']
                                }}
                            >
                                {group.items.map(item => (
                                    <UpcomingEpisodeCard
                                        key={item.Id}
                                        item={item}
                                        getImageUrl={getImageUrl}
                                        onPlay={() => handleItemPlay(item)}
                                        onClick={() => handleItemClick(item)}
                                    />
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
