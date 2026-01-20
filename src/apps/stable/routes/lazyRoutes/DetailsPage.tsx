import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import AspectRatio from '@mui/joy/AspectRatio';
import Grid from '@mui/joy/Grid';
import Chip from '@mui/joy/Chip';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QueueIcon from '@mui/icons-material/Queue';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import globalize from 'lib/globalize';

/**
 * Lazy-loaded Item Details Page
 * Replaces the legacy itemDetails controller
 * Frequently accessed route - shows detailed information about media items
 */
const DetailsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [itemData, setItemData] = useState<any>(null);

    useEffect(() => {
        const loadItemDetails = async () => {
            try {
                // Simulate loading item details
                setTimeout(() => {
                    setItemData({
                        title: 'Sample Movie Title',
                        year: 2023,
                        rating: 4.5,
                        runtime: '2h 15m',
                        genres: ['Action', 'Adventure', 'Sci-Fi'],
                        description: 'This is a detailed description of the movie. It provides comprehensive information about the plot, cast, and production details that help users decide whether to watch it.',
                        cast: ['Actor One', 'Actor Two', 'Actor Three'],
                        director: 'Director Name',
                        studio: 'Studio Productions',
                        parentalRating: 'PG-13',
                        communityRating: 8.2
                    });
                    setIsLoading(false);
                }, 400);
            } catch (error) {
                console.error('Failed to load item details:', error);
                setIsLoading(false);
            }
        };

        loadItemDetails();
    }, []);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px'
                }}
            >
                <CircularProgress thickness={4} sx={{ '--CircularProgress-size': '60px' }} />
            </Box>
        );
    }

    if (!itemData) {
        return (
            <Box p={3}>
                <Typography color='danger'>
                    Failed to load item details
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Grid container spacing={4}>
                {/* Poster/Artwork */}
                <Grid xs={12} md={4}>
                    <Card variant="outlined" sx={{ maxWidth: 300, mx: 'auto' }}>
                        <AspectRatio ratio="2/3">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'neutral.softBg'
                                }}
                            >
                                <Typography level="h1">🎬</Typography>
                            </Box>
                        </AspectRatio>
                    </Card>
                </Grid>

                {/* Details */}
                <Grid xs={12} md={8}>
                    <Box>
                        {/* Title and Year */}
                        <Typography level='h1' sx={{ mb: 1 }}>
                            {itemData.title}
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Typography level='title-lg' color='neutral'>
                                {itemData.year}
                            </Typography>
                            <Typography level='body-md'>
                                {itemData.runtime}
                            </Typography>
                            <Chip size='sm' variant="soft" color="neutral">
                                {itemData.parentalRating}
                            </Chip>
                        </Stack>

                        {/* Rating */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <StarIcon color="warning" />
                            <Typography level="title-md">
                                {itemData.communityRating}/10
                            </Typography>
                        </Stack>

                        {/* Genres */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                            {itemData.genres.map((genre: string) => (
                                <Chip
                                    key={genre}
                                    variant='outlined'
                                    color="primary"
                                    size="md"
                                >
                                    {genre}
                                </Chip>
                            ))}
                        </Stack>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <Button
                                size='lg'
                                startDecorator={<PlayArrowIcon />}
                                sx={{ px: 4 }}
                            >
                                Play
                            </Button>
                            <Button
                                variant='outlined'
                                size='lg'
                                color="neutral"
                                startDecorator={<QueueIcon />}
                            >
                                Queue
                            </Button>
                            <Button
                                variant='plain'
                                size='lg'
                                color="danger"
                                startDecorator={<FavoriteIcon />}
                            >
                                Favorite
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        {/* Description */}
                        <Typography level='title-lg' sx={{ mb: 1 }}>
                            Overview
                        </Typography>
                        <Typography level='body-md' sx={{ lineHeight: 1.6, mb: 3 }}>
                            {itemData.description}
                        </Typography>

                        {/* Cast & Crew */}
                        <Grid container spacing={3}>
                            <Grid xs={12} sm={6}>
                                <Typography level='title-md' sx={{ mb: 1 }}>
                                    Cast
                                </Typography>
                                <Stack spacing={0.5}>
                                    {itemData.cast.map((actor: string) => (
                                        <Typography key={actor} level='body-sm'>
                                            {actor}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <Typography level='title-md' sx={{ mb: 1 }}>
                                    Director
                                </Typography>
                                <Typography level='body-sm' sx={{ mb: 2 }}>
                                    {itemData.director}
                                </Typography>

                                <Typography level='title-md' sx={{ mb: 1 }}>
                                    Studio
                                </Typography>
                                <Typography level='body-sm'>
                                    {itemData.studio}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DetailsPage;