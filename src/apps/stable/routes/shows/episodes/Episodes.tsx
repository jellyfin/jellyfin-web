/**
 * Episodes View
 *
 * React-based episodes browsing view with TanStack Query and ui-primitives.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { PlayIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { appRouter } from 'components/router/appRouter';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { toVideoItem } from 'lib/utils/playbackUtils';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, Flex, Heading, IconButton, Text } from 'ui-primitives';

interface EpisodeCardWithPlayProps {
    item: BaseItemDto;
    onPlay: () => void;
    onClick: () => void;
}

const EpisodeCardWithPlay: React.FC<EpisodeCardWithPlayProps> = ({ item, onPlay, onClick }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
        >
            <Box
                style={{
                    display: 'flex',
                    gap: vars.spacing['5'],
                    padding: vars.spacing['4'],
                    border: `1px solid ${vars.colors.divider}`,
                    borderRadius: vars.borderRadius.md,
                    cursor: 'pointer'
                }}
                onClick={onClick}
            >
                <motion.div style={{ position: 'relative' }}>
                    <Box
                        style={{
                            width: 160,
                            aspectRatio: '16/9',
                            borderRadius: vars.borderRadius.sm,
                            overflow: 'hidden'
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
                                    borderRadius: vars.borderRadius.sm
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <IconButton
                                    variant="solid"
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlay();
                                    }}
                                    aria-label="Play episode"
                                >
                                    <PlayIcon />
                                </IconButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <Box style={{ flex: 1 }}>
                    <Heading.H5>{item.Name}</Heading.H5>
                    <Text size="sm" color="secondary">
                        {item.SeriesName}
                    </Text>
                </Box>
            </Box>
        </motion.div>
    );
};

export const Episodes: React.FC = () => {
    const { seriesId, seasonId } = useParams({ strict: false }) as {
        seriesId?: string;
        seasonId?: string;
    };

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.episodes(seriesId, seasonId),
        queryFn: () =>
            getItems(seriesId || '', {
                includeTypes: ['Episode'],
                recursive: true,
                parentId: seasonId,
                sortBy: 'SortName',
                sortOrder: 'Ascending',
                // fields: 'PrimaryImageAspectRatio,SeriesStudio,UserData', // Not supported in current interface
                imageTypeLimit: 1,
                enableImageTypes: ['Primary', 'Backdrop', 'Banner', 'Thumb']
            }),
        enabled: !!seriesId
    });

    const handlePlayAll = () => {
        if (data?.Items) {
            const playables = data.Items.map(toVideoItem);
            playbackManagerBridge.setQueue(playables, 0);
            playbackManagerBridge.play();
        }
    };

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[Episodes] Failed to play episode', error);
        }
    }, []);

    if (error) {
        return (
            <Box style={{ padding: vars.spacing['6'], textAlign: 'center' }}>
                <Heading.H4 color="error">Error loading episodes</Heading.H4>
            </Box>
        );
    }

    return (
        <Box className="view-content">
            <Box
                style={{
                    padding: vars.spacing['5'],
                    borderBottom: `1px solid ${vars.colors.divider}`
                }}
            >
                <Flex
                    style={{
                        flexDirection: 'row',
                        gap: vars.spacing['5'],
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Heading.H4>Episodes</Heading.H4>
                    <Button
                        variant="primary"
                        onClick={handlePlayAll}
                        disabled={!data?.Items?.length}
                    >
                        <PlayIcon style={{ marginRight: vars.spacing['2'] }} /> Play All
                    </Button>
                </Flex>
            </Box>

            <Box style={{ padding: vars.spacing['5'] }}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: vars.spacing['5']
                    }}
                >
                    {data?.Items?.map((item) => (
                        <EpisodeCardWithPlay
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

export default Episodes;
