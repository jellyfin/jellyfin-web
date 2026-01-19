import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import Events from 'utils/events';
import { QueueTable } from './QueueTable';

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
 * Playback Queue Page
 * Shows the current playback queue with ability to remove items and jump to tracks
 */
const QueuePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [queueData, setQueueData] = useState<QueueItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

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
            console.error('Failed to load queue:', error);
            setQueueData([]);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueue();

        // Listen for queue changes
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

    const formatDuration = (ticks?: number): string => {
        if (!ticks) return '--:--';
        const totalSeconds = Math.floor(ticks / 10000000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    if (isLoading) {
        return (
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                minHeight='400px'
                sx={{ backgroundColor: 'var(--background, #111)', color: 'white' }}
            >
                <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                <Typography variant='h6'>
                    {globalize.translate('Loading')}...
                </Typography>
            </Box>
        );
    }

    if (queueData.length === 0) {
        return (
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                minHeight='400px'
                sx={{ backgroundColor: 'var(--background, #111)', color: 'white' }}
            >
                <Typography variant='h6'>
                    {globalize.translate('MessageNoItemsAvailable')}
                </Typography>
                <Typography variant='body2' sx={{ color: 'grey.400', mt: 1 }}>
                    Start playing something to see the queue
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: 'var(--background, #111)',
                color: 'white',
                p: 0
            }}
        >
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant='h4' component='h1'>
                    {globalize.translate('HeaderPlaybackQueue') || 'Playback Queue'}
                </Typography>
                <Typography variant='body1' sx={{ color: 'grey.400', mt: 1 }}>
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
        </Box>
    );
};

export default QueuePage;
