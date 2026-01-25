/**
 * Genres View
 *
 * Displays all genres with item counts and navigation.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { itemsApi } from 'lib/api/items';
import { usePagination } from 'hooks/usePagination';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { Card, CardBody } from 'ui-primitives/Card';
import { Text, Heading } from 'ui-primitives/Text';
import { Chip } from 'ui-primitives/Chip';
import { IconButton } from 'ui-primitives/IconButton';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

import { logger } from 'utils/logger';
import * as styles from './Genres.css';

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

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '16px' }}>
                {genres.map(genre => (
                    <Card key={genre.Name} interactive className={styles.genreCard}>
                        <div
                            className={styles.cardCoverGradient}
                            style={{
                                background: `linear-gradient(135deg, hsl(${(genre.Name.charCodeAt(0) * 10) % 360}, 60%, 40%), hsl(${(genre.Name.charCodeAt(0) * 10 + 60) % 360}, 60%, 30%))`
                            }}
                        />
                        <CardBody className={styles.cardContent}>
                            <div className={styles.cardTitle}>{genre.Name}</div>
                            <div className={styles.cardSubtitle}>
                                {genre.ItemCount} item{genre.ItemCount !== 1 ? 's' : ''}
                            </div>
                        </CardBody>
                    </Card>
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
