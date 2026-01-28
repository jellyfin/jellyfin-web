import React, { useEffect, useState, useCallback } from 'react';
import { Box } from 'ui-primitives';
import { Card, CardBody } from 'ui-primitives';
import { CircularProgress } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { PlayIcon } from '@radix-ui/react-icons';
import { vars } from 'styles/tokens.css';
import globalize from 'lib/globalize';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { logger } from 'utils/logger';

const LiveTVGuidePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [hoveredGuideId, setHoveredGuideId] = useState<number | null>(null);
    const [playingGuideId, setPlayingGuideId] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Popular Guide', count: 45, guideId: 'guide-1' },
                        { id: 2, name: 'Recently Added', count: 23, guideId: 'guide-2' },
                        { id: 3, name: 'All Guide', count: 67, guideId: 'guide-3' }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                logger.error('[LiveTVGuidePage] Failed to load data', { error });
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleGuidePlay = useCallback(async (guideId: string, guideName: string) => {
        try {
            setPlayingGuideId(parseInt(guideId.split('-')[1]));
            const playable = toVideoItem({
                Id: guideId,
                Name: guideName,
                Type: 'Program',
                ServerId: 'livetv'
            });

            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
            setPlayingGuideId(null);
        } catch (err) {
            logger.error('[LiveTVGuidePage] Failed to play guide', { guideId, error: err });
            setPlayingGuideId(null);
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
                <CircularProgress size="md" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['6'] }}>
            <Text as="h2" size="xl" weight="bold" style={{ marginBottom: vars.spacing['6'] }}>
                {globalize.translate('Guide')}
            </Text>
            <Box
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: vars.spacing['6']
                }}
            >
                {data.map(item => (
                    <div
                        key={item.id}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setHoveredGuideId(item.id)}
                        onMouseLeave={() => setHoveredGuideId(null)}
                    >
                        <Card>
                            <Box
                                style={{
                                    aspectRatio: '16 / 9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: vars.colors.surfaceHover,
                                    position: 'relative'
                                }}
                            >
                                <Text size="xxl">📡</Text>
                                {hoveredGuideId === item.id && (
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
                                            disabled={playingGuideId === item.id}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleGuidePlay(item.guideId, item.name);
                                            }}
                                            style={{ borderRadius: '50%' }}
                                        >
                                            <PlayIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                            <CardBody>
                                <Text weight="medium">{item.name}</Text>
                                <Text size="sm" color="secondary">
                                    {item.count} items
                                </Text>
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </Box>
        </Box>
    );
};

export default LiveTVGuidePage;
