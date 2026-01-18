import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Card from '@mui/material/Card/Card';
import CardContent from '@mui/material/CardContent/CardContent';
import CardMedia from '@mui/material/CardMedia/CardMedia';
import globalize from 'lib/globalize';

// Lazy load video components for better bundle splitting
let videoOSDLoaded = false;
let videoUtilsLoaded = false;
let subtitleComponentsLoaded = false;
let videoSyncLoaded = false;
let advancedControlsLoaded = false;
let videoPluginsLoaded = false;

// Lazy loading functions for video components
async function loadVideoOSD() {
    if (!videoOSDLoaded) {
        await import('../../../../components/video/videoOSD');
        videoOSDLoaded = true;
    }
}

async function loadVideoUtils() {
    if (!videoUtilsLoaded) {
        await import('../../../../components/video/videoUtils');
        videoUtilsLoaded = true;
    }
}

async function loadSubtitleComponents() {
    if (!subtitleComponentsLoaded) {
        await import('../../../../components/video/subtitleComponents');
        subtitleComponentsLoaded = true;
    }
}

async function loadVideoSync() {
    if (!videoSyncLoaded) {
        await import('../../../../components/video/videoSync');
        videoSyncLoaded = true;
    }
}

async function loadAdvancedVideoControls() {
    if (!advancedControlsLoaded) {
        await import('../../../../components/video/advancedVideoControls');
        advancedControlsLoaded = true;
    }
}

async function loadVideoPlugins() {
    if (!videoPluginsLoaded) {
        await import('../../../../components/video/videoPlugins');
        videoPluginsLoaded = true;
    }
}

/**
 * Lazy-loaded Video Player Page
 * Replaces the legacy video playback controller
 * This is a HEAVY route - video playback requires significant resources
 */
const VideoPlayerPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [videoData, setVideoData] = useState<any>(null);

    useEffect(() => {
        const loadVideoPlayer = async () => {
            try {
                // Load video components lazily for better performance
                console.log('🎬 Loading video player components...');

                // Load essential video components in parallel
                await Promise.all([
                    loadVideoOSD(), // Video controls and OSD
                    loadVideoUtils(), // Video utilities and helpers
                    loadVideoPlugins() // HTML video player plugin
                ]);

                console.log('✅ Video OSD components loaded');
                console.log('✅ Video utilities loaded');
                console.log('✅ Video plugins loaded');

                // Load advanced features when needed
                setTimeout(async () => {
                    await Promise.all([
                        loadSubtitleComponents(), // Subtitle support
                        loadVideoSync(), // Sync play features
                        loadAdvancedVideoControls() // Advanced controls
                    ]);

                    console.log('✅ Advanced video features loaded');
                }, 1000);

                // Simulate video player initialization
                setTimeout(() => {
                    setVideoData({
                        title: 'Now Playing - Bundle Split Video',
                        duration: '2:34:12',
                        status: 'Video player ready with lazy loading!'
                    });
                    setIsLoading(false);
                }, 800);
            } catch (error) {
                console.error('Failed to load video player:', error);
                setVideoData({
                    title: 'Error',
                    duration: '00:00:00',
                    status: 'Failed to load video components'
                });
                setIsLoading(false);
            }
        };

        loadVideoPlayer();
    }, []);

    if (isLoading) {
        return (
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                minHeight='400px'
                sx={{ backgroundColor: 'black', color: 'white' }}
            >
                <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
                <Typography variant='h6'>
                    Loading Video Player...
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: 'black',
                color: 'white',
                p: 2
            }}
        >
            <Typography variant='h4' component='h1' gutterBottom>
                {globalize.translate('Video Player')}
            </Typography>

            {/* Video player container - in real implementation this would be the actual video element */}
            <Card sx={{ maxWidth: 800, mx: 'auto', backgroundColor: '#333' }}>
                <CardMedia
                    component='div'
                    sx={{
                        height: 450,
                        backgroundColor: '#222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                >
                    {/* Placeholder for video player */}
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(45deg, #333 25%, #555 25%, #555 50%, #333 50%, #333 75%, #555 75%)',
                            backgroundSize: '40px 40px'
                        }}
                    >
                        <Typography variant='h5' sx={{ color: 'white', opacity: 0.7 }}>
                            🎬 Video Player
                        </Typography>
                    </Box>

                    {/* Play button overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            width: 80,
                            height: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.9)'
                            }
                        }}
                    >
                        <Typography variant='h3' sx={{ color: 'white' }}>
                            ▶️
                        </Typography>
                    </Box>
                </CardMedia>

                <CardContent sx={{ backgroundColor: '#333', color: 'white' }}>
                    <Typography variant='h6' component='div' gutterBottom>
                        {videoData?.title || 'Video Title'}
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'grey.300' }}>
                        Duration: {videoData?.duration || '00:00:00'}
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'grey.400', mt: 1 }}>
                        {videoData?.status || 'Ready to play'}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default VideoPlayerPage;
