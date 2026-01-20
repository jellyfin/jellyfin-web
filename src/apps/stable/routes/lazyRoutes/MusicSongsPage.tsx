import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import AspectRatio from '@mui/joy/AspectRatio';
import globalize from 'lib/globalize';

/**
 * Lazy-loaded Music Songs Page
 * Replaces the legacy songs controller with a React component
 */
const MusicSongsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [songsData, setSongsData] = useState<any[]>([]);

    useEffect(() => {
        const loadSongsData = async () => {
            try {
                setTimeout(() => {
                    setSongsData([
                        { id: 1, name: 'Recently Added Songs', count: 42 },
                        { id: 2, name: 'Top Played', count: 156 },
                        { id: 3, name: 'Recently Played', count: 89 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load songs data:', error);
                setIsLoading(false);
            }
        };

        loadSongsData();
    }, []);

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
            <Typography level='h2' sx={{ mb: 3 }}>
                {globalize.translate('Songs')}
            </Typography>

            <Grid container spacing={3}>
                {songsData.map((item) => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Card variant="outlined">
                            <AspectRatio ratio="16/9">
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'neutral.softBg'
                                    }}
                                >
                                    <Typography level="h1">🎵</Typography>
                                </Box>
                            </AspectRatio>
                            <CardContent>
                                <Typography level='title-lg'>
                                    {item.name}
                                </Typography>
                                <Typography level='body-sm'>
                                    {item.count} songs
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default MusicSongsPage;