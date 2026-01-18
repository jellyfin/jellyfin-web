import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Grid from '@mui/material/Grid/Grid';
import Card from '@mui/material/Card/Card';
import CardContent from '@mui/material/CardContent/CardContent';
import CardMedia from '@mui/material/CardMedia/CardMedia';
import globalize from 'lib/globalize';

const EpisodesPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [episodesData, setEpisodesData] = useState<any[]>([]);

    useEffect(() => {
        const loadEpisodesData = async () => {
            try {
                setTimeout(() => {
                    setEpisodesData([
                        { id: 1, name: 'Latest Episodes', count: 45 },
                        { id: 2, name: 'Unwatched', count: 123 },
                        { id: 3, name: 'Recently Added', count: 89 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load episodes data:', error);
                setIsLoading(false);
            }
        };
        loadEpisodesData();
    }, []);

    if (isLoading) {
        return (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant='h4' component='h1' gutterBottom>
                {globalize.translate('Episodes')}
            </Typography>
            <Grid container spacing={3}>
                {episodesData.map((item) => (
                    <Grid key={item.id} item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ height: '100%' }}>
                            <CardMedia component='div' sx={{ height: 140, backgroundColor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant='h6' color='text.secondary'>🎬</Typography>
                            </CardMedia>
                            <CardContent>
                                <Typography variant='h6' component='div'>{item.name}</Typography>
                                <Typography variant='body2' color='text.secondary'>{item.count} episodes</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default EpisodesPage;
