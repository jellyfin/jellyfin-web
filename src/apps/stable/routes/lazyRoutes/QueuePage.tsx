import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Joy UI Components
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import AspectRatio from '@mui/joy/AspectRatio';
import Slider from '@mui/joy/Slider';
import Sheet from '@mui/joy/Sheet';
import Chip from '@mui/joy/Chip';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import AlbumIcon from '@mui/icons-material/Album';
import InfoIcon from '@mui/icons-material/Info';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

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
import Events from 'utils/events';
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
    const imageUrl = currentItem?.imageUrl
        || currentItem?.artwork?.find(img => img.type === 'Primary')?.url
        || currentItem?.artwork?.[0]?.url;

    // Next track info
    const nextItem = currentItem?.nextItem;
    const nextTrackName = nextItem?.name || nextItem?.title || '';
    const nextArtistName = nextItem?.artist || nextItem?.albumArtist || '';
    const nextImageUrl = nextItem?.imageUrl
        || nextItem?.artwork?.find(img => img.type === 'Primary')?.url;

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

        Events.on(playbackManager, 'playlistitemremove', handlePlaylistChange);
        Events.on(playbackManager, 'playlistitemadd', handlePlaylistChange);
        Events.on(playbackManager, 'playlistitemchange', handlePlaylistChange);
        Events.on(playbackManager, 'playbackstart', handlePlaybackStart);
        Events.on(playbackManager, 'playbackstop', handlePlaybackStop);

        return () => {
            Events.off(playbackManager, 'playlistitemremove', handlePlaylistChange);
            Events.off(playbackManager, 'playlistitemadd', handlePlaylistChange);
            Events.off(playbackManager, 'playlistitemchange', handlePlaylistChange);
            Events.off(playbackManager, 'playbackstart', handlePlaybackStart);
            Events.off(playbackManager, 'playbackstop', handlePlaybackStop);
        };
    }, [loadQueue]);

    // Sync local seek value when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    const handleSeekChange = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        setLocalSeekValue(value);
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

    const handleRemoveItem = useCallback((item: QueueItem) => {
        const queueManager = (playbackManager as any)._playQueueManager;
        const playlistItemId = (item as any).PlaylistItemId;
        if (queueManager && playlistItemId) {
            queueManager.removeFromPlaylist([playlistItemId]);
            loadQueue();
        }
    }, [loadQueue]);

    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        const queueManager = (playbackManager as any)._playQueueManager;
        if (queueManager && queueManager._playlist) {
            const playlist = queueManager._playlist;
            const [removed] = playlist.splice(fromIndex, 1);
            playlist.splice(toIndex, 0, removed);
            loadQueue();
        }
    }, [loadQueue]);

    // Loading state
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.body'
                }}
            >
                <CircularProgress size="lg" />
                <Typography level="body-lg" sx={{ mt: 2, color: 'neutral.400' }}>
                    {globalize.translate('Loading')}...
                </Typography>
            </Box>
        );
    }

    // Empty state - no current item
    if (!currentItem && queueData.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.body',
                    position: 'relative'
                }}
            >
                <IconButton
                    onClick={() => navigate(-1)}
                    variant="plain"
                    sx={{ position: 'absolute', top: 20, left: 20, color: 'neutral.50' }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <MusicNoteIcon sx={{ fontSize: 80, color: 'neutral.600', mb: 2 }} />
                <Typography level="h4" sx={{ color: 'neutral.400' }}>
                    {globalize.translate('MessageNoItemsAvailable')}
                </Typography>
                <Typography level="body-md" sx={{ color: 'neutral.500', mt: 1 }}>
                    Start playing something to see the queue
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.body', position: 'relative' }}>
            {/* Background gradient */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))',
                    pointerEvents: 'none'
                }}
            />

            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ position: 'relative', zIndex: 1, p: 2 }}
            >
                <IconButton onClick={() => navigate(-1)} variant="plain" sx={{ color: 'neutral.50' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography level="body-sm" sx={{ color: 'neutral.300' }}>
                    {albumName}
                </Typography>
                <IconButton
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                    variant="plain"
                    sx={{ color: showTechnicalInfo ? 'primary.500' : 'neutral.50' }}
                >
                    <InfoIcon />
                </IconButton>
            </Stack>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(_e, val) => setActiveTab(val as number)}
                sx={{ position: 'relative', zIndex: 1 }}
            >
                <TabList
                    sx={{
                        justifyContent: 'center',
                        gap: 2,
                        bgcolor: 'transparent',
                        '& .MuiTab-root': { color: 'neutral.400' },
                        '& .Mui-selected': { color: 'primary.500' }
                    }}
                >
                    <Tab>
                        <AlbumIcon sx={{ mr: 1 }} />
                        Now Playing
                    </Tab>
                    <Tab>
                        <QueueMusicIcon sx={{ mr: 1 }} />
                        Queue ({queueData.length})
                    </Tab>
                </TabList>

                {/* Now Playing Tab */}
                <TabPanel value={0} sx={{ p: 0 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={4}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ p: 4, minHeight: 'calc(100vh - 180px)' }}
                    >
                        {/* Artwork */}
                        <Box sx={{ flex: '0 0 auto' }}>
                            <motion.div layoutId="now-playing-art">
                                <AspectRatio
                                    ratio="1"
                                    sx={{
                                        width: { xs: 280, sm: 320, md: 400 },
                                        borderRadius: 'lg',
                                        overflow: 'hidden',
                                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                        bgcolor: 'neutral.800',
                                    }}
                                >
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'neutral.700' }}>
                                            <MusicNoteIcon sx={{ fontSize: 80, color: 'neutral.400' }} />
                                        </Box>
                                    )}
                                </AspectRatio>
                            </motion.div>
                        </Box>

                        {/* Info and Controls */}
                        <Stack spacing={3} sx={{ flex: '1 1 auto', maxWidth: 500, width: '100%' }}>
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Typography level="h2" sx={{ color: 'neutral.50', fontWeight: 'bold' }}>
                                    {trackName}
                                </Typography>
                                <Typography level="title-md" sx={{ color: 'neutral.300' }}>
                                    {artistName}
                                </Typography>
                            </motion.div>

                            {/* Progress Slider */}
                            <Box>
                                <Slider
                                    min={0}
                                    max={duration || 100}
                                    step={0.1}
                                    value={localSeekValue}
                                    onMouseDown={handleSeekStart}
                                    onTouchStart={handleSeekStart}
                                    onChange={handleSeekChange}
                                    onChangeCommitted={handleSeekEnd}
                                    size="lg"
                                    sx={{
                                        '--Slider-trackSize': '6px',
                                        '--Slider-thumbSize': '16px',
                                        color: 'primary.500',
                                    }}
                                />
                                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>
                                        {currentTimeFormatted}
                                    </Typography>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>
                                        {durationFormatted}
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Playback Buttons */}
                            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                                <IconButton onClick={handlePrevious} variant="plain" size="lg" sx={{ color: 'neutral.50' }}>
                                    <SkipPreviousIcon sx={{ fontSize: 40 }} />
                                </IconButton>
                                <IconButton
                                    onClick={togglePlayPause}
                                    variant="solid"
                                    color="primary"
                                    size="lg"
                                    sx={{ width: 72, height: 72, borderRadius: '50%' }}
                                >
                                    {isPlaying ? <PauseIcon sx={{ fontSize: 40 }} /> : <PlayArrowIcon sx={{ fontSize: 40 }} />}
                                </IconButton>
                                <IconButton onClick={next} variant="plain" size="lg" sx={{ color: 'neutral.50' }}>
                                    <SkipNextIcon sx={{ fontSize: 40 }} />
                                </IconButton>
                            </Stack>

                            {/* Next Up Preview */}
                            {nextItem && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Sheet
                                        variant="soft"
                                        sx={{
                                            p: 2,
                                            borderRadius: 'md',
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <Chip size="sm" variant="soft" color="neutral" sx={{ mb: 1 }}>NEXT UP</Chip>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <AspectRatio ratio="1" sx={{ width: 48, borderRadius: 'sm', overflow: 'hidden' }}>
                                                {nextImageUrl ? (
                                                    <img src={nextImageUrl} alt={nextTrackName} style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <Box sx={{ bgcolor: 'neutral.700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <MusicNoteIcon sx={{ fontSize: 20, color: 'neutral.400' }} />
                                                    </Box>
                                                )}
                                            </AspectRatio>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography level="body-sm" sx={{ color: 'neutral.50', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {nextTrackName}
                                                </Typography>
                                                <Typography level="body-xs" sx={{ color: 'neutral.400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {nextArtistName}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Sheet>
                                </motion.div>
                            )}
                        </Stack>
                    </Stack>
                </TabPanel>

                {/* Queue Tab */}
                <TabPanel value={1} sx={{ p: 0 }}>
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Typography level="h4">
                            {globalize.translate('HeaderPlaybackQueue') || 'Playback Queue'}
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'neutral.400', mt: 1 }}>
                            {queueData.length} {globalize.translate('Items').toLowerCase()}
                        </Typography>
                    </Box>
                    <QueueTable
                        queueData={queueData}
                        currentIndex={currentIndex}
                        onReorder={handleReorder}
                        onRemove={handleRemoveItem}
                        onPlay={handlePlayItem}
                    />
                    <Box sx={{ height: 100 }} />
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
                        <Sheet
                            variant="soft"
                            sx={{
                                p: 3,
                                borderRadius: 'lg',
                                bgcolor: 'rgba(0,0,0,0.9)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <Typography level="title-sm" sx={{ color: 'neutral.50', mb: 2 }}>
                                Technical Stream Info
                            </Typography>
                            <Stack direction="row" spacing={4}>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Codec</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>
                                        {currentItem.streamInfo?.codec?.toUpperCase() || 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Bitrate</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>
                                        {currentItem.streamInfo?.bitrate ? `${Math.round(currentItem.streamInfo.bitrate / 1000)} kbps` : 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Engine</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>Wasm (Next-Gen)</Typography>
                                </Box>
                            </Stack>
                        </Sheet>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default QueuePage;
