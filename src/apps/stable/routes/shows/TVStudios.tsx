import { PlayIcon } from '@radix-ui/react-icons';
import { LoadingView } from 'components/feedback/LoadingView';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { useServerStore } from 'store/serverStore';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, Flex, Heading, IconButton, Text } from 'ui-primitives';
import { logger } from 'utils/logger';

interface StudioCardProps {
    studio: any;
    currentServerId: string;
    onPlay: () => void;
    onClick: () => void;
}

const StudioCard: React.FC<StudioCardProps> = ({ studio, currentServerId, onPlay, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            style={{ position: 'relative' }}
        >
            <Box
                onClick={onClick}
                style={{
                    width: 180,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: vars.spacing['5'],
                    borderRadius: vars.borderRadius.lg,
                    cursor: 'pointer',
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
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Text style={{ fontSize: 40, color: vars.colors.textMuted }}>business</Text>

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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlay();
                                    }}
                                    aria-label="Play studio shows"
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
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {studio.Name}
                </Text>
            </Box>
        </motion.div>
    );
};

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

    const handleStudioClick = useCallback(
        (studioId: string) => {
            if (currentServer?.id) {
                window.location.href = `/list.html?serverId=${currentServer.id}&studioId=${studioId}&type=Series`;
            }
        },
        [currentServer?.id]
    );

    const handleStudioPlay = useCallback(
        async (studio: any) => {
            try {
                if (!currentServer?.id || !currentServer?.userId) return;

                const apiClient = (window as any).ApiClient;
                if (!apiClient) return;

                const client = apiClient.getApiClient(currentServer.id);

                // Fetch shows from this studio (limit to 50)
                const url = client.getUrl('Items', {
                    UserId: currentServer.userId,
                    IncludeItemTypes: 'Series',
                    Studios: studio.Id,
                    Limit: 50,
                    Recursive: true,
                    SortBy: 'Random',
                    Fields: 'MediaSources'
                });

                const result = await client.getJSON(url);

                if (!result.Items || result.Items.length === 0) {
                    logger.warn('[TVStudios] No shows found for studio', {
                        studioName: studio.Name
                    });
                    return;
                }

                const playables = result.Items.map(toVideoItem);
                await playbackManagerBridge.setQueue(playables, 0);
                await playbackManagerBridge.play();
            } catch (error) {
                logger.error('[TVStudios] Failed to play studio shows', { error });
            }
        },
        [currentServer?.id, currentServer?.userId]
    );

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
                <Button
                    variant="secondary"
                    onClick={loadStudios}
                    style={{ marginTop: vars.spacing['4'] }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                    <Heading.H2>Studios</Heading.H2>
                </Box>
            </Box>

            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: vars.spacing['5'] }}>
                {studios.map((studio) => (
                    <StudioCard
                        key={studio.Id}
                        studio={studio}
                        currentServerId={currentServer.id || ''}
                        onPlay={() => handleStudioPlay(studio)}
                        onClick={() => handleStudioClick(studio.Id)}
                    />
                ))}
            </Box>

            {studios.length === 0 && (
                <Box style={{ textAlign: 'center', padding: vars.spacing['8'] }}>
                    <Heading.H4 color="secondary">No items found</Heading.H4>
                </Box>
            )}
        </Box>
    );
}

export default TVStudios;
