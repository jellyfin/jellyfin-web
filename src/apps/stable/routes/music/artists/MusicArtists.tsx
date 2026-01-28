/**
 * Music Artists View
 *
 * Displays music artists with filtering, sorting, and view options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { Text, Heading } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';

import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons';

import { itemsApi, getItems } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { MediaGrid } from 'components/media/MediaGrid';
import { MediaCard } from 'components/media/MediaCard';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { formatArtistName } from 'utils/formatUtils';
import { appRouter } from 'components/router/appRouter';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { toPlayableItems } from 'lib/utils/playbackUtils';

import { logger } from 'utils/logger';
import * as styles from './MusicArtists.css';

type ViewStyle = 'List' | 'Poster';

export const MusicArtists: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`artists-${topParentId}`, 'Poster');
    const [sortBy, setSortBy] = useState('SortName');
    const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');
    const [alphaFilter, setAlphaFilter] = useState<string | null>(null);

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(`artists-${topParentId}`);

    const queryKey = [
        'artists',
        topParentId,
        {
            startIndex: pageIndex * pageSize,
            limit: pageSize,
            sortBy,
            sortOrder,
            recursive: true,
            fields: 'PrimaryImageAspectRatio,SortName,ArtistInfos',
            imageTypeLimit: 1,
            enableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            ...(alphaFilter === '#' ? { nameLessThan: 'A' } : {}),
            ...(alphaFilter && alphaFilter !== '#' ? { nameStartsWith: alphaFilter } : {})
        }
    ];

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            logger.debug('Fetching artists', { component: 'MusicArtists', topParentId });

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

    const handleAlphaChange = useCallback(
        (value: string | null) => {
            setAlphaFilter(value);
            setPageIndex(0);
        },
        [setPageIndex]
    );

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

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const artistId = item.Id;
            if (!artistId) {
                console.warn('[MusicArtists] Artist has no ID');
                return;
            }

            // Fetch artist tracks (limited to 100 per user preference)
            const tracks = await getItems(artistId, {
                includeTypes: ['Audio'],
                recursive: true,
                sortBy: 'Random',
                limit: 100
            });

            if (!tracks.Items || tracks.Items.length === 0) {
                console.warn('[MusicArtists] No tracks found for artist');
                return;
            }

            const playableItems = toPlayableItems(tracks.Items);
            await playbackManagerBridge.setQueue(playableItems, 0);
            await playbackManagerBridge.setShuffleMode('Shuffle');
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[MusicArtists] Failed to play artist', error);
        }
    }, []);

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
        return (
            <EmptyState
                title="No Artists"
                description="No artists found. Add some music to your library to see artists here."
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <Heading.H3>Artists</Heading.H3>
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

            <div className={styles.alphaFilterRow}>
                {[
                    '#',
                    'A',
                    'B',
                    'C',
                    'D',
                    'E',
                    'F',
                    'G',
                    'H',
                    'I',
                    'J',
                    'K',
                    'L',
                    'M',
                    'N',
                    'O',
                    'P',
                    'Q',
                    'R',
                    'S',
                    'T',
                    'U',
                    'V',
                    'W',
                    'X',
                    'Y',
                    'Z'
                ].map(letter => (
                    <Chip
                        key={letter}
                        variant={alphaFilter === letter ? 'primary' : 'soft'}
                        onClick={() => handleAlphaChange(alphaFilter === letter ? null : letter)}
                        className={styles.chipClickable}
                    >
                        {letter}
                    </Chip>
                ))}
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

            <MediaGrid items={artists} onItemClick={handleItemClick} onItemPlay={handleItemPlay} showPlayButtons />
        </div>
    );
};

export default MusicArtists;
