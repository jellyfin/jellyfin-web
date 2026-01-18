import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Grid from '@mui/material/Grid/Grid';
import Card from '@mui/material/Card/Card';
import CardContent from '@mui/material/CardContent/CardContent';
import CardMedia from '@mui/material/CardMedia/CardMedia';
import Pagination from '@mui/material/Pagination/Pagination';
import FormControl from '@mui/material/FormControl/FormControl';
import Select from '@mui/material/Select/Select';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import InputLabel from '@mui/material/InputLabel/InputLabel';
import globalize from 'lib/globalize';

/**
 * Lazy-loaded List Page
 * Replaces the legacy list controller
 * Generic list view for displaying collections of items with pagination and sorting
 */
const ListPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [listData, setListData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('name');
    const [totalPages] = useState(5);

    useEffect(() => {
        const loadListData = async () => {
            try {
                // Simulate loading list items with pagination
                setTimeout(() => {
                    const items = Array.from({ length: 20 }, (_, i) => ({
                        id: i + 1 + ((currentPage - 1) * 20),
                        title: `Item ${i + 1 + ((currentPage - 1) * 20)}`,
                        type: ['Movie', 'TV Show', 'Music'][i % 3],
                        year: 2020 + (i % 4),
                        rating: (3 + Math.random() * 2).toFixed(1)
                    }));

                    setListData(items);
                    setIsLoading(false);
                }, 300);
            } catch (error) {
                console.error('Failed to load list data:', error);
                setIsLoading(false);
            }
        };

        loadListData();
    }, [currentPage, sortBy]);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
    };

    const handleSortChange = (event: any) => {
        setSortBy(event.target.value);
        setCurrentPage(1);
        setIsLoading(true);
    };

    if (isLoading) {
        return (
            <Box
                display='flex'
                justifyContent='center'
                alignItems='center'
                minHeight='400px'
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant='h4' component='h1' gutterBottom>
                    {globalize.translate('Media Library')}
                </Typography>

                {/* Controls */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label='Sort By'
                            onChange={handleSortChange}
                        >
                            <MenuItem value='name'>Name</MenuItem>
                            <MenuItem value='year'>Year</MenuItem>
                            <MenuItem value='rating'>Rating</MenuItem>
                            <MenuItem value='dateAdded'>Date Added</MenuItem>
                        </Select>
                    </FormControl>

                    <Typography variant='body2' color='text.secondary'>
                        {listData.length} items • Page {currentPage} of {totalPages}
                    </Typography>
                </Box>
            </Box>

            {/* Items Grid */}
            <Grid container spacing={3}>
                {listData.map((item) => (
                    <Grid key={item.id} item xs={12} sm={6} md={4} lg={3}>
                        <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' } }}>
                            <CardMedia
                                component='div'
                                sx={{
                                    height: 200,
                                    backgroundColor: 'grey.300',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}
                            >
                                <Typography variant='h6' color='text.secondary'>
                                    {item.type === 'Movie' ? '🎬' : item.type === 'TV Show' ? '📺' : '🎵'}
                                </Typography>

                                {/* Rating badge */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        bgcolor: 'rgba(0,0,0,0.7)',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ⭐ {item.rating}
                                </Box>
                            </CardMedia>

                            <CardContent>
                                <Typography variant='h6' component='div' noWrap gutterBottom>
                                    {item.title}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant='body2' color='text.secondary'>
                                        {item.year}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {item.type}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color='primary'
                    size='large'
                />
            </Box>
        </Box>
    );
};

export default ListPage;
