/**
 * Genres View
 *
 * Displays all genres with item counts and navigation.
 */

import { vars } from 'styles/tokens.css.ts';

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { itemsApi } from 'lib/api/items';
import { usePagination } from 'hooks/usePagination';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { Card, CardBody } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Chip } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@radix-ui/react-icons';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { toPlayableItem, toVideoItem } from 'lib/utils/playbackUtils';

import { logger } from 'utils/logger';
import * as styles from './Genres.css.ts';

interface GenreItem {
    Name: string;
    ItemCount: number;
    ImageTags?: {
        Primary?: string;
    };
    Id?: string;
}

export const Genres: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string; genreType?: string };
    const topParentId = params.topParentId || '';
    const genreType = params.genreType || 'music';

    const [hoveredGenreName, setHoveredGenreName] = useState<string | null>(null);
    const [playingGenreName, setPlayingGenreName] = useState<string | null>(null);

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `genres-${topParentId}-${genreType}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['genres', topParentId, genreType, pageIndex],
        queryFn: async () => {
            logger.debug('Fetching genres', { component: 'Genres', topParentId, genreType });

            return itemsApi.getItems(topParentId, {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                recursive: true,
                includeTypes: ['MusicGenre', 'Genre']
            });
        },
        staleTime: 10 * 60 * 1000
    });

    const handleNextPage = useCallback(() => {
        if (hasNextPage) {
            setPageIndex(prev => prev + 1);
        }
    }, [hasNextPage, setPageIndex]);

    const handlePreviousPage = useCallback(() => {
        if (hasPreviousPage && pageIndex > 0) {
            setPageIndex(prev => prev - 1);
        }
    }, [hasPreviousPage, pageIndex, setPageIndex]);

    const isAudioGenre = (genreTypeVal: string): boolean => {
        return genreTypeVal === 'music';
    };

    const handleGenrePlay = useCallback(
        async (genreName: string) => {
            try {
                setPlayingGenreName(genreName);
                // Fetch items in the genre
                const items = await itemsApi.getItems(topParentId, {
                    recursive: true,
                    includeTypes: genreType === 'music' ? ['Audio'] : genreType === 'tv' ? ['Series', 'Episode'] : ['Movie'],
                    genres: [genreName],
                    limit: 100
                });

                if (!items.Items || items.Items.length === 0) {
                    logger.warn('[Genres] No items found for genre', { genreName });
                    setPlayingGenreName(null);
                    return;
                }

                // Convert items to playable format
                const playableItems = items.Items.map((item: BaseItemDto) =>
                    isAudioGenre(genreType) ? toPlayableItem(item) : toVideoItem(item)
                );

                await playbackManagerBridge.setQueue(playableItems, 0);
                await playbackManagerBridge.play();
                setPlayingGenreName(null);
            } catch (err) {
                logger.error('[Genres] Failed to play genre', { genreName, error: err });
                setPlayingGenreName(null);
            }
        },
        [genreType, topParentId]
    );

    if (isLoading) {
        return <LoadingSpinner message="Loading genres..." />;
    }

    if (isError) {
        return (
            <ErrorState message={error instanceof Error ? error.message : 'Failed to load genres'} onRetry={refetch} />
        );
    }

    const genres: GenreItem[] = (data?.Items || []).map(item => ({
        Name: item.Name || 'Unknown',
        ItemCount: item.ChildCount || 0,
        ImageTags: item.ImageTags || undefined,
        Id: item.Id
    }));

    const totalCount = data?.TotalRecordCount || 0;

    if (genres.length === 0) {
        return (
            <EmptyState
                title="No Genres"
                description="Add music or movies with genre information to see genres here."
            />
        );
    }

    const columns = Math.min(6, Math.max(2, Math.floor(window.innerWidth / 250)));

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <Heading.H3>{genreType === 'music' ? 'Music Genres' : 'Genres'}</Heading.H3>
                <div className={styles.chipGroup}>
                    <Chip variant={genreType === 'music' ? 'primary' : 'neutral'}>Music</Chip>
                    <Chip variant={genreType === 'movies' ? 'primary' : 'neutral'}>Movies</Chip>
                    <Chip variant={genreType === 'tv' ? 'primary' : 'neutral'}>TV</Chip>
                </div>
            </div>

            <div className={styles.paginationRow}>
                <Text size="sm" color="secondary">
                    {totalCount} genre{totalCount !== 1 ? 's' : ''}
                </Text>
                {(hasPreviousPage || hasNextPage) && (
                    <div className={styles.paginationControls}>
                        <IconButton
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={!hasPreviousPage || pageIndex === 0}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <Chip size="sm">{pageIndex + 1}</Chip>
                        <IconButton size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
                            <ChevronRightIcon />
                        </IconButton>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: vars.spacing['4'] }}>
                {genres.map(genre => (
                    <div
                        key={genre.Name}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setHoveredGenreName(genre.Name)}
                        onMouseLeave={() => setHoveredGenreName(null)}
                    >
                        <Card interactive className={styles.genreCard}>
                            <div
                                className={styles.cardCoverGradient}
                                style={{
                                    background: `linear-gradient(135deg, hsl(${(genre.Name.charCodeAt(0) * 10) % 360}, 60%, 40%), hsl(${(genre.Name.charCodeAt(0) * 10 + 60) % 360}, 60%, 30%))`,
                                    position: 'relative'
                                }}
                            >
                                {hoveredGenreName === genre.Name && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            left: 0,
                                            backgroundColor: 'rgba(0,0,0,0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 'inherit'
                                        }}
                                    >
                                        <IconButton
                                            size="lg"
                                            variant="solid"
                                            disabled={playingGenreName === genre.Name}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                handleGenrePlay(genre.Name);
                                            }}
                                            style={{ borderRadius: '50%' }}
                                        >
                                            <PlayIcon />
                                        </IconButton>
                                    </div>
                                )}
                            </div>
                            <CardBody className={styles.cardContent}>
                                <div className={styles.cardTitle}>{genre.Name}</div>
                                <div className={styles.cardSubtitle}>
                                    {genre.ItemCount} item{genre.ItemCount !== 1 ? 's' : ''}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>

            <div className={styles.bottomPaginationContainer}>
                {(hasPreviousPage || hasNextPage) && (
                    <div className={styles.paginationControls}>
                        <IconButton onClick={handlePreviousPage} disabled={!hasPreviousPage || pageIndex === 0}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <Chip>{pageIndex + 1}</Chip>
                        <IconButton onClick={handleNextPage} disabled={!hasNextPage}>
                            <ChevronRightIcon />
                        </IconButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Genres;
