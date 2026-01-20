import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import AspectRatio from '@mui/joy/AspectRatio';
import globalize from 'lib/globalize';

const LiveTVChannelsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setTimeout(() => {
                    setData([
                        { id: 1, name: 'Local News', count: 12 },
                        { id: 2, name: 'Sports Channel', count: 8 },
                        { id: 3, name: 'Movie Network', count: 15 }
                    ]);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load data:', error);
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography level="h2" sx={{ mb: 3 }}>
                {globalize.translate('Channels')}
            </Typography>
            <Grid container spacing={3}>
                {data.map((item) => (
                    <Grid key={item.id} xs={12} sm={6} md={4} lg={3}>
                        <Card variant="outlined">
                            <AspectRatio ratio="1">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'neutral.softBg' }}>
                                    <Typography level="h1">📺</Typography>
                                </Box>
                            </AspectRatio>
                            <CardContent>
                                <Typography level="title-lg">{item.name}</Typography>
                                <Typography level="body-sm">{item.count} programs</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default LiveTVChannelsPage;