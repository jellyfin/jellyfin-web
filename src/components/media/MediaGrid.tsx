/**
 * Media Grid Component
 *
 * Responsive grid for displaying media cards with framer-motion animations.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { Grid } from 'ui-primitives';
import { Skeleton } from 'ui-primitives';
import { MediaCard, MediaCardProps } from './MediaCard';

export interface MediaGridProps {
    items: MediaCardProps['item'][];
    viewMode?: 'grid' | 'list';
    totalCount?: number;
    showAlbumArtist?: boolean;
    showArtist?: boolean;
    onItemClick?: MediaCardProps['onClick'];
    onItemPlay?: MediaCardProps['onPlay'];
    onItemMoreClick?: MediaCardProps['onMoreClick'];
    showPlayButtons?: boolean;
    cardSize?: 'small' | 'medium' | 'large';
    loading?: boolean;
    emptyMessage?: string;
}

const getGridColumns = (viewportWidth: number): number => {
    if (viewportWidth < 600) return 2;
    if (viewportWidth < 900) return 3;
    if (viewportWidth < 1200) return 4;
    if (viewportWidth < 1600) return 5;
    return 6;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut' as const
        }
    }
};

const skeletonVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03
        }
    }
};

const skeletonItemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const
        }
    }
};

export const MediaGrid: React.FC<MediaGridProps> = ({
    items,
    viewMode = 'grid',
    totalCount,
    showAlbumArtist,
    showArtist,
    onItemClick,
    onItemPlay,
    onItemMoreClick,
    showPlayButtons = false,
    cardSize = 'medium',
    loading = false,
    emptyMessage = 'No items found'
}) => {
    const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => {
            setViewportWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const columns = getGridColumns(viewportWidth);

    const cardWidth = cardSize === 'small' ? 120 : cardSize === 'medium' ? 180 : 240;

    const skeletonItems = Array.from({ length: columns * 2 }).map((_, i) => i);

    if (loading) {
        return (
            <motion.div initial="hidden" animate="visible" variants={skeletonVariants}>
                <Grid
                    container
                    spacing="md"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`
                    }}
                >
                    {skeletonItems.map(i => (
                        <motion.div key={`skeleton-${i}`} variants={skeletonItemVariants}>
                            <Skeleton
                                width={cardWidth}
                                height={cardSize === 'small' ? 180 : cardSize === 'medium' ? 270 : 360}
                                variant="rectangular"
                                style={{ borderRadius: '12px' }}
                            />
                        </motion.div>
                    ))}
                </Grid>
            </motion.div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <Flex
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200
                }}
            >
                <Box
                    style={{
                        textAlign: 'center'
                    }}
                >
                    <Box
                        style={{
                            fontSize: vars.typography.fontSizeDisplay,
                            opacity: 0.3,
                            marginBottom: vars.spacing['4']
                        }}
                    >
                        🎬
                    </Box>
                    <Text size="lg" color="secondary" style={{ fontWeight: 500 }}>
                        {emptyMessage}
                    </Text>
                </Box>
            </Flex>
        );
    }

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <Box style={{ padding: '0 8px' }}>
                <Grid
                    container
                    spacing="md"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${columns}, 1fr)`
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) => (
                            <motion.div key={item.Id || index} variants={itemVariants} layout>
                                <MediaCard
                                    item={item}
                                    onClick={onItemClick}
                                    onPlay={onItemPlay}
                                    onMoreClick={onItemMoreClick}
                                    showPlayButton={showPlayButtons}
                                    cardSize={cardSize}
                                    priority={index}
                                    viewMode={viewMode}
                                    showAlbumArtist={showAlbumArtist}
                                    showArtist={showArtist}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </Grid>
            </Box>
        </motion.div>
    );
};

export default MediaGrid;
