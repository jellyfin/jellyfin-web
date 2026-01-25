/**
 * Home View
 *
 * React-based home/dashboard view with TanStack Query and ui-primitives.
 * Shows user views, resume watching, and recently added content.
 */

import React from 'react';
import { ArrowRightIcon, PlayIcon } from '@radix-ui/react-icons';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { getItems, itemsApi } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { Card } from 'ui-primitives/Card';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { IconButton } from 'ui-primitives/IconButton';
import { Skeleton } from 'ui-primitives/Skeleton';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

interface HomeSectionProps {
    title: string;
    viewAllLink?: string;
    children: React.ReactNode;
    loading?: boolean;
}

const HomeSection: React.FC<HomeSectionProps> = ({ title, viewAllLink, children, loading }) => {
    const navigate = useNavigate();

    return (
        <Box style={{ marginBottom: vars.spacing.xl }}>
            <Flex
                style={{
                    flexDirection: 'row',
                    gap: vars.spacing.md,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: vars.spacing.md
                }}
            >
                <Heading.H4>{title}</Heading.H4>
                {viewAllLink && (
                    <IconButton variant="plain" onClick={() => navigate({ to: viewAllLink })}>
                        View All <ArrowRightIcon />
                    </IconButton>
                )}
            </Flex>
            {loading ? (
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={200}
                            style={{ borderRadius: vars.borderRadius.lg }}
                        />
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
        navigate({ to: `/library/${library.Id}` });
    };

    return (
        <Card
            style={{
                cursor: 'pointer',
                transition: vars.transitions.normal
            }}
            onClick={handleClick}
        >
            <AspectRatio ratio="16/9">
                {imageUrl ? (
                    <img src={imageUrl} alt={library.Name || ''} loading="lazy" />
                ) : (
                    <Box
                        style={{
                            backgroundColor: vars.colors.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Heading.H3>{library.Name?.charAt(0)}</Heading.H3>
                    </Box>
                )}
            </AspectRatio>
            <Box style={{ padding: vars.spacing.sm }}>
                <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                    {library.Name}
                </Text>
            </Box>
        </Card>
    );
};

const ContinueWatchingCard: React.FC<{ item: BaseItemDto }> = ({ item }) => {
    const handlePlay = () => {
        const playableItem = item as any;
        playbackManagerBridge.setQueue([playableItem], 0);
        playbackManagerBridge.play();
    };

    const progress =
        item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
            ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
            : 0;

    const imageTag = item.ImageTags?.Primary;
    const imageUrl = item.Id && imageTag ? `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400` : null;

    return (
        <Card
            style={{
                width: 280,
                cursor: 'pointer',
                transition: vars.transitions.normal
            }}
        >
            <AspectRatio ratio="16/9">
                {imageUrl ? (
                    <img src={imageUrl} alt={item.Name || ''} loading="lazy" />
                ) : (
                    <Box
                        style={{
                            backgroundColor: vars.colors.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text>{item.Name?.charAt(0)}</Text>
                    </Box>
                )}
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                >
                    <Box
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: vars.colors.primary
                        }}
                    />
                </Box>
                <IconButton
                    size="lg"
                    variant="solid"
                    onClick={handlePlay}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        opacity: 0.9
                    }}
                >
                    <PlayIcon style={{ width: 24, height: 24 }} />
                </IconButton>
            </AspectRatio>
            <Box style={{ padding: vars.spacing.sm }}>
                <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                    {item.Name}
                </Text>
                <Text size="xs" color="secondary">
                    {item.SeriesName || `${Math.round(progress)}% watched`}
                </Text>
            </Box>
        </Card>
    );
};

export const Home: React.FC = () => {
    const navigate = useNavigate();

    const { data: userViews, isLoading: viewsLoading } = useQuery({
        queryKey: queryKeys.userViews,
        queryFn: () => itemsApi.getUserViews()
    });

    const { data: resumeItems, isLoading: resumeLoading } = useQuery({
        queryKey: queryKeys.resumeItems(),
        queryFn: () =>
            getItems('', {
                recursive: true,
                filters: ['IsResumable'],
                sortBy: 'DatePlayed',
                sortOrder: 'Descending',
                limit: 10
            })
    });

    const { data: latestMovies, isLoading: latestMoviesLoading } = useQuery({
        queryKey: queryKeys.latestItems('', 'Movie'),
        queryFn: () =>
            getItems('', {
                includeTypes: ['Movie'],
                recursive: true,
                sortBy: 'DateCreated',
                sortOrder: 'Descending',
                limit: 10
            })
    });

    const { data: latestShows, isLoading: latestShowsLoading } = useQuery({
        queryKey: queryKeys.latestItems('', 'Series'),
        queryFn: () =>
            getItems('', {
                includeTypes: ['Series'],
                recursive: true,
                sortBy: 'DateCreated',
                sortOrder: 'Descending',
                limit: 10
            })
    });

    return (
        <Box className="view-content" style={{ paddingBottom: vars.spacing.xl }}>
            <Box style={{ padding: vars.spacing.md }}>
                <Heading.H2 style={{ marginBottom: vars.spacing.sm }}>Welcome back</Heading.H2>
                <Text size="lg" color="secondary">
                    What would you like to watch today?
                </Text>
            </Box>

            {resumeItems?.Items && resumeItems.Items.length > 0 && (
                <HomeSection title="Continue Watching" loading={resumeLoading}>
                    <Flex
                        style={{
                            flexDirection: 'row',
                            gap: vars.spacing.md,
                            overflow: 'auto',
                            paddingBottom: vars.spacing.sm
                        }}
                    >
                        {resumeItems.Items.map(item => (
                            <ContinueWatchingCard key={item.Id || Math.random()} item={item} />
                        ))}
                    </Flex>
                </HomeSection>
            )}

            <HomeSection title="Your Libraries" loading={viewsLoading}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {userViews?.map(library => (
                        <LibraryCard key={library.Id || Math.random()} library={library} />
                    ))}
                </Box>
            </HomeSection>

            <HomeSection title="Recently Added Movies" viewAllLink="/movies" loading={latestMoviesLoading}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {latestMovies?.Items?.map(item => (
                        <LibraryCard key={item.Id || Math.random()} library={item} />
                    ))}
                </Box>
            </HomeSection>

            <HomeSection title="Recently Added TV Shows" viewAllLink="/tvshows" loading={latestShowsLoading}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {latestShows?.Items?.map(item => (
                        <LibraryCard key={item.Id || Math.random()} library={item} />
                    ))}
                </Box>
            </HomeSection>
        </Box>
    );
};

export default Home;
