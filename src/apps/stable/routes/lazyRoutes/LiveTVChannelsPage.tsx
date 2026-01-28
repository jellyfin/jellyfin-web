import React, { useEffect, useState, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { Grid } from 'ui-primitives';
import { Card } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { PlayIcon } from '@radix-ui/react-icons';
import { vars } from 'styles/tokens.css.ts';
import globalize from 'lib/globalize';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { logger } from 'utils/logger';

const LiveTVChannelsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [hoveredChannelId, setHoveredChannelId] = useState<number | null>(null);
    const [playingChannelId, setPlayingChannelId] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Local News', count: 12, liveId: 'channel-1' },
                        { id: 2, name: 'Sports Channel', count: 8, liveId: 'channel-2' },
                        { id: 3, name: 'Movie Network', count: 15, liveId: 'channel-3' }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                logger.error('[LiveTVChannelsPage] Failed to load data', { error });
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChannelPlay = useCallback(async (channelId: string, channelName: string) => {
        try {
            setPlayingChannelId(parseInt(channelId));
            const playable = toVideoItem({
                Id: channelId,
                Name: channelName,
                Type: 'Channel',
                ServerId: 'livetv'
            });

            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
            setPlayingChannelId(null);
        } catch (err) {
            logger.error('[LiveTVChannelsPage] Failed to play channel', { channelId, error: err });
            setPlayingChannelId(null);
        }
    }, []);

    if (isLoading) {
        return (
            <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>{globalize.translate('Channels')}</Heading.H2>
            <Grid container spacing="md">
                {data.map(item => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Box
                            onMouseEnter={() => setHoveredChannelId(item.id)}
                            onMouseLeave={() => setHoveredChannelId(null)}
                        >
                            <Card style={{ border: `1px solid ${vars.colors.divider}`, position: 'relative' }}>
                                <Box
                                    style={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: vars.colors.surfaceHover,
                                        position: 'relative'
                                    }}
                                >
                                    <Text style={{ fontSize: vars.typography['9'].fontSize }}>📺</Text>
                                    {hoveredChannelId === item.id && (
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
                                                borderRadius: 'inherit'
                                            }}
                                        >
                                            <IconButton
                                                size="lg"
                                                variant="solid"
                                                disabled={playingChannelId === item.id}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleChannelPlay(item.liveId, item.name);
                                                }}
                                                style={{ borderRadius: '50%' }}
                                            >
                                                <PlayIcon />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                <Box style={{ padding: vars.spacing['5'] }}>
                                    <Text size="lg" weight="bold">
                                        {item.name}
                                    </Text>
                                    <Text size="sm" color="secondary">
                                        {item.count} programs
                                    </Text>
                                </Box>
                            </Card>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default LiveTVChannelsPage;
