/**
 * TV Recommended View
 *
 * Displays recommended TV shows with continue watching, latest, and next up sections.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ChevronLeftIcon, ChevronRightIcon, GridIcon, ListBulletIcon, PlayIcon } from '@radix-ui/react-icons';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { logger } from 'utils/logger';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { appRouter } from 'components/router/appRouter';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { IconButton } from 'ui-primitives';
import { Chip } from 'ui-primitives';
import { Divider } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { Heading, Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

interface ShowCardProps {
    item: BaseItemDto;
    onPlay: () => void;
    onClick: () => void;
}

const ShowCard: React.FC<ShowCardProps> = ({ item, onPlay, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            style={{ position: 'relative' }}
        >
            <Box
                style={{
                    cursor: 'pointer',
                    position: 'relative',
                    borderRadius: vars.borderRadius.md,
                    overflow: 'hidden'
                }}
                onClick={onClick}
            >
                <Box
                    style={{
                        aspectRatio: '16/9',
                        borderRadius: vars.borderRadius.md,
                        overflow: 'hidden',
                        marginBottom: vars.spacing['2']
                    }}
                >
                    {item.ImageTags?.Primary && (
                        <img
                            src={`/api/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=400`}
                            alt={item.Name || ''}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </Box>
                <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                    {item.Name}
                </Text>

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
                                backdropFilter: 'blur(2px)',
                                borderRadius: vars.borderRadius.md
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
                                aria-label="Play show"
                            >
                                <PlayIcon />
                            </IconButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
        </motion.div>
    );
};

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

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            logger.error('[TVRecommended] Failed to play show', { error });
        }
    }, []);

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
        <Box style={{ padding: vars.spacing['6'] }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['7'] }}>
                <Heading.H3>TV Shows</Heading.H3>
                <Flex style={{ gap: vars.spacing['4'], alignItems: 'center' }}>
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

            <Box style={{ marginBottom: vars.spacing['7'] }}>
                <Heading.H4 style={{ marginBottom: vars.spacing['5'] }}>Continue Watching</Heading.H4>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {items.slice(0, 6).map(item => (
                        <ShowCard
                            key={item.Id}
                            item={item}
                            onPlay={() => handleItemPlay(item)}
                            onClick={() => handleItemClick(item)}
                        />
                    ))}
                </Box>
            </Box>

            <Divider />

            <Box style={{ marginBottom: vars.spacing['7'] }}>
                <Heading.H4 style={{ marginBottom: vars.spacing['5'] }}>Latest Additions</Heading.H4>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {items.slice(6, 12).map(item => (
                        <ShowCard
                            key={item.Id}
                            item={item}
                            onPlay={() => handleItemPlay(item)}
                            onClick={() => handleItemClick(item)}
                        />
                    ))}
                </Box>
            </Box>

            <Divider />

            <Box>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['5'] }}>
                    <Text size="sm" color="secondary">
                        {totalCount} show{totalCount !== 1 ? 's' : ''}
                    </Text>
                    {(hasPreviousPage || hasNextPage) && (
                        <Flex style={{ gap: vars.spacing['4'], alignItems: 'center' }}>
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
                        gap: vars.spacing['5']
                    }}
                >
                    {items.map(item => (
                        <ShowCard
                            key={item.Id}
                            item={item}
                            onPlay={() => handleItemPlay(item)}
                            onClick={() => handleItemClick(item)}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default TVRecommended;
