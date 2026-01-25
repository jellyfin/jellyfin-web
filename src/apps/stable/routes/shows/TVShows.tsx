/**
 * TV Shows View
 *
 * React-based TV shows browsing view with TanStack Query and ui-primitives.
 */

import React, { useState } from 'react';
import { PlayIcon, ShuffleIcon } from '@radix-ui/react-icons';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { useFilterStore } from 'store/filterStore';
import { useSortStore } from 'store/sortStore';
import { useListStore } from 'store/listStore';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Paper } from 'ui-primitives/Paper';
import { Card } from 'ui-primitives/Card';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const TVShows: React.FC = () => {
    const { topParentId } = useParams({ strict: false }) as { topParentId?: string };
    const { viewMode, setViewMode } = useListStore();
    const { genres, years, studios, genresMode } = useFilterStore();
    const { sortBy, sortOrder } = useSortStore();

    const [sortOpen, setSortOpen] = useState(false);

    const queryKey = queryKeys.items(topParentId, {
        includeTypes: ['Series'],
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
                includeTypes: ['Series'],
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

    const hasActiveFilters = genres.length > 0 || years.length > 0 || studios.length > 0;

    if (error) {
        return (
            <Box style={{ padding: vars.spacing.lg, textAlign: 'center' }}>
                <Text color="error">Error loading TV shows</Text>
            </Box>
        );
    }

    return (
        <Box className="view-content">
            <Box style={{ padding: vars.spacing.md, borderBottom: `1px solid ${vars.colors.divider}` }}>
                <Flex
                    style={{
                        flexDirection: 'row',
                        gap: vars.spacing.md,
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing.sm, alignItems: 'center' }}>
                        <Button variant="primary" onClick={handlePlayAll} disabled={!data?.Items?.length}>
                            <PlayIcon style={{ marginRight: vars.spacing.xs }} /> Play
                        </Button>
                        <Button variant="outlined" onClick={handleShuffle} disabled={!data?.Items?.length}>
                            <ShuffleIcon style={{ marginRight: vars.spacing.xs }} /> Shuffle
                        </Button>
                    </Flex>
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing.sm, alignItems: 'center' }}>
                        <Button
                            variant={hasActiveFilters ? 'primary' : 'outlined'}
                            color={hasActiveFilters ? 'primary' : 'neutral'}
                        >
                            Filter
                        </Button>
                        <Button variant="outlined" onClick={() => setSortOpen(true)}>
                            Sort
                        </Button>
                        <Flex style={{ flexDirection: 'row', gap: vars.spacing.xs }}>
                            <IconButton
                                variant={viewMode === 'grid' ? 'solid' : 'plain'}
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
                                variant={viewMode === 'list' ? 'solid' : 'plain'}
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
                        paddingLeft: vars.spacing.md,
                        paddingRight: vars.spacing.md,
                        paddingTop: vars.spacing.sm,
                        backgroundColor: vars.colors.backgroundAlt
                    }}
                >
                    <Flex style={{ flexDirection: 'row', gap: vars.spacing.sm, flexWrap: 'wrap' }}>
                        {genres.map(genre => (
                            <Paper
                                key={genre}
                                style={{
                                    paddingLeft: vars.spacing.sm,
                                    paddingRight: vars.spacing.sm,
                                    paddingTop: vars.spacing.xs,
                                    paddingBottom: vars.spacing.xs,
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
                                    paddingLeft: vars.spacing.sm,
                                    paddingRight: vars.spacing.sm,
                                    paddingTop: vars.spacing.xs,
                                    paddingBottom: vars.spacing.xs,
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
                                    paddingLeft: vars.spacing.sm,
                                    paddingRight: vars.spacing.sm,
                                    paddingTop: vars.spacing.xs,
                                    paddingBottom: vars.spacing.xs,
                                    borderRadius: 16
                                }}
                            >
                                <Text size="xs">{studio}</Text>
                            </Paper>
                        ))}
                    </Flex>
                </Box>
            )}

            <Box style={{ padding: vars.spacing.md }}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {data?.Items?.map(item => {
                        const itemAny = item as any;
                        return (
                            <Card key={item.Id} style={{ cursor: 'pointer' }}>
                                <AspectRatio ratio="16/9">
                                    {itemAny.PrimaryImageTag && (
                                        <img
                                            src={`/api/Items/${item.Id}/Images/Primary?tag=${itemAny.PrimaryImageTag}&maxWidth=400`}
                                            alt={item.Name || ''}
                                            loading="lazy"
                                        />
                                    )}
                                </AspectRatio>
                                <Box style={{ padding: vars.spacing.sm }}>
                                    <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                        {item.Name}
                                    </Text>
                                </Box>
                            </Card>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default TVShows;
