/**
 * Music Playlists View
 *
 * Displays music playlists with filtering and sorting options.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { Text, Heading } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';

import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { MediaGrid } from 'components/joy-ui/media/MediaGrid';
import { MediaCard } from 'components/joy-ui/media/MediaCard';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';

import { logger } from 'utils/logger';
import * as styles from './MusicPlaylists.css';

export const MusicPlaylists: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`playlists-${topParentId}`, 'Poster');
    const [sortBy, setSortBy] = useState('SortName');
    const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `playlists-${topParentId}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['playlists', topParentId, { pageIndex, pageSize, sortBy, sortOrder }],
        queryFn: async () => {
            logger.debug('Fetching playlists', { component: 'MusicPlaylists', topParentId });

            return itemsApi.getItems(topParentId, {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                sortBy,
                sortOrder,
                recursive: true,
                includeTypes: ['Playlist']
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
        return <LoadingSpinner message="Loading playlists..." />;
    }

    if (isError) {
        return (
            <ErrorState
                message={error instanceof Error ? error.message : 'Failed to load playlists'}
                onRetry={refetch}
            />
        );
    }

    const playlists = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    if (playlists.length === 0) {
        return (
            <EmptyState
                title="No Playlists"
                description="No playlists found. Create playlists in your Jellyfin library to see them here."
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <Heading.H3>Playlists</Heading.H3>
                <div className={styles.headerControls}>
                    <IconButton variant={viewStyle === 'List' ? 'solid' : 'plain'} onClick={() => setViewStyle('List')}>
                        <ListBulletIcon />
                    </IconButton>
                    <IconButton
                        variant={viewStyle === 'Poster' ? 'solid' : 'plain'}
                        onClick={() => setViewStyle('Poster')}
                    >
                        <GridIcon />
                    </IconButton>
                </div>
            </div>

            <div className={styles.paginationRow}>
                <Text size="sm" color="secondary">
                    {totalCount} playlist{totalCount !== 1 ? 's' : ''}
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

            <MediaGrid items={playlists} />
        </div>
    );
};

export default MusicPlaylists;
