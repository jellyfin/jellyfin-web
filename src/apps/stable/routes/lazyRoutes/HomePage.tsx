import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import AspectRatio from '@mui/joy/AspectRatio';
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
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography level='h2' sx={{ mb: 4 }}>
                {globalize.translate('Home')}
            </Typography>

            {homeData.map((section) => (
                <Box key={section.id} sx={{ mb: 4 }}>
                    <Typography level='h4' sx={{ mb: 2 }}>
                        {section.name}
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Placeholder cards - in real implementation these would show actual media items */}
                        {Array.from({ length: Math.min(section.count, 6) }, (_, i) => (
                            <Grid key={`${section.id}-${i}`} xs={12} sm={6} md={4} lg={2}>
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
                                    <Card
                                        variant="plain"
                                        sx={{
                                            bgcolor: 'transparent',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.05)',
                                                bgcolor: 'background.surface'
                                            }
                                        }}
                                    >
                                        <AspectRatio ratio="2/3">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: 'neutral.softBg',
                                                    borderRadius: 'md'
                                                }}
                                            >
                                                <Typography level="h1">
                                                    {section.route?.includes('music') ? '🎵' :
                                                        section.route?.includes('movies') ? '🎬' :
                                                            section.route?.includes('tv') ? '📺' : '📺'}
                                                </Typography>
                                            </Box>
                                        </AspectRatio>
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography level='body-sm' noWrap>
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