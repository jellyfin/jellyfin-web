/**
 * Playlists View
 *
 * Main playlists browser displaying all playlists.
 */

import React, { useState, useCallback } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { Box, Flex } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';
import { FormControl, FormLabel } from 'ui-primitives/FormControl';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives/Select';
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from 'ui-primitives/Menu';
import { vars } from 'styles/tokens.css';

import { itemsApi } from 'lib/api/items';
import { useViewStyle } from 'hooks/useViewStyle';
import { usePagination } from 'hooks/usePagination';
import { MediaGrid } from 'components/joy-ui/media/MediaGrid';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';

import { logger } from 'utils/logger';

type ViewStyle = 'List' | 'Poster';
type SortOption = 'Name' | 'DateCreated' | 'DateModified' | 'SongCount' | 'PlayCount';

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
        <path d="M4 2l6 6-6 6V2z" />
    </svg>
);

const NavigateBeforeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M12 2l-6 6 6 6V2z" />
    </svg>
);

const SortIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 4h2v8H4V4zm4 0h2v8H8V4zm4 0h2v8h-2V4zm-8 10h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
    </svg>
);

const AddIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const Playlists: React.FC = () => {
    const params = useParams({ strict: false }) as { topParentId?: string };
    const topParentId = params.topParentId || '';

    const { viewStyle, setViewStyle } = useViewStyle(`playlists-${topParentId}`, 'Poster');
    const [sortBy, setSortBy] = useState<SortOption>('Name');
    const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');
    const [createMenuAnchor, setCreateMenuAnchor] = useState<HTMLElement | null>(null);
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination(
        `playlists-all-${topParentId}`
    );

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['playlists-all', topParentId, { pageIndex, pageSize, sortBy, sortOrder }],
        queryFn: async () => {
            logger.debug('Fetching all playlists', { component: 'Playlists', topParentId });

            return itemsApi.getItems(topParentId, {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                sortBy,
                sortOrder,
                recursive: true,
                includeTypes: ['Playlist']
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
        return <LoadingSpinner message="Loading playlists..." />;
    }

    if (isError) {
        return (
            <ErrorState
                message={error instanceof Error ? error.message : 'Failed to load playlists'}
                onRetry={refetch}
            />
        );
    }

    const playlists = data?.Items || [];
    const totalCount = data?.TotalRecordCount || 0;

    if (playlists.length === 0) {
        return (
            <Box style={{ padding: '24px' }}>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Heading.H3>Playlists</Heading.H3>
                    <Button
                        startDecorator={<AddIcon />}
                        onClick={e => {
                            setCreateMenuAnchor(e.currentTarget);
                            setIsCreateMenuOpen(true);
                        }}
                    >
                        Create
                    </Button>
                    <Menu open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen} trigger={<></>}>
                        <MenuContent>
                            <MenuItem
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                }}
                            >
                                <AddIcon />
                                Empty Playlist
                            </MenuItem>
                        </MenuContent>
                    </Menu>
                </Flex>
                <EmptyState title="No Playlists" description="Create playlists to organize your media." />
            </Box>
        );
    }

    return (
        <Box style={{ padding: '24px' }}>
            <Flex
                style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}
            >
                <Heading.H3>Playlists</Heading.H3>
                <Flex style={{ alignItems: 'center', gap: '16px' }}>
                    <Button
                        startDecorator={<AddIcon />}
                        onClick={e => {
                            setCreateMenuAnchor(e.currentTarget);
                            setIsCreateMenuOpen(true);
                        }}
                        size="sm"
                    >
                        Create
                    </Button>
                    <Menu open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen} trigger={<></>}>
                        <MenuContent>
                            <MenuItem
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                }}
                            >
                                <AddIcon />
                                Empty Playlist
                            </MenuItem>
                        </MenuContent>
                    </Menu>
                    <FormControl>
                        <FormLabel>Sort</FormLabel>
                        <Select
                            value={sortBy}
                            onValueChange={value => {
                                setSortBy(value as SortOption);
                                setPageIndex(0);
                            }}
                        >
                            <SelectTrigger style={{ minWidth: '140px' }}>
                                <SortIcon />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Name">Name</SelectItem>
                                <SelectItem value="DateCreated">Date Created</SelectItem>
                                <SelectItem value="DateModified">Date Modified</SelectItem>
                                <SelectItem value="SongCount">Songs</SelectItem>
                                <SelectItem value="PlayCount">Plays</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <Flex style={{ gap: '4px' }}>
                        <IconButton
                            variant={viewStyle === 'List' ? 'solid' : 'plain'}
                            onClick={() => setViewStyle('List')}
                            size="sm"
                        >
                            <ViewListIcon />
                        </IconButton>
                        <IconButton
                            variant={viewStyle === 'Poster' ? 'solid' : 'plain'}
                            onClick={() => setViewStyle('Poster')}
                            size="sm"
                        >
                            <ViewModuleIcon />
                        </IconButton>
                    </Flex>
                </Flex>
            </Flex>

            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text size="sm" color="secondary">
                    {totalCount} playlist{totalCount !== 1 ? 's' : ''}
                </Text>
                {(hasPreviousPage || hasNextPage) && (
                    <Flex style={{ alignItems: 'center', gap: '8px' }}>
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

            <MediaGrid items={playlists} showPlayButtons />
        </Box>
    );
};

export default Playlists;
