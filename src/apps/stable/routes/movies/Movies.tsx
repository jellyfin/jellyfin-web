/**
 * Movies View
 *
 * React-based movies browsing view with TanStack Query and ui-primitives.
 */

import React, { useState, useCallback } from 'react';
import { PlayIcon, ShuffleIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'motion/react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { useFilterStore } from 'store/filterStore';
import { useSortStore } from 'store/sortStore';
import { useListStore } from 'store/listStore';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { appRouter } from 'components/router/appRouter';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Paper } from 'ui-primitives/Paper';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { Card } from 'ui-primitives/Card';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { vars } from 'styles/tokens.css';

interface MovieCardWithPlayProps {
    item: BaseItemDto;
    imageTag?: string;
    onPlay: () => void;
    onClick: () => void;
}

const MovieCardWithPlay: React.FC<MovieCardWithPlayProps> = ({ item, imageTag, onPlay, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);

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
                    {imageTag && (
                        <img
                            src={`/api/Items/${item.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`}
                            alt={item.Name || ''}
                            loading="lazy"
                        />
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
                                onClick={e => {
                                    e.stopPropagation();
                                    onPlay();
                                }}
                                aria-label="Play movie"
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

export const Movies: React.FC = () => {
    const { topParentId } = useParams({ strict: false }) as { topParentId?: string };
    const { viewMode, setViewMode } = useListStore();
    const { genres, years, studios, genresMode } = useFilterStore();
    const { sortBy, sortOrder } = useSortStore();

    const [sortOpen, setSortOpen] = useState(false);

    const queryKey = queryKeys.items(topParentId, {
        includeTypes: ['Movie'],
        recursive: true,
        sortBy: sortBy,
        sortOrder: sortOrder,
        genres: genres,
        genreIds: genres,
        years: years,
        studios: studios,
        genresMode: genresMode
    });

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () =>
            getItems(topParentId ?? '', {
                includeTypes: ['Movie'],
                recursive: true,
                sortBy: sortBy,
                sortOrder: sortOrder,
                genres: genres.length > 0 ? genres : undefined,
                genreIds: genres.length > 0 ? genres : undefined,
                years: years.length > 0 ? years : undefined,
                studios: studios.length > 0 ? studios : undefined,
                genresMode: genresMode
            }),
        enabled: !!topParentId
    });

    const handlePlayAll = () => {
        if (data?.Items?.[0]) {
            const playableItem = data.Items[0] as any;
            playbackManagerBridge.setQueue([playableItem], 0);
            playbackManagerBridge.play();
        }
    };

    const handleShuffle = () => {
        if (data?.Items) {
            const shuffledItems = [...data.Items].sort(() => Math.random() - 0.5) as any[];
            playbackManagerBridge.setQueue(shuffledItems, 0);
            playbackManagerBridge.play();
        }
    };

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[Movies] Failed to play movie', error);
        }
    }, []);

    const hasActiveFilters = genres.length > 0 || years.length > 0 || studios.length > 0;

    if (error) {
        return (
            <Box style={{ padding: vars.spacing['6'], textAlign: 'center' }}>
                <Text color="error">Error loading movies</Text>
            </Box>
        );
    }

    return (
        <Box className="view-content">
            <Box style={{ padding: vars.spacing['5'], borderBottom: `1px solid ${vars.colors.divider}` }}>
                <Flex
                    style={{
                        flexDirection: 'row',
                        gap: vars.spacing['5'],
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing['4'], alignItems: 'center' }}>
                        <Button
                            variant="primary"
                            startDecorator={<PlayIcon />}
                            onClick={handlePlayAll}
                            disabled={!data?.Items?.length}
                        >
                            Play All
                        </Button>
                        <Button
                            variant="outlined"
                            startDecorator={<ShuffleIcon />}
                            onClick={handleShuffle}
                            disabled={!data?.Items?.length}
                        >
                            Shuffle
                        </Button>
                    </Flex>
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing['4'], alignItems: 'center' }}>
                        <Button
                            variant={hasActiveFilters ? 'primary' : 'outlined'}
                            color={hasActiveFilters ? 'primary' : 'neutral'}
                        >
                            Filter
                        </Button>
                        <Button variant="outlined" onClick={() => setSortOpen(true)}>
                            Sort
                        </Button>
                        <Flex style={{ flexDirection: 'row', gap: vars.spacing['2'] }}>
                            <IconButton
                                variant="solid"
                                color="primary"
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                            >
                                <Box
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 2
                                    }}
                                >
                                    <Box style={{ width: 8, height: 8, backgroundColor: 'currentColor' }} />
                                    <Box style={{ width: 8, height: 8, backgroundColor: 'currentColor' }} />
                                    <Box style={{ width: 8, height: 8, backgroundColor: 'currentColor' }} />
                                    <Box style={{ width: 8, height: 8, backgroundColor: 'currentColor' }} />
                                </Box>
                            </IconButton>
                            <IconButton
                                variant="solid"
                                color="primary"
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                            >
                                <Box
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2
                                    }}
                                >
                                    <Box style={{ width: 16, height: 2, backgroundColor: 'currentColor' }} />
                                    <Box style={{ width: 16, height: 2, backgroundColor: 'currentColor' }} />
                                    <Box style={{ width: 16, height: 2, backgroundColor: 'currentColor' }} />
                                </Box>
                            </IconButton>
                        </Flex>
                    </Flex>
                </Flex>
            </Box>

            {hasActiveFilters && (
                <Box
                    style={{
                        paddingLeft: vars.spacing['5'],
                        paddingRight: vars.spacing['5'],
                        paddingTop: vars.spacing['4'],
                        backgroundColor: vars.colors.backgroundAlt
                    }}
                >
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing['4'], flexWrap: 'wrap' }}>
                        {genres.map(genre => (
                            <Paper
                                key={genre}
                                style={{
                                    paddingLeft: vars.spacing['4'],
                                    paddingRight: vars.spacing['4'],
                                    paddingTop: vars.spacing['2'],
                                    paddingBottom: vars.spacing['2'],
                                    borderRadius: 16
                                }}
                            >
                                <Text size="xs">{genre}</Text>
                            </Paper>
                        ))}
                        {years.map(year => (
                            <Paper
                                key={year}
                                style={{
                                    paddingLeft: vars.spacing['4'],
                                    paddingRight: vars.spacing['4'],
                                    paddingTop: vars.spacing['2'],
                                    paddingBottom: vars.spacing['2'],
                                    borderRadius: 16
                                }}
                            >
                                <Text size="xs">{year}</Text>
                            </Paper>
                        ))}
                        {studios.map(studio => (
                            <Paper
                                key={studio}
                                style={{
                                    paddingLeft: vars.spacing['4'],
                                    paddingRight: vars.spacing['4'],
                                    paddingTop: vars.spacing['2'],
                                    paddingBottom: vars.spacing['2'],
                                    borderRadius: 16
                                }}
                            >
                                <Text size="xs">{studio}</Text>
                            </Paper>
                        ))}
                    </Flex>
                </Box>
            )}

            <Box style={{ padding: vars.spacing['5'] }}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {data?.Items?.map(item => {
                        const itemAny = item as any;
                        return (
                            <MovieCardWithPlay
                                key={item.Id}
                                item={item}
                                imageTag={itemAny.PrimaryImageTag}
                                onPlay={() => handleItemPlay(item)}
                                onClick={() => handleItemClick(item)}
                            />
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default Movies;
