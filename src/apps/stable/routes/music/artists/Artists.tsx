/**
 * Artists View
 *
 * Main artists browser displaying all music artists.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { MediaGrid } from 'components/media/MediaGrid';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { Text, Heading } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Chip } from 'ui-primitives';

import { CaretSortIcon, ChevronLeftIcon, ChevronRightIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons';

import { logger } from 'utils/logger';
import { formatArtistName } from 'utils/formatUtils';
import * as styles from './Artists.css.ts';

type ViewStyle = 'List' | 'Poster';
type SortOption = 'Name' | 'AlbumCount' | 'SongCount' | 'PlayCount' | 'DateAdded';

export const Artists: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`artists-${topParentId}`, 'Poster');
    const [sortBy, setSortBy] = useState<SortOption>('Name');
    const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `artists-all-${topParentId}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['artists-all', topParentId, { pageIndex, pageSize, sortBy, sortOrder }],
        queryFn: async () => {
            logger.debug('Fetching all artists', { component: 'Artists', topParentId });

            return itemsApi.getArtists({
                parentId: topParentId,
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                sortBy,
                sortOrder,
                recursive: true
            });
        },
        staleTime: 5 * 60 * 1000
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
        return <LoadingSpinner message="Loading artists..." />;
    }

    if (isError) {
        return (
            <ErrorState message={error instanceof Error ? error.message : 'Failed to load artists'} onRetry={refetch} />
        );
    }

    const artists = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    if (artists.length === 0) {
        return <EmptyState title="No Artists" description="Add music to your library to see artists here." />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <Heading.H3>Artists</Heading.H3>
                <div className={styles.controlsContainer}>
                    <div className={styles.sortControl}>
                        <CaretSortIcon />
                        <select
                            value={sortBy}
                            onChange={e => {
                                setSortBy(e.target.value as SortOption);
                                setPageIndex(0);
                            }}
                            className={styles.sortSelect}
                        >
                            <option value="Name">Name</option>
                            <option value="AlbumCount">Albums</option>
                            <option value="SongCount">Songs</option>
                            <option value="PlayCount">Plays</option>
                            <option value="DateAdded">Recently Added</option>
                        </select>
                    </div>
                    <div className={styles.viewToggleGroup}>
                        <IconButton
                            variant={viewStyle === 'List' ? 'solid' : 'plain'}
                            onClick={() => setViewStyle('List')}
                            size="sm"
                        >
                            <ListBulletIcon />
                        </IconButton>
                        <IconButton
                            variant={viewStyle === 'Poster' ? 'solid' : 'plain'}
                            onClick={() => setViewStyle('Poster')}
                            size="sm"
                        >
                            <GridIcon />
                        </IconButton>
                    </div>
                </div>
            </div>

            <div className={styles.paginationRow}>
                <Text size="sm" color="secondary">
                    {totalCount} artist{totalCount !== 1 ? 's' : ''}
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

            <MediaGrid items={artists} />
        </div>
    );
};

export default Artists;
