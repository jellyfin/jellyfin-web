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

const LiveTVSeriesTimersPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [hoveredTimerId, setHoveredTimerId] = useState<number | null>(null);
    const [playingTimerId, setPlayingTimerId] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Active Series Timers', count: 8, timerId: 'timer-1' },
                        { id: 2, name: 'Completed', count: 56, timerId: 'timer-2' },
                        { id: 3, name: 'Conflicts', count: 0, timerId: 'timer-3' }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                logger.error('[LiveTVSeriesTimersPage] Failed to load data', { error });
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleSeriesTimerPlay = useCallback(async (timerId: string, timerName: string) => {
        try {
            setPlayingTimerId(parseInt(timerId.split('-')[1]));
            const playable = toVideoItem({
                Id: timerId,
                Name: timerName,
                Type: 'Series',
                ServerId: 'livetv'
            });

            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
            setPlayingTimerId(null);
        } catch (err) {
            logger.error('[LiveTVSeriesTimersPage] Failed to play series timer', { timerId, error: err });
            setPlayingTimerId(null);
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
            <Heading.H2 style={{ marginBottom: vars.spacing['6'] }}>{globalize.translate('Series')}</Heading.H2>
            <Grid container spacing="md">
                {data.map(item => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Box
                            onMouseEnter={() => setHoveredTimerId(item.id)}
                            onMouseLeave={() => setHoveredTimerId(null)}
                        >
                            <Card style={{ border: `1px solid ${vars.colors.divider}`, position: 'relative' }}>
                                <Box
                                    style={{
                                        aspectRatio: '2/3',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: vars.colors.surfaceHover,
                                        position: 'relative'
                                    }}
                                >
                                    <Text style={{ fontSize: vars.typography['9'].fontSize }}>🔄</Text>
                                    {hoveredTimerId === item.id && (
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
                                                disabled={playingTimerId === item.id}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleSeriesTimerPlay(item.timerId, item.name);
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
                                        {item.count} series
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

export default LiveTVSeriesTimersPage;
