/**
 * Movies Recommended View
 *
 * Displays movie recommendations with sections for latest, resume, and suggested.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { Box, Flex } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';
import { Divider } from 'ui-primitives/Divider';
import { vars } from 'styles/tokens.css';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { MediaGrid } from 'components/media/MediaGrid';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { appRouter } from 'components/router/appRouter';
import { toVideoItem } from 'lib/utils/playbackUtils';

import { logger } from 'utils/logger';

type ViewStyle = 'List' | 'Poster';

const PlayArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2l10 6-10 6V2z" />
    </svg>
);

const ViewListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="3" width="14" height="2" rx="1" />
        <rect x="1" y="7" width="14" height="2" rx="1" />
        <rect x="1" y="11" width="14" height="2" rx="1" />
    </svg>
);

const ViewModuleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
);

const NavigateNextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6 2l6 6-6 6V2z" />
    </svg>
);

const NavigateBeforeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M10 2l-6 6 6 6V2z" />
    </svg>
);

const ArrowForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 4l7 6-7 6V4z" />
    </svg>
);

export const MoviesRecommended: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`movies-recommended-${topParentId}`, 'Poster');

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `movies-recommended-${topParentId}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['movies-recommended', topParentId, pageIndex],
        queryFn: async () => {
            logger.debug('Fetching movie recommendations', { component: 'MoviesRecommended', topParentId });

            return itemsApi.getItems(topParentId, {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                recursive: true,
                includeTypes: ['Movie']
                // fields: 'PrimaryImageAspectRatio,SortName,CommunityRating,UserData' // Not supported in current interface
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

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[MoviesRecommended] Failed to play movie', error);
        }
    }, []);

    if (isLoading) {
        return <LoadingSpinner message="Loading movies..." />;
    }

    if (isError) {
        return (
            <ErrorState message={error instanceof Error ? error.message : 'Failed to load movies'} onRetry={refetch} />
        );
    }

    const movies = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    if (movies.length === 0) {
        return <EmptyState title="No Movies" description="Add movies to your library to see them here." />;
    }

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['5'] }}>
                <Heading.H3>Movies</Heading.H3>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                    <Button variant="secondary" startDecorator={<PlayArrowIcon />} size="sm">
                        Shuffle Play
                    </Button>
                    <IconButton variant={viewStyle === 'List' ? 'solid' : 'plain'} onClick={() => setViewStyle('List')}>
                        <ViewListIcon />
                    </IconButton>
                    <IconButton
                        variant={viewStyle === 'Poster' ? 'solid' : 'plain'}
                        onClick={() => setViewStyle('Poster')}
                    >
                        <ViewModuleIcon />
                    </IconButton>
                </Flex>
            </Flex>

            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['4'] }}>
                    <Text weight="bold" size="lg">
                        Continue Watching
                    </Text>
                    <Button variant="ghost" size="sm" endDecorator={<ArrowForwardIcon />}>
                        View All
                    </Button>
                </Flex>
                <MediaGrid items={movies.slice(0, 6)} showPlayButtons onItemClick={handleItemClick} onItemPlay={handleItemPlay} />
            </Box>

            <Divider style={{ margin: '24px 0' }} />

            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['4'] }}>
                    <Text weight="bold" size="lg">
                        Latest Additions
                    </Text>
                    <Button variant="ghost" size="sm" endDecorator={<ArrowForwardIcon />}>
                        View All
                    </Button>
                </Flex>
                <MediaGrid items={movies.slice(6, 12)} showPlayButtons onItemClick={handleItemClick} onItemPlay={handleItemPlay} />
            </Box>

            <Divider style={{ margin: '24px 0' }} />

            <Box style={{ marginBottom: vars.spacing['6'] }}>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['4'] }}>
                    <Text weight="bold" size="lg">
                        Suggestions For You
                    </Text>
                    <Button variant="ghost" size="sm" endDecorator={<ArrowForwardIcon />}>
                        View All
                    </Button>
                </Flex>
                <MediaGrid items={movies.slice(12, 18)} showPlayButtons onItemClick={handleItemClick} onItemPlay={handleItemPlay} />
            </Box>

            <Divider style={{ margin: '24px 0' }} />

            <Box>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['4'] }}>
                    <Text weight="bold" size="lg">
                        All Movies
                    </Text>
                    <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                        <Text size="sm" color="secondary">
                            {totalCount} movie{totalCount !== 1 ? 's' : ''}
                        </Text>
                        {(hasPreviousPage || hasNextPage) && (
                            <Flex style={{ alignItems: 'center', gap: vars.spacing['1'] }}>
                                <IconButton
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={!hasPreviousPage || pageIndex === 0}
                                >
                                    <NavigateBeforeIcon />
                                </IconButton>
                                <Chip size="sm">{pageIndex + 1}</Chip>
                                <IconButton size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
                                    <NavigateNextIcon />
                                </IconButton>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
                <MediaGrid items={movies} showPlayButtons onItemClick={handleItemClick} onItemPlay={handleItemPlay} />
            </Box>
        </Box>
    );
};

export default MoviesRecommended;
