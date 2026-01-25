import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useRouter } from '@tanstack/react-router';

// Joy UI Components
import { Box, Flex } from 'ui-primitives/Box';
import { Chip } from 'ui-primitives/Chip';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { IconButton } from 'ui-primitives/IconButton';
import { Paper } from 'ui-primitives/Paper';
import { Slider } from 'ui-primitives/Slider';
import { Tab, TabList, TabPanel, Tabs } from 'ui-primitives/Tabs';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

// Radix Icons
import {
    ArrowLeftIcon,
    DiscIcon,
    InfoCircledIcon,
    PauseIcon,
    PlayIcon,
    StackIcon,
    TrackNextIcon,
    TrackPreviousIcon
} from '@radix-ui/react-icons';

// Store hooks
import {
    useIsPlaying,
    useCurrentItem,
    useCurrentTime,
    useDuration,
    usePlaybackActions,
    useQueueActions,
    useFormattedTime
} from '../../../../store';

import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import Events, { type EventObject } from 'utils/events';
import { QueueTable } from './QueueTable';
import { visualizerSettings } from '../../../../components/visualizer/visualizers.logic';
import { logger } from '../../../../utils/logger';

interface QueueItem {
    Id: string;
    Name: string;
    Artists?: string[];
    AlbumArtist?: string;
    Album?: string;
    RunTimeTicks?: number;
    ImageTags?: { Primary?: string };
    ServerId?: string;
    PlaylistItemId?: string;
}

/**
 * Unified Now Playing / Queue Page
 * Combines full-screen player view with queue management in a tabbed interface
 */
const QueuePage: React.FC = () => {
    const router = useRouter();
    const navigate = useNavigate();

    // Store hooks for playback state
    const isPlaying = useIsPlaying();
    const currentItem = useCurrentItem();
    const currentTime = useCurrentTime();
    const duration = useDuration();
    const { currentTimeFormatted, durationFormatted } = useFormattedTime();
    const { togglePlayPause, seek, seekPercent } = usePlaybackActions();
    const { next, previous } = useQueueActions();

    // Local state
    const [isLoading, setIsLoading] = useState(true);
    const [queueData, setQueueData] = useState<QueueItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<number>(0);
    const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [localSeekValue, setLocalSeekValue] = useState(0);

    // Get display info from current item
    const trackName = currentItem?.name || currentItem?.title || 'Unknown Track';
    const artistName = currentItem?.artist || currentItem?.albumArtist || '';
    const albumName = currentItem?.album || '';
    const imageUrl =
        currentItem?.imageUrl ||
        currentItem?.artwork?.find(img => img.type === 'Primary')?.url ||
        currentItem?.artwork?.[0]?.url;

    // Next track info
    const nextItem = currentItem?.nextItem;
    const nextTrackName = nextItem?.name || nextItem?.title || '';
    const nextArtistName = nextItem?.artist || nextItem?.albumArtist || '';
    const nextImageUrl = nextItem?.imageUrl || nextItem?.artwork?.find(img => img.type === 'Primary')?.url;

    const loadQueue = useCallback(() => {
        try {
            const player = playbackManager.getCurrentPlayer();
            if (!player) {
                setQueueData([]);
                setIsLoading(false);
                return;
            }

            const playlist = playbackManager.getPlaylistSync(player) || [];
            const index = playbackManager.getCurrentPlaylistIndex();

            setQueueData(playlist as QueueItem[]);
            setCurrentIndex(index);
            setIsLoading(false);
        } catch (error) {
            logger.error('Failed to load queue', { component: 'QueuePage' }, error as Error);
            setQueueData([]);
            setIsLoading(false);
        }
    }, []);

    // Force enable visualizer on this page
    useEffect(() => {
        const originalState = visualizerSettings.butterchurn.enabled;
        visualizerSettings.butterchurn.enabled = true;

        document.body.classList.add('is-fullscreen-player');

        return () => {
            visualizerSettings.butterchurn.enabled = originalState;
            document.body.classList.remove('is-fullscreen-player');
        };
    }, []);

    useEffect(() => {
        loadQueue();

        const handlePlaylistChange = () => loadQueue();
        const handlePlaybackStart = () => loadQueue();
        const handlePlaybackStop = () => loadQueue();

        Events.on(playbackManager as unknown as EventObject, 'playlistitemremove', handlePlaylistChange);
        Events.on(playbackManager as unknown as EventObject, 'playlistitemadd', handlePlaylistChange);
        Events.on(playbackManager as unknown as EventObject, 'playlistitemchange', handlePlaylistChange);
        Events.on(playbackManager as unknown as EventObject, 'playbackstart', handlePlaybackStart);
        Events.on(playbackManager as unknown as EventObject, 'playbackstop', handlePlaybackStop);

        return () => {
            Events.off(playbackManager as unknown as EventObject, 'playlistitemremove', handlePlaylistChange);
            Events.off(playbackManager as unknown as EventObject, 'playlistitemadd', handlePlaylistChange);
            Events.off(playbackManager as unknown as EventObject, 'playlistitemchange', handlePlaylistChange);
            Events.off(playbackManager as unknown as EventObject, 'playbackstart', handlePlaybackStart);
            Events.off(playbackManager as unknown as EventObject, 'playbackstop', handlePlaybackStop);
        };
    }, [loadQueue]);

    // Sync local seek value when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    const handleSeekChange = (newValue: number[]) => {
        setLocalSeekValue(newValue[0] ?? 0);
    };

    const handleSeekStart = () => setIsDragging(true);

    const handleSeekEnd = () => {
        setIsDragging(false);
        if (duration > 0) {
            const percent = (localSeekValue / duration) * 100;
            seekPercent(percent);
        }
    };

    const handlePrevious = () => {
        if (currentTime >= 5) {
            seek(0);
        } else {
            previous();
        }
    };

    const handlePlayItem = useCallback((item: QueueItem) => {
        if (item.Id) {
            void playbackManager.play({
                ids: [item.Id],
                serverId: item.ServerId,
                startPositionTicks: 0
            });
        }
    }, []);

    const handleRemoveItem = useCallback(
        (item: QueueItem) => {
            const queueManager = (playbackManager as any)._playQueueManager;
            const playlistItemId = (item as any).PlaylistItemId;
            if (queueManager && playlistItemId) {
                queueManager.removeFromPlaylist([playlistItemId]);
                loadQueue();
            }
        },
        [loadQueue]
    );

    const handleReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            const queueManager = (playbackManager as any)._playQueueManager;
            if (queueManager?._playlist) {
                const playlist = queueManager._playlist;
                const [removed] = playlist.splice(fromIndex, 1);
                playlist.splice(toIndex, 0, removed);
                loadQueue();
            }
        },
        [loadQueue]
    );

    // Loading state
    if (isLoading) {
        return (
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: vars.colors.background
                }}
            >
                <CircularProgress size="lg" />
                <Text size="lg" color="secondary" style={{ marginTop: vars.spacing.md }}>
                    {globalize.translate('Loading')}...
                </Text>
            </Box>
        );
    }

    // Empty state - no current item
    if (!currentItem && queueData.length === 0) {
        return (
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: vars.colors.background,
                    position: 'relative'
                }}
            >
                <IconButton
                    onClick={() => router.history.back()}
                    variant="plain"
                    color="neutral"
                    style={{ position: 'absolute', top: 20, left: 20 }}
                >
                    <ArrowLeftIcon />
                </IconButton>
                <DiscIcon
                    style={{ width: 80, height: 80, color: vars.colors.textMuted, marginBottom: vars.spacing.md }}
                />
                <Text size="xl" weight="bold" color="secondary">
                    {globalize.translate('MessageNoItemsAvailable')}
                </Text>
                <Text size="md" color="muted" style={{ marginTop: vars.spacing.xs }}>
                    Start playing something to see the queue
                </Text>
            </Box>
        );
    }

    return (
        <Box style={{ minHeight: '100vh', backgroundColor: vars.colors.background, position: 'relative' }}>
            {/* Background gradient */}
            <Box
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))',
                    pointerEvents: 'none'
                }}
            />

            {/* Header */}
            <Flex
                direction="row"
                justify="space-between"
                align="center"
                style={{ position: 'relative', zIndex: 1, padding: vars.spacing.md }}
            >
                <IconButton onClick={() => router.history.back()} variant="plain" color="neutral">
                    <ArrowLeftIcon />
                </IconButton>
                <Text size="sm" color="secondary">
                    {albumName}
                </Text>
                <IconButton
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                    variant="plain"
                    color={showTechnicalInfo ? 'primary' : 'neutral'}
                >
                    <InfoCircledIcon />
                </IconButton>
            </Flex>

            {/* Tabs */}
            <Tabs
                value={String(activeTab)}
                onValueChange={val => setActiveTab(Number(val))}
                style={{ position: 'relative', zIndex: 1 }}
            >
                <TabList style={{ justifyContent: 'center', gap: vars.spacing.md, backgroundColor: 'transparent' }}>
                    <Tab value="0">
                        <DiscIcon style={{ marginRight: vars.spacing.xs }} />
                        Now Playing
                    </Tab>
                    <Tab value="1">
                        <StackIcon style={{ marginRight: vars.spacing.xs }} />
                        Queue ({queueData.length})
                    </Tab>
                </TabList>

                {/* Now Playing Tab */}
                <TabPanel value="0" style={{ padding: 0 }}>
                    <Flex
                        direction={window.innerWidth < 600 ? 'column' : 'row'}
                        gap={vars.spacing.xl}
                        align="center"
                        justify="center"
                        style={{ padding: vars.spacing.xl, minHeight: 'calc(100vh - 180px)' }}
                    >
                        {/* Artwork */}
                        <Box style={{ flex: '0 0 auto' }}>
                            <motion.div layoutId="now-playing-art">
                                <Box
                                    style={{
                                        width: window.innerWidth < 600 ? 280 : 400,
                                        aspectRatio: '1 / 1',
                                        borderRadius: vars.borderRadius.lg,
                                        overflow: 'hidden',
                                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                        backgroundColor: vars.colors.surface
                                    }}
                                >
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <Box
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: vars.colors.surfaceHover
                                            }}
                                        >
                                            <DiscIcon style={{ width: 80, height: 80, color: vars.colors.textMuted }} />
                                        </Box>
                                    )}
                                </Box>
                            </motion.div>
                        </Box>

                        {/* Info and Controls */}
                        <Flex
                            direction="column"
                            gap={vars.spacing.lg}
                            style={{ flex: '1 1 auto', maxWidth: 500, width: '100%' }}
                        >
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Text as="h2" size="xl" weight="bold" style={{ color: vars.colors.text }}>
                                    {trackName}
                                </Text>
                                <Text size="lg" color="secondary">
                                    {artistName}
                                </Text>
                            </motion.div>

                            {/* Progress Slider */}
                            <Box>
                                <Slider
                                    min={0}
                                    max={duration || 100}
                                    step={0.1}
                                    value={[localSeekValue]}
                                    onMouseDown={handleSeekStart}
                                    onTouchStart={handleSeekStart}
                                    onValueChange={handleSeekChange}
                                    onValueCommit={handleSeekEnd}
                                />
                                <Flex direction="row" justify="space-between" style={{ marginTop: vars.spacing.xs }}>
                                    <Text size="xs" color="muted">
                                        {currentTimeFormatted}
                                    </Text>
                                    <Text size="xs" color="muted">
                                        {durationFormatted}
                                    </Text>
                                </Flex>
                            </Box>

                            {/* Playback Buttons */}
                            <Flex direction="row" gap={vars.spacing.md} justify="center" align="center">
                                <IconButton onClick={handlePrevious} variant="plain" size="lg" color="neutral">
                                    <TrackPreviousIcon style={{ width: 40, height: 40 }} />
                                </IconButton>
                                <IconButton
                                    onClick={togglePlayPause}
                                    variant="solid"
                                    size="lg"
                                    style={{ width: 72, height: 72, borderRadius: '50%' }}
                                >
                                    {isPlaying ? (
                                        <PauseIcon style={{ width: 40, height: 40 }} />
                                    ) : (
                                        <PlayIcon style={{ width: 40, height: 40 }} />
                                    )}
                                </IconButton>
                                <IconButton onClick={next} variant="plain" size="lg" color="neutral">
                                    <TrackNextIcon style={{ width: 40, height: 40 }} />
                                </IconButton>
                            </Flex>

                            {/* Next Up Preview */}
                            {nextItem && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Paper
                                        variant="outlined"
                                        style={{
                                            padding: vars.spacing.md,
                                            borderRadius: vars.borderRadius.md,
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <Chip size="sm" variant="soft" style={{ marginBottom: vars.spacing.xs }}>
                                            NEXT UP
                                        </Chip>
                                        <Flex direction="row" gap={vars.spacing.md} align="center">
                                            <Box
                                                style={{
                                                    width: 48,
                                                    aspectRatio: '1 / 1',
                                                    borderRadius: vars.borderRadius.sm,
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {nextImageUrl ? (
                                                    <img
                                                        src={nextImageUrl}
                                                        alt={nextTrackName}
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box
                                                        style={{
                                                            backgroundColor: vars.colors.surfaceHover,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <DiscIcon
                                                            style={{
                                                                width: 20,
                                                                height: 20,
                                                                color: vars.colors.textMuted
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                            <Box style={{ minWidth: 0 }}>
                                                <Text
                                                    size="sm"
                                                    weight="bold"
                                                    style={{
                                                        color: vars.colors.text,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {nextTrackName}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    color="muted"
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {nextArtistName}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </Paper>
                                </motion.div>
                            )}
                        </Flex>
                    </Flex>
                </TabPanel>

                {/* Queue Tab */}
                <TabPanel value="1" style={{ padding: 0 }}>
                    <Box style={{ padding: vars.spacing.lg, paddingBottom: vars.spacing.md }}>
                        <Text size="xl" weight="bold">
                            {globalize.translate('HeaderPlaybackQueue') || 'Playback Queue'}
                        </Text>
                        <Text size="sm" color="muted" style={{ marginTop: vars.spacing.xs }}>
                            {queueData.length} {globalize.translate('Items').toLowerCase()}
                        </Text>
                    </Box>
                    <QueueTable
                        queueData={queueData}
                        currentIndex={currentIndex}
                        onReorder={handleReorder}
                        onRemove={handleRemoveItem}
                        onPlay={handlePlayItem}
                    />
                    <Box style={{ height: 100 }} />
                </TabPanel>
            </Tabs>

            {/* Technical Info Panel */}
            <AnimatePresence>
                {showTechnicalInfo && currentItem && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'fixed', bottom: 100, left: 20, right: 20, zIndex: 10 }}
                    >
                        <Paper
                            variant="outlined"
                            style={{
                                padding: vars.spacing.lg,
                                borderRadius: vars.borderRadius.lg,
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                backdropFilter: 'blur(20px)'
                            }}
                        >
                            <Text
                                size="sm"
                                weight="medium"
                                style={{ color: vars.colors.text, marginBottom: vars.spacing.md }}
                            >
                                Technical Stream Info
                            </Text>
                            <Flex direction="row" gap={vars.spacing.lg}>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Codec
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        {currentItem.streamInfo?.codec?.toUpperCase() || 'Unknown'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Bitrate
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        {currentItem.streamInfo?.bitrate
                                            ? `${Math.round(currentItem.streamInfo.bitrate / 1000)} kbps`
                                            : 'Unknown'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Engine
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        Wasm (Next-Gen)
                                    </Text>
                                </Box>
                            </Flex>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default QueuePage;
