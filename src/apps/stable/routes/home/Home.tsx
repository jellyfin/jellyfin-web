/**
 * Home View
 *
 * React-based home/dashboard view with TanStack Query and ui-primitives.
 * Shows user views, resume watching, and recently added content.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { ArrowRightIcon, PlayIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { appRouter } from 'components/router/appRouter';

import { getItems, itemsApi } from 'lib/api/items';
import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import { queryKeys } from 'lib/queryKeys';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useState } from 'react';
import { useConnectionStore } from 'store/connectionStore';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { vars } from 'styles/tokens.css.ts';
import { AspectRatio, Box, Card, Flex, Heading, IconButton, Skeleton, Text } from 'ui-primitives';

interface HomeSectionProps {
    title: string;
    viewAllLink?: string;
    children: React.ReactNode;
    loading?: boolean;
}

const HomeSection: React.FC<HomeSectionProps> = ({ title, viewAllLink, children, loading }) => {
    const navigate = useNavigate();

    return (
        <Box style={{ marginBottom: vars.spacing['7'] }}>
            <Flex
                style={{
                    flexDirection: 'row',
                    gap: vars.spacing['5'],
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: vars.spacing['5']
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
                        gap: vars.spacing['5']
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
            <Box style={{ padding: vars.spacing['4'] }}>
                <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                    {library.Name}
                </Text>
            </Box>
        </Card>
    );
};

interface RecentlyAddedCardProps {
    item: BaseItemDto;
    onPlay: () => void;
    onClick: () => void;
}

const RecentlyAddedCard: React.FC<RecentlyAddedCardProps> = ({ item, onPlay, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);
    const imageTag = item.ImageTags?.Primary;
    const imageUrl =
        item.Id && imageTag
            ? `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`
            : null;

    return (
        <motion.div
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            style={{ position: 'relative' }}
        >
            <Card
                style={{
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onClick={onClick}
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
                            <Heading.H3>{item.Name?.charAt(0)}</Heading.H3>
                        </Box>
                    )}
                </AspectRatio>
                <Box style={{ padding: vars.spacing['4'] }}>
                    <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                        {item.Name}
                    </Text>
                </Box>

                <AnimatePresence>
                    {isHovering && (
                        <motion.div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(2px)'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <IconButton
                                variant="solid"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay();
                                }}
                                aria-label="Play item"
                            >
                                <PlayIcon />
                            </IconButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
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
    const imageUrl =
        item.Id && imageTag
            ? `/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`
            : null;

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
            <Box style={{ padding: vars.spacing['4'] }}>
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
    const { currentState, currentUserId } = useConnectionStore();

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[Home] Failed to play item', error);
        }
    }, []);

    const { data: userViews, isLoading: viewsLoading } = useQuery({
        queryKey: queryKeys.userViews,
        queryFn: () => itemsApi.getUserViews(),
        enabled: currentState === ConnectionState.SignedIn && !!currentUserId
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
            }),
        enabled: currentState === ConnectionState.SignedIn && !!currentUserId
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
            }),
        enabled: currentState === ConnectionState.SignedIn && !!currentUserId
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
            }),
        enabled: currentState === ConnectionState.SignedIn && !!currentUserId
    });

    return (
        <Box className="view-content" style={{ paddingBottom: vars.spacing['7'] }}>
            <Box style={{ padding: vars.spacing['5'] }}>
                <Heading.H2 style={{ marginBottom: vars.spacing['4'] }}>Welcome back</Heading.H2>
                <Text size="lg" color="secondary">
                    What would you like to watch today?
                </Text>
            </Box>

            {resumeItems?.Items && resumeItems.Items.length > 0 && (
                <HomeSection title="Continue Watching" loading={resumeLoading}>
                    <Flex
                        style={{
                            flexDirection: 'row',
                            gap: vars.spacing['5'],
                            overflow: 'auto',
                            paddingBottom: vars.spacing['4']
                        }}
                    >
                        {resumeItems.Items.map((item) => (
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
                        gap: vars.spacing['5']
                    }}
                >
                    {userViews?.map((library) => (
                        <LibraryCard key={library.Id || Math.random()} library={library} />
                    ))}
                </Box>
            </HomeSection>

            <HomeSection
                title="Recently Added Movies"
                viewAllLink="/movies"
                loading={latestMoviesLoading}
            >
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {latestMovies?.Items?.map((item) => (
                        <RecentlyAddedCard
                            key={item.Id || Math.random()}
                            item={item}
                            onPlay={() => handleItemPlay(item)}
                            onClick={() => handleItemClick(item)}
                        />
                    ))}
                </Box>
            </HomeSection>

            <HomeSection
                title="Recently Added TV Shows"
                viewAllLink="/tvshows"
                loading={latestShowsLoading}
            >
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {latestShows?.Items?.map((item) => (
                        <RecentlyAddedCard
                            key={item.Id || Math.random()}
                            item={item}
                            onPlay={() => handleItemPlay(item)}
                            onClick={() => handleItemClick(item)}
                        />
                    ))}
                </Box>
            </HomeSection>
        </Box>
    );
};

export default Home;
