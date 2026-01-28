/**
 * Media Card Component
 *
 * Reusable card component for displaying media items with framer-motion animations.
 */

import { vars } from 'styles/tokens.css.ts';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Flex } from 'ui-primitives';
import { Card, CardBody } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Skeleton } from 'ui-primitives';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

import { DotsVerticalIcon, PlayIcon } from '@radix-ui/react-icons';

export interface MediaCardProps {
    item: BaseItemDto;
    viewMode?: 'grid' | 'list';
    showAlbumArtist?: boolean;
    showArtist?: boolean;
    onClick?: (item: BaseItemDto) => void;
    onPlay?: (item: BaseItemDto) => void;
    onMoreClick?: (item: BaseItemDto) => void;
    showPlayButton?: boolean;
    cardSize?: 'small' | 'medium' | 'large';
    priority?: number;
}

const getPrimaryImageUrl = (item: BaseItemDto): string | null => {
    if (!item.Id) return null;
    const apiClient = (
        window as unknown as {
            ApiClient?: {
                getApiClient: () => {
                    getImageUrl: (
                        id: string,
                        options: { type: number; tag?: string; maxWidth?: number; maxHeight?: number }
                    ) => string | null;
                };
            };
        }
    ).ApiClient;
    if (!apiClient) return null;

    const imageTag = item.ImageTags?.Primary;
    if (imageTag) {
        return apiClient.getApiClient().getImageUrl(item.Id, {
            type: 0,
            tag: imageTag,
            maxWidth: 300,
            maxHeight: 450
        });
    }

    const backdropTag = item.BackdropImageTags?.[0];
    if (backdropTag) {
        return apiClient.getApiClient().getImageUrl(item.Id, {
            type: 2,
            tag: backdropTag,
            maxWidth: 600,
            maxHeight: 338
        });
    }

    return null;
};

const getDisplayName = (item: BaseItemDto): string => {
    return item.Name || 'Unknown';
};

const getSubtitle = (item: BaseItemDto, showAlbumArtist?: boolean, showArtist?: boolean): string => {
    const parts: string[] = [];

    if (showAlbumArtist && item.AlbumArtist) {
        parts.push(item.AlbumArtist);
    } else if (showArtist && item.ArtistItems && item.ArtistItems.length > 0) {
        parts.push(item.ArtistItems.map(a => a.Name).join(', '));
    } else if (item.ProductionYear) {
        parts.push(item.ProductionYear.toString());
    }

    if (item.RunTimeTicks) {
        const minutes = Math.floor(item.RunTimeTicks / 600000000);
        if (minutes > 0) {
            parts.push(`${minutes} min`);
        }
    }

    if (item.OfficialRating) {
        parts.push(item.OfficialRating);
    }

    return parts.join(' • ');
};

const cardVariants = {
    rest: { scale: 1, y: 0, boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' },
    hover: {
        scale: 1.02,
        y: -4,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const
        }
    }
};

const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut' as const
        }
    }
};

const playButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut' as const
        }
    }
};

const sizeMap: Record<string, { width: number; height: number; fontSize: string }> = {
    small: { width: 120, height: 180, fontSize: 'xs' },
    medium: { width: 180, height: 270, fontSize: 'sm' },
    large: { width: 240, height: 360, fontSize: 'md' }
};

export const MediaCard: React.FC<MediaCardProps> = ({
    item,
    viewMode = 'grid',
    showAlbumArtist,
    showArtist,
    onClick,
    onPlay,
    onMoreClick,
    showPlayButton = false,
    cardSize = 'medium',
    priority = 0
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const cardDimensions = sizeMap[cardSize] || sizeMap.medium;
    const imageUrl = getPrimaryImageUrl(item);
    const displayName = getDisplayName(item);
    const subtitle = getSubtitle(item, showAlbumArtist, showArtist);

    const isListMode = viewMode === 'list';

    const handleClick = () => {
        onClick?.(item);
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay?.(item);
    };

    const handleMoreClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMoreClick?.(item);
    };

    const cardStyle: React.CSSProperties = {
        width: isListMode ? '100%' : cardDimensions.width,
        height: 'auto',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        borderRadius: '12px'
    };

    const aspectRatio = isListMode ? '16/9' : '2/3';
    const imageContainerWidth = isListMode ? 120 : '100%';

    return (
        <motion.div
            variants={cardVariants}
            initial="rest"
            animate={isHovered ? 'hover' : 'rest'}
            onMouseEnter={() => onClick && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%' }}
        >
            <Card style={cardStyle} onClick={handleClick} data-testid="media-card">
                <Box
                    style={{
                        position: 'relative',
                        width: imageContainerWidth,
                        aspectRatio,
                        flexShrink: 0,
                        overflow: 'hidden',
                        backgroundColor: 'var(--surface)'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {!imageLoaded && !imageError && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--surface)'
                                }}
                            >
                                <Skeleton width="100%" height="100%" variant="rectangular" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {imageUrl && !imageError ? (
                        <motion.img
                            src={imageUrl}
                            alt={displayName}
                            loading={priority < 5 ? 'eager' : 'lazy'}
                            onError={() => setImageError(true)}
                            onLoad={() => setImageLoaded(true)}
                            variants={imageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <Box
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--surface)'
                            }}
                        >
                            <Text size="xs" color="secondary">
                                No Image
                            </Text>
                        </Box>
                    )}

                    <AnimatePresence>
                        {showPlayButton && isHovered && (
                            <motion.div
                                variants={playButtonVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <IconButton
                                    size="lg"
                                    variant="solid"
                                    onClick={handlePlayClick}
                                    style={{ borderRadius: '50%' }}
                                >
                                    <PlayIcon />
                                </IconButton>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {onMoreClick && (
                        <IconButton
                            size="sm"
                            variant="solid"
                            aria-label="More"
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                opacity: isHovered ? 1 : 0,
                                transition: 'opacity 0.2s ease',
                                backgroundColor: 'rgba(0,0,0,0.5)'
                            }}
                            onClick={handleMoreClick}
                        >
                            <DotsVerticalIcon />
                        </IconButton>
                    )}
                </Box>

                <CardBody style={{ padding: '8px', flex: 1, minWidth: 0 }}>
                    <Text
                        size={cardDimensions.fontSize as 'xs' | 'sm' | 'md'}
                        style={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {displayName}
                    </Text>
                    {subtitle && (
                        <Text size="xs" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                            {subtitle}
                        </Text>
                    )}
                </CardBody>
            </Card>
        </motion.div>
    );
};

export default MediaCard;
