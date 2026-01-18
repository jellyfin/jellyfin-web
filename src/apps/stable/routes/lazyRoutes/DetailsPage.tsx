import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Card from '@mui/material/Card/Card';
import CardContent from '@mui/material/CardContent/CardContent';
import CardMedia from '@mui/material/CardMedia/CardMedia';
import Grid from '@mui/material/Grid/Grid';
import Chip from '@mui/material/Chip/Chip';
import Button from '@mui/material/Button/Button';
import Rating from '@mui/material/Rating/Rating';
import Divider from '@mui/material/Divider/Divider';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QueueIcon from '@mui/icons-material/Queue';
import FavoriteIcon from '@mui/icons-material/Favorite';
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
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (!itemData) {
        return (
            <Box p={3}>
                <Typography variant="h6" color="error">
                    Failed to load item details
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Grid container spacing={4}>
                {/* Poster/Artwork */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ maxWidth: 300, mx: 'auto' }}>
                        <CardMedia
                            component="div"
                            sx={{
                                height: 450,
                                backgroundColor: 'grey.300',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="h4" color="text.secondary">
                                🎬
                            </Typography>
                        </CardMedia>
                    </Card>
                </Grid>

                {/* Details */}
                <Grid item xs={12} md={8}>
                    <Box>
                        {/* Title and Year */}
                        <Typography variant="h3" component="h1" gutterBottom>
                            {itemData.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" color="text.secondary">
                                {itemData.year}
                            </Typography>
                            <Typography variant="body1">
                                {itemData.runtime}
                            </Typography>
                            <Chip label={itemData.parentalRating} size="small" />
                        </Box>

                        {/* Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Rating value={itemData.rating} readOnly precision={0.5} />
                            <Typography variant="body2" color="text.secondary">
                                ({itemData.communityRating}/10)
                            </Typography>
                        </Box>

                        {/* Genres */}
                        <Box sx={{ mb: 3 }}>
                            {itemData.genres.map((genre: string) => (
                                <Chip
                                    key={genre}
                                    label={genre}
                                    sx={{ mr: 1, mb: 1 }}
                                    variant="outlined"
                                />
                            ))}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PlayArrowIcon />}
                                sx={{ minWidth: 140 }}
                            >
                                Play
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<QueueIcon />}
                            >
                                Add to Queue
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<FavoriteIcon />}
                            >
                                Favorite
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Description */}
                        <Typography variant="h6" gutterBottom>
                            Overview
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
                            {itemData.description}
                        </Typography>

                        {/* Cast & Crew */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Cast
                                </Typography>
                                {itemData.cast.map((actor: string) => (
                                    <Typography key={actor} variant="body2" paragraph>
                                        {actor}
                                    </Typography>
                                ))}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Director
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    {itemData.director}
                                </Typography>

                                <Typography variant="h6" gutterBottom>
                                    Studio
                                </Typography>
                                <Typography variant="body2" paragraph>
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