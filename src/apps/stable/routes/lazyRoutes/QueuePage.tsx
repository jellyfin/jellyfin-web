import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import List from '@mui/material/List/List';
import ListItem from '@mui/material/ListItem/ListItem';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar/ListItemAvatar';
import Avatar from '@mui/material/Avatar/Avatar';
import Divider from '@mui/material/Divider/Divider';
import IconButton from '@mui/material/IconButton/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import Events from 'utils/events';
import { ServerConnections } from 'lib/jellyfin-apiclient';

interface QueueItem {
    Id: string;
    Name: string;
    Artists?: string[];
    AlbumArtist?: string;
    Album?: string;
    RunTimeTicks?: number;
    ImageTags?: { Primary?: string };
    ServerId?: string;
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

    const getImageUrl = (item: QueueItem): string | undefined => {
        if (item.ImageTags?.Primary && item.ServerId) {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            return apiClient.getScaledImageUrl(item.Id, {
                type: 'Primary',
                tag: item.ImageTags.Primary,
                maxWidth: 100
            });
        }
        return undefined;
    };

    const handlePlayItem = useCallback((item: QueueItem) => {
        if (item.Id) {
            // Play the specific item from the queue
            void playbackManager.play({
                ids: [item.Id],
                serverId: item.ServerId,
                startPositionTicks: 0
            });
        }
    }, []);

    const handleRemoveItem = useCallback((item: QueueItem) => {
        // Access the internal queue manager to remove by PlaylistItemId
        const queueManager = (playbackManager as any)._playQueueManager;
        const playlistItemId = (item as any).PlaylistItemId;
        if (queueManager && playlistItemId) {
            queueManager.removeFromPlaylist([playlistItemId]);
            loadQueue(); // Refresh queue display
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
            {/* Header */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant='h4' component='h1'>
                    {globalize.translate('HeaderPlaybackQueue') || 'Playback Queue'}
                </Typography>
                <Typography variant='body1' sx={{ color: 'grey.400', mt: 1 }}>
                    {queueData.length} {globalize.translate('Items').toLowerCase()}
                </Typography>
            </Box>

            {/* Queue List */}
            <List sx={{ width: '100%', bgcolor: 'transparent' }}>
                {queueData.map((item, index) => {
                    const isPlaying = index === currentIndex;
                    const imageUrl = getImageUrl(item);
                    const artist = item.Artists?.[0] || item.AlbumArtist || '';

                    return (
                        <React.Fragment key={`${item.Id}-${index}`}>
                            <ListItem
                                sx={{
                                    bgcolor: isPlaying ? 'rgba(0, 164, 220, 0.15)' : 'transparent',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                    py: 1.5,
                                    cursor: 'pointer'
                                }}
                                onClick={() => handlePlayItem(item)}
                            >
                                <Box sx={{ mr: 1, color: 'grey.600', display: 'flex', alignItems: 'center' }}>
                                    <DragIndicatorIcon fontSize='small' />
                                </Box>

                                <ListItemAvatar>
                                    <Avatar
                                        src={imageUrl}
                                        sx={{
                                            bgcolor: isPlaying ? '#00a4dc' : '#444',
                                            width: 50,
                                            height: 50
                                        }}
                                    >
                                        {isPlaying ? (
                                            <PlayArrowIcon sx={{ color: 'white' }} />
                                        ) : (
                                            <Typography variant='body2' sx={{ color: 'white' }}>
                                                {index + 1}
                                            </Typography>
                                        )}
                                    </Avatar>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={
                                        <Typography
                                            variant='body1'
                                            sx={{
                                                color: isPlaying ? '#00a4dc' : 'white',
                                                fontWeight: isPlaying ? 600 : 400
                                            }}
                                        >
                                            {item.Name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant='body2' sx={{ color: 'grey.400' }}>
                                                {artist}{item.Album ? ` • ${item.Album}` : ''}
                                            </Typography>
                                        </Box>
                                    }
                                />

                                <Typography variant='body2' sx={{ color: 'grey.500', mr: 2 }}>
                                    {formatDuration(item.RunTimeTicks)}
                                </Typography>

                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveItem(item);
                                    }}
                                    sx={{ color: 'grey.500', '&:hover': { color: 'error.main' } }}
                                    size='small'
                                >
                                    <DeleteIcon fontSize='small' />
                                </IconButton>
                            </ListItem>

                            {index < queueData.length - 1 && (
                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </List>

            {/* Bottom spacing for nowPlayingBar */}
            <Box sx={{ height: 100 }} />
        </Box>
    );
};

export default QueuePage;
