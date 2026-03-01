import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import AlbumIcon from '@mui/icons-material/Album';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import React, { useState, useCallback, useEffect, useRef, type FC, type KeyboardEvent, type ChangeEvent } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useQuery } from '@tanstack/react-query';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';

import { useQuickSearch } from 'hooks/useQuickSearch';
import { useSearchItems } from 'apps/stable/features/search/api/useSearchItems';
import { useApi } from 'hooks/useApi';
import { appRouter } from 'components/router/appRouter';
import { filterByFuzzyMatch, parseQueryWords } from 'utils/fuzzySearch';

const MAX_RESULTS = 10;
const MAX_SUGGESTIONS = 6;

// Thumbnail dimensions by content type
type ThumbnailSize = { width: number; height: number };

function getThumbnailSize(type: string | undefined): ThumbnailSize {
    switch (type) {
        case 'Episode':
        case 'Video':
        case 'Recording':
        case 'Program':
        case 'TvChannel':
            return { width: 71, height: 40 }; // 16:9
        case 'MusicAlbum':
        case 'Audio':
        case 'MusicArtist':
        case 'Playlist':
            return { width: 48, height: 48 }; // 1:1
        default:
            // Movie, Series, Season, BoxSet, etc.
            return { width: 40, height: 60 }; // 2:3
    }
}

function getFallbackIcon(type: string | undefined) {
    switch (type) {
        case 'Episode':
        case 'Series':
        case 'Season':
            return TvIcon;
        case 'MusicAlbum':
        case 'Audio':
        case 'MusicArtist':
        case 'Playlist':
            return AlbumIcon;
        case 'Video':
        case 'Recording':
        case 'Program':
        case 'TvChannel':
            return VideoLibraryIcon;
        default:
            return MovieIcon;
    }
}

const QuickSearchDialog: FC = () => {
    const { isOpen, close } = useQuickSearch();
    const { api, user } = useApi();
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounceValue(query, 300);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch continue watching items
    const { data: resumeItems } = useQuery({
        queryKey: ['QuickSearch', 'ResumeItems', user?.Id],
        queryFn: async () => {
            if (!api || !user?.Id) return [];
            const response = await getItemsApi(api).getResumeItems({
                userId: user.Id,
                limit: MAX_SUGGESTIONS,
                fields: [ItemFields.PrimaryImageAspectRatio],
                imageTypeLimit: 1,
                enableImageTypes: [ImageType.Primary, ImageType.Thumb]
            });
            return response.data.Items ?? [];
        },
        enabled: !!api && !!user?.Id && isOpen
    });

    // Fetch recently added items
    const { data: latestItems } = useQuery({
        queryKey: ['QuickSearch', 'LatestMedia', user?.Id],
        queryFn: async () => {
            if (!api || !user?.Id) return [];
            const response = await getUserLibraryApi(api).getLatestMedia({
                userId: user.Id,
                limit: MAX_SUGGESTIONS,
                fields: [ItemFields.PrimaryImageAspectRatio],
                imageTypeLimit: 1,
                enableImageTypes: [ImageType.Primary, ImageType.Thumb]
            });
            return response.data ?? [];
        },
        enabled: !!api && !!user?.Id && isOpen
    });

    // Fetch favorites
    const { data: favoriteItems } = useQuery({
        queryKey: ['QuickSearch', 'Favorites', user?.Id],
        queryFn: async () => {
            if (!api || !user?.Id) return [];
            const response = await getItemsApi(api).getItems({
                userId: user.Id,
                limit: MAX_SUGGESTIONS,
                filters: [ItemFilter.IsFavorite],
                recursive: true,
                fields: [ItemFields.PrimaryImageAspectRatio],
                imageTypeLimit: 1,
                enableImageTypes: [ImageType.Primary, ImageType.Thumb],
                sortBy: [ItemSortBy.Random]
            });
            return response.data.Items ?? [];
        },
        enabled: !!api && !!user?.Id && isOpen
    });

    // Parse query into words for fuzzy matching
    const queryWords = React.useMemo(
        () => parseQueryWords(debouncedQuery),
        [debouncedQuery]
    );

    // Use first 2 chars as API query - catches typos in 3rd+ char position
    const apiSearchTerm = queryWords[0]?.length >= 2 ? queryWords[0].slice(0, 2) : undefined;

    const { data: sections, isPending } = useSearchItems(undefined, undefined, apiSearchTerm);

    // Flatten sections and apply fuzzy filtering
    const searchResults: BaseItemDto[] = React.useMemo(() => {
        if (!sections || queryWords.length === 0) return [];

        const allItems = sections.flatMap(section => section.items);
        const filtered = filterByFuzzyMatch(allItems, item => item.Name || '', queryWords);

        return filtered.slice(0, MAX_RESULTS);
    }, [sections, queryWords]);

    // Combine suggestions when not searching
    const suggestions = React.useMemo(() => {
        if (queryWords.length > 0) return [];

        const seen = new Set<string>();
        const combined: BaseItemDto[] = [];

        // Add resume items first (most relevant)
        for (const item of resumeItems ?? []) {
            if (item.Id && !seen.has(item.Id)) {
                seen.add(item.Id);
                combined.push(item);
            }
        }

        // Add latest items
        for (const item of latestItems ?? []) {
            if (item.Id && !seen.has(item.Id)) {
                seen.add(item.Id);
                combined.push(item);
            }
        }

        // Add favorites
        for (const item of favoriteItems ?? []) {
            if (item.Id && !seen.has(item.Id)) {
                seen.add(item.Id);
                combined.push(item);
            }
        }

        return combined.slice(0, MAX_RESULTS);
    }, [queryWords.length, resumeItems, latestItems, favoriteItems]);

    // Use search results or suggestions
    const items = queryWords.length > 0 ? searchResults : suggestions;

    // Reset state and focus input when dialog opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            // Focus input after dialog animation completes
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Keep selected index in bounds
    useEffect(() => {
        if (selectedIndex >= items.length) {
            setSelectedIndex(Math.max(0, items.length - 1));
        }
    }, [items.length, selectedIndex]);

    const getItemImageUrl = useCallback((item: BaseItemDto): string | undefined => {
        if (!api || !item.Id) return undefined;

        const imageTag = item.ImageTags?.Primary;
        if (!imageTag) return undefined;

        const size = getThumbnailSize(item.Type);
        return getImageApi(api).getItemImageUrlById(item.Id, ImageType.Primary, {
            fillWidth: size.width * 2, // Request 2x for retina
            fillHeight: size.height * 2,
            tag: imageTag
        });
    }, [api]);

    const navigateToItem = useCallback((item: BaseItemDto) => {
        close();
        appRouter.showItem(item.Id, item.ServerId);
    }, [close]);

    const handleQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }, []);

    const handleItemClick = useCallback((item: BaseItemDto) => () => {
        navigateToItem(item);
    }, [navigateToItem]);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (items.length > 0 && items[selectedIndex]) {
                    navigateToItem(items[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                close();
                break;
        }
    }, [items, selectedIndex, navigateToItem, close]);

    const getItemSubtitle = (item: BaseItemDto): string => {
        const parts: string[] = [];

        // For episodes, show season/episode info instead of year
        if (item.Type === 'Episode') {
            if (item.ParentIndexNumber !== undefined && item.IndexNumber !== undefined) {
                parts.push(`S${item.ParentIndexNumber}E${item.IndexNumber}`);
            } else {
                parts.push('Episode');
            }
            if (item.SeriesName) {
                parts.push(item.SeriesName);
            }
        } else {
            if (item.Type) parts.push(item.Type);
            if (item.ProductionYear) parts.push(String(item.ProductionYear));
        }

        return parts.join(' \u2022 ');
    };

    const renderThumbnail = (item: BaseItemDto) => {
        const size = getThumbnailSize(item.Type);
        const imageUrl = getItemImageUrl(item);
        const FallbackIcon = getFallbackIcon(item.Type);
        const ROW_HEIGHT = 60; // Consistent row height

        return (
            <Box
                sx={{
                    width: 71, // Max width (16:9 aspect)
                    height: ROW_HEIGHT,
                    mr: 2,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {imageUrl ? (
                    <Box
                        component='img'
                        src={imageUrl}
                        alt=''
                        sx={{
                            width: size.width,
                            height: size.height,
                            objectFit: 'cover',
                            borderRadius: 0.5,
                            bgcolor: 'action.hover'
                        }}
                        onError={handleImageError}
                    />
                ) : (
                    <Box
                        sx={{
                            width: size.width,
                            height: size.height,
                            borderRadius: 0.5,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FallbackIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                    </Box>
                )}
            </Box>
        );
    };

    const renderResults = () => {
        if (items.length > 0) {
            return (
                <List disablePadding>
                    {items.map((item, index) => (
                        <ListItemButton
                            key={item.Id}
                            selected={index === selectedIndex}
                            onClick={handleItemClick(item)}
                            sx={{ py: 1 }}
                        >
                            {renderThumbnail(item)}
                            <ListItemText
                                primary={item.Name}
                                secondary={getItemSubtitle(item)}
                                slotProps={{
                                    primary: { noWrap: true },
                                    secondary: { noWrap: true }
                                }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            );
        }

        // Only show "no results" when actively searching
        if (queryWords.length > 0 && !isPending) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color='text.secondary'>
                        No results found
                    </Typography>
                </Box>
            );
        }

        return null;
    };

    const renderSuggestions = () => {
        if (items.length === 0) return null;

        return (
            <>
                <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}
                >
                    Suggestions
                </Typography>
                <List disablePadding>
                    {items.map((item, index) => (
                        <ListItemButton
                            key={item.Id}
                            selected={index === selectedIndex}
                            onClick={handleItemClick(item)}
                            sx={{ py: 1 }}
                        >
                            {renderThumbnail(item)}
                            <ListItemText
                                primary={item.Name}
                                secondary={getItemSubtitle(item)}
                                slotProps={{
                                    primary: { noWrap: true },
                                    secondary: { noWrap: true }
                                }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </>
        );
    };

    return (
        <Dialog
            open={isOpen}
            onClose={close}
            maxWidth='sm'
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        position: 'fixed',
                        top: '15%',
                        m: 0,
                        borderRadius: 2,
                        maxHeight: '70vh'
                    }
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <InputBase
                    inputRef={inputRef}
                    fullWidth
                    placeholder='Search movies, shows, music...'
                    value={query}
                    onChange={handleQueryChange}
                    onKeyDown={handleKeyDown}
                    sx={{ fontSize: '1.1rem' }}
                />
                {isPending && debouncedQuery && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                )}
            </Box>

            <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                {debouncedQuery ? renderResults() : renderSuggestions()}
            </Box>

            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Typography variant='caption' color='text.secondary'>
                    <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>↑↓</kbd> navigate
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                    <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>↵</kbd> select
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                    <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>esc</kbd> close
                </Typography>
            </Box>
        </Dialog>
    );
};

export default QuickSearchDialog;
