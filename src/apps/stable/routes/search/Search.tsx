/**
 * Search View
 *
 * Search interface with instant results, suggestions, and filters.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import {
    Cross2Icon,
    DesktopIcon,
    DiscIcon,
    MagnifyingGlassIcon,
    PersonIcon,
    VideoIcon
} from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { EmptyState } from 'components/EmptyState';
import { ErrorState } from 'components/ErrorState';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { MediaGrid } from 'components/media/MediaGrid';
import { appRouter } from 'components/router/appRouter';
import { useDebounce } from 'hooks/useDebounce';
import { itemsApi } from 'lib/api/items';
import { toPlayableItem, toVideoItem } from 'lib/utils/playbackUtils';
import React, { useCallback, useEffect, useState } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { vars } from 'styles/tokens.css.ts';
import { Box, Chip, Flex, Heading, IconButton, Input, Text } from 'ui-primitives';
import { logger } from 'utils/logger';

type SearchType =
    | 'all'
    | 'movies'
    | 'shows'
    | 'episodes'
    | 'music'
    | 'artists'
    | 'albums'
    | 'songs'
    | 'people'
    | 'live';

export const Search: React.FC = () => {
    const params = useParams({ strict: false }) as { query?: string; type?: string };
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState(params.query || '');
    const [activeType, setActiveType] = useState<SearchType>('all');

    const debouncedQuery = useDebounce(searchQuery, 300);

    const searchTypes: { value: SearchType; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: 'All', icon: <MagnifyingGlassIcon /> },
        { value: 'movies', label: 'Movies', icon: <VideoIcon /> },
        { value: 'shows', label: 'TV Shows', icon: <DesktopIcon /> },
        { value: 'episodes', label: 'Episodes', icon: <DesktopIcon /> },
        { value: 'music', label: 'Music', icon: <DiscIcon /> },
        { value: 'artists', label: 'Artists', icon: <PersonIcon /> }
    ];

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['search', debouncedQuery, activeType],
        queryFn: async () => {
            if (!debouncedQuery.trim()) {
                return { Items: [], TotalRecordCount: 0 };
            }

            logger.debug('Searching', {
                component: 'Search',
                query: debouncedQuery,
                type: activeType
            });

            const includeTypes = getIncludeTypes(activeType);

            return itemsApi.getItems('', {
                searchTerm: debouncedQuery,
                startIndex: 0,
                limit: 50,
                recursive: true,
                includeTypes
            });
        },
        enabled: debouncedQuery.trim().length > 0,
        staleTime: 30 * 1000
    });

    const getIncludeTypes = (type: SearchType): string[] | undefined => {
        switch (type) {
            case 'movies':
                return ['Movie'];
            case 'shows':
                return ['Series'];
            case 'episodes':
                return ['Episode'];
            case 'music':
                return ['Audio'];
            case 'artists':
                return ['MusicArtist'];
            case 'albums':
                return ['MusicAlbum'];
            case 'songs':
                return ['Audio'];
            case 'people':
                return ['Person'];
            case 'live':
                return ['LiveTVProgram', 'LiveTVChannel'];
            default:
                return undefined;
        }
    };

    const isAudioItem = (item: BaseItemDto): boolean => {
        return item.Type === 'Audio' || item.Type === 'MusicArtist' || item.Type === 'MusicAlbum';
    };

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            // Determine if this is audio or video based on item type
            const playable = isAudioItem(item) ? toPlayableItem(item) : toVideoItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            logger.error('[Search] Failed to play item', { error });
        }
    }, []);

    const handleClear = useCallback(() => {
        setSearchQuery('');
        navigate({ to: '/search' });
    }, [navigate]);

    const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchQuery(e.target.value);
            if (e.target.value) {
                navigate({ to: `/search/${encodeURIComponent(e.target.value)}` });
            } else {
                navigate({ to: '/search' });
            }
        },
        [navigate]
    );

    const results = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    const filteredResults = results;

    return (
        <Box style={{ padding: vars.spacing['6'] }}>
            <Heading.H3 style={{ marginBottom: vars.spacing['6'] }}>Search</Heading.H3>

            <Box style={{ marginBottom: vars.spacing['6'], position: 'relative' }}>
                <Flex align="center" style={{ position: 'relative' }}>
                    <Box style={{ position: 'absolute', left: 12, zIndex: 1 }}>
                        <MagnifyingGlassIcon style={{ color: vars.colors.textMuted }} />
                    </Box>
                    <Input
                        placeholder="Search movies, shows, music, artists..."
                        value={searchQuery}
                        onChange={handleSearch}
                        style={{ width: '100%', maxWidth: 600, paddingLeft: 40 }}
                    />
                    {searchQuery ? (
                        <IconButton
                            variant="plain"
                            onClick={handleClear}
                            size="sm"
                            style={{ position: 'absolute', right: 8 }}
                        >
                            <Cross2Icon />
                        </IconButton>
                    ) : null}
                </Flex>
            </Box>

            {!debouncedQuery.trim() ? (
                <EmptyState
                    title="Start Searching"
                    description="Enter a search term to find movies, TV shows, music, and more."
                    icon={<MagnifyingGlassIcon style={{ width: 48, height: 48, opacity: 0.3 }} />}
                />
            ) : isLoading ? (
                <LoadingSpinner message="Searching..." />
            ) : isError ? (
                <ErrorState
                    message={error instanceof Error ? error.message : 'Search failed'}
                    onRetry={refetch}
                />
            ) : (
                <>
                    <Box
                        style={{
                            display: 'flex',
                            gap: vars.spacing['4'],
                            marginBottom: vars.spacing['6'],
                            flexWrap: 'wrap'
                        }}
                    >
                        {searchTypes.map((type) => (
                            <Chip
                                key={type.value}
                                variant={activeType === type.value ? 'primary' : 'secondary'}
                                onClick={() => setActiveType(type.value)}
                                startDecorator={type.icon}
                            >
                                {type.label}
                            </Chip>
                        ))}
                    </Box>

                    <Box
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: vars.spacing['5']
                        }}
                    >
                        <Text size="sm" color="secondary">
                            {totalCount} result{totalCount !== 1 ? 's' : ''} for "{debouncedQuery}"
                        </Text>
                    </Box>

                    {filteredResults.length > 0 ? (
                        <MediaGrid
                            items={filteredResults}
                            onItemClick={handleItemClick}
                            onItemPlay={handleItemPlay}
                            showPlayButtons
                        />
                    ) : (
                        <EmptyState
                            title="No Results"
                            description={`No ${activeType === 'all' ? '' : activeType} found for "${debouncedQuery}"`}
                        />
                    )}
                </>
            )}
        </Box>
    );
};

export default Search;
