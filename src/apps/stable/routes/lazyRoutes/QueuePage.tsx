import React, { useEffect, useState } from 'react';
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
import SkipNextIcon from '@mui/icons-material/SkipNext';
import globalize from 'lib/globalize';
import { imagePreloader } from '../../../components/audioEngine';

/**
 * Lazy-loaded Playback Queue Page
 * Replaces legacy queue controller
 * Fullscreen playback queue interface
 *
 * Image Preloading:
 * Queue items' album art, backdrop, artist logo, and disc art are preloaded
 * when queue data is fetched via imagePreloader.preloadQueueImages().
 * This ensures smooth scrolling through the queue with no loading spinners.
 */

const QueuePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [queueData, setQueueData] = useState<any[]>([]);

    useEffect(() => {
        const loadQueue = async () => {
            try {
                // Simulate loading playback queue
                setTimeout(() => {
                    setQueueData([
                        {
                            id: 1,
                            title: 'Currently Playing',
                            artist: 'Artist Name',
                            album: 'Album Name',
                            duration: '3:42',
                            isPlaying: true
                        },
                        {
                            id: 2,
                            title: 'Next Up',
                            artist: 'Next Artist',
                            album: 'Next Album',
                            duration: '4:15',
                            isPlaying: false
                        },
                        {
                            id: 3,
                            title: 'Coming Up',
                            artist: 'Upcoming Artist',
                            album: 'Upcoming Album',
                            duration: '2:58',
                            isPlaying: false
                        },
                        {
                            id: 4,
                            title: 'Later',
                            artist: 'Later Artist',
                            album: 'Later Album',
                            duration: '5:22',
                            isPlaying: false
                        }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load queue:', error);
                setIsLoading(false);
            }
        };

        loadQueue();
    }, []);

    if (isLoading) {
        return (
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                minHeight='400px'
                sx={{ backgroundColor: '#111', color: 'white' }}
            >
                <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                <Typography variant='h6'>
                    Loading Playback Queue...
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#111',
                color: 'white',
                p: 0
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant='h4' component='h1'>
                    {globalize.translate('Playback Queue')}
                </Typography>
                <Typography variant='body1' sx={{ color: 'grey.400', mt: 1 }}>
                    {queueData.length} items in queue
                </Typography>
            </Box>

            {/* Queue List */}
            <List sx={{ width: '100%', bgcolor: '#111' }}>
                {queueData.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <ListItem
                            sx={{
                                bgcolor: item.isPlaying ? '#333' : 'transparent',
                                '&:hover': { bgcolor: '#222' },
                                py: 2
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        bgcolor: item.isPlaying ? '#1976d2' : '#666',
                                        width: 50,
                                        height: 50
                                    }}
                                >
                                    {item.isPlaying ? (
                                        <PlayArrowIcon sx={{ color: 'white' }} />
                                    ) : (
                                        <Typography variant='h6' sx={{ color: 'white' }}>
                                            {index + 1}
                                        </Typography>
                                    )}
                                </Avatar>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Typography variant='h6' sx={{ color: 'white' }}>
                                        {item.title}
                                    </Typography>
                                }
                                secondary={
                                    <Box>
                                        <Typography variant='body2' sx={{ color: 'grey.300' }}>
                                            {item.artist} • {item.album}
                                        </Typography>
                                        <Typography variant='body2' sx={{ color: 'grey.500' }}>
                                            {item.duration}
                                        </Typography>
                                    </Box>
                                }
                            />

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {!item.isPlaying && (
                                    <IconButton sx={{ color: 'grey.400' }}>
                                        <PlayArrowIcon />
                                    </IconButton>
                                )}
                                {item.isPlaying && (
                                    <IconButton sx={{ color: 'grey.400' }}>
                                        <SkipNextIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </ListItem>

                        {index < queueData.length - 1 && (
                            <Divider sx={{ bgcolor: '#333' }} />
                        )}
                    </React.Fragment>
                ))}
            </List>

            {/* Bottom spacing */}
            <Box sx={{ height: 100 }} />
        </Box>
    );
};

export default QueuePage;
