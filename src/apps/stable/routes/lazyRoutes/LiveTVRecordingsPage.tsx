import { PlayIcon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import { toVideoItem } from 'lib/utils/playbackUtils';
import React, { useCallback, useEffect, useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { vars } from 'styles/tokens.css.ts';
import { Box, Card, CircularProgress, Grid, Heading, IconButton, Text } from 'ui-primitives';
import { logger } from 'utils/logger';

const LiveTVRecordingsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [hoveredRecordingId, setHoveredRecordingId] = useState<number | null>(null);
    const [playingRecordingId, setPlayingRecordingId] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Latest Recordings', count: 24, recordingId: 'rec-1' },
                        { id: 2, name: 'Movies', count: 12, recordingId: 'rec-2' },
                        { id: 3, name: 'TV Shows', count: 45, recordingId: 'rec-3' }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                logger.error('[LiveTVRecordingsPage] Failed to load data', { error });
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRecordingPlay = useCallback(async (recordingId: string, recordingName: string) => {
        try {
            setPlayingRecordingId(parseInt(recordingId));
            const playable = toVideoItem({
                Id: recordingId,
                Name: recordingName,
                Type: 'Recording',
                ServerId: 'livetv'
            });

            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
            setPlayingRecordingId(null);
        } catch (err) {
            logger.error('[LiveTVRecordingsPage] Failed to play recording', {
                recordingId,
                error: err
            });
            setPlayingRecordingId(null);
        }
    }, []);

    if (isLoading) {
        return (
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px'
                }}
            >
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>
                {globalize.translate('Recordings')}
            </Heading.H2>
            <Grid container spacing="md">
                {data.map((item) => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Box
                            onMouseEnter={() => setHoveredRecordingId(item.id)}
                            onMouseLeave={() => setHoveredRecordingId(null)}
                        >
                            <Card
                                style={{
                                    border: `1px solid ${vars.colors.divider}`,
                                    position: 'relative'
                                }}
                            >
                                <Box
                                    style={{
                                        aspectRatio: '16/9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: vars.colors.surfaceHover,
                                        position: 'relative'
                                    }}
                                >
                                    <Text style={{ fontSize: vars.typography['9'].fontSize }}>
                                        📼
                                    </Text>
                                    {hoveredRecordingId === item.id && (
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
                                                disabled={playingRecordingId === item.id}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleRecordingPlay(
                                                        item.recordingId,
                                                        item.name
                                                    );
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
                                        {item.count} items
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

export default LiveTVRecordingsPage;
