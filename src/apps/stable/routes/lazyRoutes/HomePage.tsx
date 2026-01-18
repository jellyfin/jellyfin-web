import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Grid from '@mui/material/Grid/Grid';
import Card from '@mui/material/Card/Card';
import CardContent from '@mui/material/CardContent/CardContent';
import CardMedia from '@mui/material/CardMedia/CardMedia';
import globalize from 'lib/globalize';
import { usePredictivePreloading, useHoverPreloading } from '../../../../hooks/usePredictivePreloading';

/**
 * Lazy-loaded Home Page
 * Replaces the legacy home controller with a React component
 * This is the main entry point - CRITICAL for performance!
 */
const HomePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [homeData, setHomeData] = useState<any[]>([]);
    const { preloadManually } = usePredictivePreloading({
        preferredContentType: 'mixed',
        timeOfDay: new Date().getHours() >= 18 ? 'evening' : 'morning'
    });
    const { preloadOnHover } = useHoverPreloading();

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                // Simulate loading home sections (recently added, continue watching, etc.)
                setTimeout(() => {
                    setHomeData([
                        { id: 1, name: 'Continue Watching', type: 'resume', count: 12, route: '/video' },
                        { id: 2, name: 'Recently Added', type: 'recent', count: 45, route: '/movies' },
                        { id: 3, name: 'My List', type: 'favorites', count: 23, route: '/music' }
                    ]);
                    setIsLoading(false);

                    // Predictive preload based on user context
                    preloadManually(['/music', '/movies', '/tv']);
                }, 200); // Fast loading for home page
            } catch (error) {
                console.error('Failed to load home data:', error);
                setIsLoading(false);
            }
        };

        loadHomeData();
    }, [preloadManually]);

    if (isLoading) {
        return (
            <Box
                display='flex'
                justifyContent='center'
                alignItems='center'
                minHeight='200px'
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
                {globalize.translate('Home')}
            </Typography>

            {homeData.map((section) => (
                <Box key={section.id} sx={{ mb: 4 }}>
                    <Typography variant='h5' component='h2' gutterBottom sx={{ mb: 2 }}>
                        {section.name}
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Placeholder cards - in real implementation these would show actual media items */}
                        {Array.from({ length: Math.min(section.count, 6) }, (_, i) => (
                            <Grid key={`${section.id}-${i}`} item xs={12} sm={6} md={4} lg={2}>
                                <Link
                                    to={section.route || '#'}
                                    style={{ textDecoration: 'none' }}
                                    onMouseEnter={() => {
                                        // Predictive preload on hover for instant navigation
                                        if (section.route) {
                                            preloadOnHover(section.route, 'route');
                                        }
                                    }}
                                >
                                    <Card sx={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                                        <CardMedia
                                            component='div'
                                            sx={{
                                                height: 120,
                                                backgroundColor: 'grey.300',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Typography variant='h6' color='text.secondary'>
                                                {section.route?.includes('music') ? '🎵' :
                                                    section.route?.includes('movies') ? '🎬' :
                                                        section.route?.includes('tv') ? '📺' : '📺'}
                                            </Typography>
                                        </CardMedia>
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography variant='body2' noWrap>
                                                Media Item {i + 1}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}
        </Box>
    );
};

export default HomePage;
