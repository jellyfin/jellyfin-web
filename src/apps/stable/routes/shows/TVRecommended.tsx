/**
 * TV Recommended View
 *
 * Displays recommended TV shows with continue watching, latest, and next up sections.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { logger } from 'utils/logger';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';
import { Divider } from 'ui-primitives/Divider';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const TVRecommended: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`tv-recommended-${topParentId}`, 'Poster');
    const [sortBy] = useState('DateCreated');
    const [sortOrder] = useState<'Ascending' | 'Descending'>('Descending');

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `tv-recommended-${topParentId}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['tv-recommended', topParentId, { pageIndex, pageSize, sortBy, sortOrder }],
        queryFn: async () => {
            logger.debug('Fetching TV recommendations', { component: 'TVRecommended', topParentId });

            return itemsApi.getItems(topParentId, {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                sortBy,
                sortOrder,
                recursive: true,
                includeTypes: ['Series', 'Season']
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
        return <LoadingSpinner message="Loading recommendations..." />;
    }

    if (isError) {
        return (
            <ErrorState
                message={error instanceof Error ? error.message : 'Failed to load recommendations'}
                onRetry={refetch}
            />
        );
    }

    const items = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    if (items.length === 0) {
        return (
            <EmptyState
                title="No Recommendations"
                description="Add TV shows to your library to see recommendations here."
            />
        );
    }

    return (
        <Box style={{ padding: vars.spacing.lg }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.xl }}>
                <Heading.H3>TV Shows</Heading.H3>
                <Flex style={{ gap: vars.spacing.sm, alignItems: 'center' }}>
                    <IconButton variant={viewStyle === 'List' ? 'solid' : 'plain'} onClick={() => setViewStyle('List')}>
                        <ListBulletIcon />
                    </IconButton>
                    <IconButton
                        variant={viewStyle === 'Poster' ? 'solid' : 'plain'}
                        onClick={() => setViewStyle('Poster')}
                    >
                        <GridIcon />
                    </IconButton>
                </Flex>
            </Flex>

            <Box style={{ marginBottom: vars.spacing.xl }}>
                <Heading.H4 style={{ marginBottom: vars.spacing.md }}>Continue Watching</Heading.H4>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {items.slice(0, 6).map(item => (
                        <Box key={item.Id} style={{ cursor: 'pointer' }}>
                            <Box
                                style={{
                                    aspectRatio: '16/9',
                                    borderRadius: vars.borderRadius.md,
                                    overflow: 'hidden',
                                    marginBottom: vars.spacing.xs
                                }}
                            >
                                {item.ImageTags?.Primary && (
                                    <img
                                        src={`/api/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=400`}
                                        alt={item.Name || ''}
                                        loading="lazy"
                                    />
                                )}
                            </Box>
                            <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                {item.Name}
                            </Text>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Divider />

            <Box style={{ marginBottom: vars.spacing.xl }}>
                <Heading.H4 style={{ marginBottom: vars.spacing.md }}>Latest Additions</Heading.H4>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {items.slice(6, 12).map(item => (
                        <Box key={item.Id} style={{ cursor: 'pointer' }}>
                            <Box
                                style={{
                                    aspectRatio: '16/9',
                                    borderRadius: vars.borderRadius.md,
                                    overflow: 'hidden',
                                    marginBottom: vars.spacing.xs
                                }}
                            >
                                {item.ImageTags?.Primary && (
                                    <img
                                        src={`/api/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=400`}
                                        alt={item.Name || ''}
                                        loading="lazy"
                                    />
                                )}
                            </Box>
                            <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                {item.Name}
                            </Text>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Divider />

            <Box>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}>
                    <Text size="sm" color="secondary">
                        {totalCount} show{totalCount !== 1 ? 's' : ''}
                    </Text>
                    {(hasPreviousPage || hasNextPage) && (
                        <Flex style={{ gap: vars.spacing.sm, alignItems: 'center' }}>
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
                        </Flex>
                    )}
                </Flex>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {items.map(item => (
                        <Box key={item.Id} style={{ cursor: 'pointer' }}>
                            <Box
                                style={{
                                    aspectRatio: '16/9',
                                    borderRadius: vars.borderRadius.md,
                                    overflow: 'hidden',
                                    marginBottom: vars.spacing.xs
                                }}
                            >
                                {item.ImageTags?.Primary && (
                                    <img
                                        src={`/api/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=400`}
                                        alt={item.Name || ''}
                                        loading="lazy"
                                    />
                                )}
                            </Box>
                            <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                {item.Name}
                            </Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default TVRecommended;
