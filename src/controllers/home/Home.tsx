/**
 * Home View
 *
 * React-based home/dashboard view with TanStack Query and Joy UI.
 * Shows user views, resume watching, and recently added content.
 */

import React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardOverflow from '@mui/joy/CardOverflow';
import AspectRatio from '@mui/joy/AspectRatio';
import IconButton from '@mui/joy/IconButton';
import Skeleton from '@mui/joy/Skeleton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import PlayArrow from '@mui/icons-material/PlayArrow';
import ArrowForward from '@mui/icons-material/ArrowForward';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { MediaGrid } from 'components/joy-ui/media';
import { getItems, itemsApi } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

interface HomeSectionProps {
    title: string;
    viewAllLink?: string;
    children: React.ReactNode;
    loading?: boolean;
}

const HomeSection: React.FC<HomeSectionProps> = ({ title, viewAllLink, children, loading }) => {
    const navigate = useNavigate();

    return (
        <Box sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography level="h4">{title}</Typography>
                {viewAllLink && (
                    <Button
                        variant="plain"
                        endDecorator={<ArrowForward />}
                        onClick={() => navigate(viewAllLink)}
                    >
                        View All
                    </Button>
                )}
            </Stack>
            {loading ? (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' },
                        gap: 2,
                    }}
                >
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 'lg' }} />
                    ))}
                </Box>
            ) : (
                children
            )}
        </Box>
    );
};

const getLibraryImageUrl = (item: BaseItemDto): string | null => {
    if (!item.Id) return null;
    const imageTag = item.ImageTags?.Primary;
    if (imageTag) {
        return `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`;
    }
    return null;
};

const LibraryCard: React.FC<{ library: BaseItemDto }> = ({ library }) => {
    const navigate = useNavigate();
    const imageUrl = getLibraryImageUrl(library);

    const handleClick = () => {
        navigate(`/library/${library.Id}`);
    };

    return (
        <Card
            variant="outlined"
            sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'lg',
                },
            }}
            onClick={handleClick}
        >
            <CardOverflow>
                <AspectRatio ratio="16/9">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={library.Name || ''}
                            loading="lazy"
                        />
                    ) : (
                        <Box
                            sx={{
                                bgcolor: 'background.level2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography sx={{ fontSize: 'h3' }}>{library.Name?.charAt(0)}</Typography>
                        </Box>
                    )}
                </AspectRatio>
            </CardOverflow>
            <CardContent sx={{ p: 1.5 }}>
                <Typography level="body-sm" fontWeight="bold" noWrap>
                    {library.Name}
                </Typography>
            </CardContent>
        </Card>
    );
};

const ContinueWatchingCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
    const handlePlay = () => {
        playbackManagerBridge.playItem(item);
    };

    const progress = item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
        ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
        : 0;

    const imageTag = item.ImageTags?.Primary;
    const imageUrl = item.Id && imageTag
        ? `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`
        : null;

    return (
        <Card
            variant="outlined"
            sx={{
                width: 280,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'lg',
                },
            }}
        >
            <CardOverflow>
                <AspectRatio ratio="16/9">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={item.Name || ''}
                            loading="lazy"
                        />
                    ) : (
                        <Box
                            sx={{
                                bgcolor: 'background.level2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography>{item.Name?.charAt(0)}</Typography>
                        </Box>
                    )}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: 'rgba(0,0,0,0.5)',
                        }}
                    >
                        <Box
                            sx={{
                                width: `${progress}%`,
                                height: '100%',
                                bgcolor: 'primary.500',
                            }}
                        />
                    </Box>
                    <IconButton
                        size="lg"
                        variant="solid"
                        color="primary"
                        onClick={handlePlay}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            opacity: 0.9,
                        }}
                    >
                        <PlayArrow fontSize="large" />
                    </IconButton>
                </AspectRatio>
            </CardOverflow>
            <CardContent sx={{ p: 1.5 }}>
                <Typography level="body-sm" fontWeight="bold" noWrap>
                    {item.Name}
                </Typography>
                <Typography level="body-xs" color="neutral">
                    {item.SeriesName || `${Math.round(progress)}% watched`}
                </Typography>
            </CardContent>
        </Card>
    );
};

export const Home: React.FC = () => {
    const navigate = useNavigate();

    const { data: userViews, isLoading: viewsLoading } = useQuery({
        queryKey: queryKeys.userViews,
        queryFn: () => itemsApi.getUserViews(),
    });

    const { data: resumeItems, isLoading: resumeLoading } = useQuery({
        queryKey: queryKeys.resumeItems(),
        queryFn: () => getItems('', {
            Recursive: true,
            Filters: ['IsResumable'],
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            Limit: 10,
            Fields: 'PrimaryImageAspectRatio,UserData,SeriesInfo',
            ImageTypeLimit: 1,
        }),
    });

    const { data: latestMovies, isLoading: latestMoviesLoading } = useQuery({
        queryKey: queryKeys.latestItems('', 'Movie'),
        queryFn: () => getItems('', {
            IncludeItemTypes: 'Movie',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 10,
            Fields: 'PrimaryImageAspectRatio',
            ImageTypeLimit: 1,
        }),
    });

    const { data: latestShows, isLoading: latestShowsLoading } = useQuery({
        queryKey: queryKeys.latestItems('', 'Series'),
        queryFn: () => getItems('', {
            IncludeItemTypes: 'Series',
            Recursive: true,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            Limit: 10,
            Fields: 'PrimaryImageAspectRatio',
            ImageTypeLimit: 1,
        }),
    });

    return (
        <Box className="view-content" sx={{ pb: 8 }}>
            <Box sx={{ p: 2 }}>
                <Typography level="h2" sx={{ mb: 1 }}>
                    Welcome back
                </Typography>
                <Typography level="body-lg" color="neutral">
                    What would you like to watch today?
                </Typography>
            </Box>

            {resumeItems?.Items && resumeItems.Items.length > 0 && (
                <HomeSection title="Continue Watching" loading={resumeLoading}>
                    <Stack direction="row" spacing={2} overflow="auto" sx={{ pb: 1 }}>
                        {resumeItems.Items.map(item => (
                            <ContinueWatchingCard key={item.Id || Math.random()} item={item} />
                        ))}
                    </Stack>
                </HomeSection>
            )}

            <HomeSection title="Your Libraries" loading={viewsLoading}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' },
                        gap: 2,
                    }}
                >
                    {userViews?.map(library => (
                        <LibraryCard key={library.Id || Math.random()} library={library} />
                    ))}
                </Box>
            </HomeSection>

            <HomeSection title="Recently Added Movies" viewAllLink="/movies" loading={latestMoviesLoading}>
                <MediaGrid
                    items={latestMovies?.Items || []}
                    viewMode="grid"
                    loading={latestMoviesLoading}
                    totalCount={latestMovies?.TotalRecordCount || 0}
                    cardSize="medium"
                />
            </HomeSection>

            <HomeSection title="Recently Added TV Shows" viewAllLink="/tvshows" loading={latestShowsLoading}>
                <MediaGrid
                    items={latestShows?.Items || []}
                    viewMode="grid"
                    loading={latestShowsLoading}
                    totalCount={latestShows?.TotalRecordCount || 0}
                    cardSize="medium"
                />
            </HomeSection>
        </Box>
    );
};

export default Home;
