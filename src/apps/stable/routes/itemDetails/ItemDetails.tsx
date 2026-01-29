/**
 * Item Details View
 *
 * React-based item details page with TanStack Query and ui-primitives.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import {
    DotsVerticalIcon,
    HeartFilledIcon,
    HeartIcon,
    PlayIcon,
    PlusIcon,
    ShuffleIcon
} from '@radix-ui/react-icons';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { getItems, itemsApi } from 'lib/api/items';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { queryKeys } from 'lib/queryKeys';
import React, { useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import type { MediaType, PlayableItem } from 'store/types';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, Chip, Divider, Flex, Heading, IconButton, Text } from 'ui-primitives';

const formatRuntime = (ticks: number | undefined): string => {
    if (!ticks) return '';
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
};

const getMediaType = (value?: string): MediaType => {
    switch (value) {
        case 'Audio':
        case 'MusicAlbum':
        case 'MusicArtist':
        case 'MusicGenre':
            return 'Audio';
        case 'Book':
            return 'Book';
        case 'Photo':
            return 'Photo';
        default:
            return 'Video';
    }
};

const toPlayableItem = (source: BaseItemDto): PlayableItem => {
    const idValue = source.Id ?? '';
    const nameValue = source.Name ?? '';
    const serverValue = source.ServerId ?? '';
    const typeValue = source.MediaType;
    const productionYear = source.ProductionYear ?? undefined;
    const runtimeTicks = source.RunTimeTicks ?? undefined;
    const genres = source.Genres ?? undefined;

    return {
        id: idValue,
        name: nameValue,
        serverId: serverValue,
        mediaType: getMediaType(typeValue),
        title: nameValue,
        year: productionYear,
        duration: source.RunTimeTicks ? source.RunTimeTicks / 10000000 : undefined,
        runtimeTicks: runtimeTicks,
        genre: genres
    };
};

export const ItemDetails: React.FC = () => {
    const { id } = useParams({ strict: false }) as { id?: string };
    const [isFavorite, setIsFavorite] = useState(false);

    const { data: item, isLoading: itemLoading } = useQuery({
        queryKey: queryKeys.item(id || ''),
        queryFn: () => itemsApi.getItem(id || ''),
        enabled: !!id
    });

    const { data: similarItems, isLoading: similarLoading } = useQuery({
        queryKey: ['similar', id],
        queryFn: () =>
            getItems(id || '', {
                includeTypes: item?.Type ? [item.Type] : ['Movie'],
                recursive: true,
                sortBy: 'Similarity',
                sortOrder: 'Descending',
                limit: 12,
                imageTypeLimit: 1
            }),
        enabled: !!item?.Id
    });

    const toggleFavorite = async () => {
        if (!item?.Id) return;
        const apiClient = ServerConnections.currentApiClient();
        if (!apiClient) return;

        const userId = apiClient.getCurrentUserId();
        await apiClient.updateFavoriteStatus(userId, item.Id, !isFavorite);
        setIsFavorite(!isFavorite);
    };

    const handlePlay = async () => {
        if (!item) return;
        const playable = toPlayableItem(item);
        await playbackManagerBridge.setQueue([playable], 0);
        await playbackManagerBridge.play();
    };

    const handleShuffle = async () => {
        if (!similarItems?.Items?.length) return;
        const queueItems = similarItems.Items.map((similarItem) => toPlayableItem(similarItem));
        await playbackManagerBridge.setQueue(queueItems, 0);
        await playbackManagerBridge.setShuffleMode('Shuffle');
        await playbackManagerBridge.play();
    };

    const handleAddToPlaylist = () => {
        // TODO: Implement add to playlist
    };

    if (itemLoading) {
        return (
            <Box style={{ padding: vars.spacing['6'], display: 'flex', justifyContent: 'center' }}>
                <Text>Loading...</Text>
            </Box>
        );
    }

    if (!item) {
        return (
            <Box style={{ padding: vars.spacing['6'], textAlign: 'center' }}>
                <Text color="error">Item not found</Text>
            </Box>
        );
    }

    const backdropUrl =
        item.Id && item.BackdropImageTags?.[0]
            ? `/api/Items/${item.Id}/Images/Backdrop?tag=${item.BackdropImageTags[0]}&width=1920`
            : null;
    const runtimeTicks = item.RunTimeTicks ?? undefined;
    const runtimeLabel = formatRuntime(runtimeTicks);

    return (
        <Box className="view-content">
            <Box
                style={{
                    position: 'relative',
                    minHeight: 400,
                    background: backdropUrl
                        ? `url(${backdropUrl}) center/cover`
                        : vars.colors.surface,
                    borderRadius: vars.borderRadius.lg,
                    overflow: 'hidden',
                    marginBottom: vars.spacing['7']
                }}
            >
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        padding: vars.spacing['7'],
                        display: 'flex',
                        gap: vars.spacing['5'],
                        flexWrap: 'wrap'
                    }}
                >
                    <Button variant="primary" size="lg" onClick={handlePlay}>
                        <PlayIcon style={{ marginRight: vars.spacing['2'] }} /> Play
                    </Button>
                    {(item.Type === 'Series' || item.Type === 'MusicAlbum') && (
                        <Button variant="ghost" size="lg" onClick={handleShuffle}>
                            <ShuffleIcon style={{ marginRight: vars.spacing['2'] }} /> Shuffle
                        </Button>
                    )}
                    <IconButton variant="plain" size="lg" onClick={toggleFavorite}>
                        {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                    </IconButton>
                    <IconButton variant="plain" size="lg" onClick={handleAddToPlaylist}>
                        <PlusIcon />
                    </IconButton>
                    <IconButton variant="plain" size="lg">
                        <DotsVerticalIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box
                style={{
                    paddingLeft: vars.spacing['7'],
                    paddingRight: vars.spacing['7'],
                    paddingBottom: vars.spacing['7']
                }}
            >
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['6'] }}>
                    <Box>
                        <Heading.H2>{item.Name}</Heading.H2>
                        {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                            <Text size="lg" color="secondary">
                                {item.OriginalTitle}
                            </Text>
                        )}
                    </Box>

                    <Flex
                        style={{ flexDirection: 'row', gap: vars.spacing['4'], flexWrap: 'wrap' }}
                    >
                        {item.ProductionYear && <Chip>{item.ProductionYear}</Chip>}
                        {item.OfficialRating && <Chip>{item.OfficialRating}</Chip>}
                        {runtimeLabel && <Chip>{runtimeLabel}</Chip>}
                        {item.CommunityRating && (
                            <Chip>Rating: {item.CommunityRating.toFixed(1)}</Chip>
                        )}
                    </Flex>

                    {item.Genres && item.Genres.length > 0 && (
                        <Flex
                            style={{
                                flexDirection: 'row',
                                gap: vars.spacing['4'],
                                flexWrap: 'wrap'
                            }}
                        >
                            {item.Genres.map((genre) => (
                                <Chip key={genre}>{genre}</Chip>
                            ))}
                        </Flex>
                    )}

                    {item.Overview && (
                        <Box>
                            <Heading.H4>Overview</Heading.H4>
                            <Text style={{ marginTop: vars.spacing['4'], whiteSpace: 'pre-wrap' }}>
                                {item.Overview}
                            </Text>
                        </Box>
                    )}

                    {item.People && item.People.length > 0 && (
                        <Box>
                            <Heading.H4 style={{ marginBottom: vars.spacing['5'] }}>
                                Cast & Crew
                            </Heading.H4>
                            <Flex
                                style={{
                                    flexDirection: 'row',
                                    gap: vars.spacing['4'],
                                    flexWrap: 'wrap'
                                }}
                            >
                                {item.People.slice(0, 10).map((person) => (
                                    <Chip key={person.Id}>
                                        {person.Name}
                                        {person.Role && ` as ${person.Role}`}
                                    </Chip>
                                ))}
                            </Flex>
                        </Box>
                    )}

                    <Divider />

                    {similarItems?.Items && similarItems.Items.length > 0 && (
                        <Box>
                            <Heading.H4 style={{ marginBottom: vars.spacing['5'] }}>
                                Similar Items
                            </Heading.H4>
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: vars.spacing['5']
                                }}
                            >
                                {similarItems.Items.map((similarItem) => {
                                    const imageTag =
                                        similarItem.ImageTags?.Primary ??
                                        similarItem.AlbumPrimaryImageTag;
                                    return (
                                        <Box key={similarItem.Id} style={{ cursor: 'pointer' }}>
                                            <Box
                                                style={{
                                                    aspectRatio: '16/9',
                                                    borderRadius: vars.borderRadius.md,
                                                    overflow: 'hidden',
                                                    marginBottom: vars.spacing['2']
                                                }}
                                            >
                                                {imageTag && (
                                                    <img
                                                        src={`/api/Items/${similarItem.Id}/Images/Primary?tag=${imageTag}&maxWidth=400`}
                                                        alt={similarItem.Name || ''}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                                {similarItem.Name}
                                            </Text>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                </Flex>
            </Box>
        </Box>
    );
};

export default ItemDetails;
