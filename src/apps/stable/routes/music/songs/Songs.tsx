/**
 * Songs View
 *
 * React-based songs/tracks browsing view with TanStack Query and Joy UI.
 */

import React, { useState, useCallback } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { IconButton } from 'ui-primitives/IconButton';
import { Button } from 'ui-primitives/Button';
import { Text } from 'ui-primitives/Text';

import { PlayIcon, ShuffleIcon } from '@radix-ui/react-icons';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { MediaGrid } from 'components/media';
import { FilterDialog, SortMenu } from 'components/dialogs';
import { useFilterStore } from 'store/filterStore';
import { useSortStore } from 'store/sortStore';
import { useListStore } from 'store/listStore';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { appRouter } from 'components/router/appRouter';
import { toPlayableItem } from 'lib/utils/playbackUtils';

import * as styles from './Songs.css';

export const Songs: React.FC = () => {
    const { topParentId } = useParams({ strict: false }) as { topParentId?: string };
    const { viewMode, setViewMode } = useListStore();
    const { genres, artists } = useFilterStore();
    const { sortBy, sortOrder } = useSortStore();

    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    const queryKey = queryKeys.items(topParentId, {
        includeTypes: ['Audio'],
        recursive: true,
        sortBy: sortBy,
        sortOrder: sortOrder,
        genres: genres,
        artistIds: artists
    });

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () =>
            getItems(topParentId ?? '', {
                includeTypes: ['Audio'],
                recursive: true,
                sortBy: sortBy,
                sortOrder: sortOrder,
                genres: genres.length > 0 ? genres : undefined,
                artistIds: artists.length > 0 ? artists : undefined
            }),
        enabled: !!topParentId
    });

    const handlePlayAll = () => {
        if (data?.Items) {
            const playableItems = data.Items as any[];
            playbackManagerBridge.setQueue(playableItems, 0);
            playbackManagerBridge.play();
        }
    };

    const handleShuffle = () => {
        if (data?.Items) {
            const shuffledItems = [...data.Items].sort(() => Math.random() - 0.5) as any[];
            playbackManagerBridge.setQueue(shuffledItems, 0);
            playbackManagerBridge.play();
        }
    };

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toPlayableItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[Songs] Failed to play song', error);
        }
    }, []);

    const hasActiveFilters = genres.length > 0 || artists.length > 0;

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <Text color="error">Error loading songs</Text>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.buttonGroup}>
                        <Button variant="primary" onClick={handlePlayAll} disabled={!data?.Items?.length}>
                            <PlayIcon style={{ marginRight: '8px' }} />
                            Play All
                        </Button>
                        <Button variant="secondary" onClick={handleShuffle} disabled={!data?.Items?.length}>
                            <ShuffleIcon style={{ marginRight: '8px' }} />
                            Shuffle
                        </Button>
                    </div>
                    <div className={styles.buttonRow}>
                        <Button
                            variant={hasActiveFilters ? 'primary' : 'secondary'}
                            onClick={() => setFilterOpen(true)}
                        >
                            Filter
                        </Button>
                        <div className={styles.sortButtonContainer}>
                            <Button variant="secondary" onClick={() => setSortOpen(true)}>
                                Sort
                            </Button>
                            <SortMenu open={sortOpen} onClose={() => setSortOpen(false)} />
                        </div>
                        <div className={styles.viewToggleGroup}>
                            <IconButton
                                variant="solid"
                                color="primary"
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                            >
                                <div className={styles.iconButtonGrid}>
                                    <div className={styles.gridIcon} />
                                    <div className={styles.gridIcon} />
                                    <div className={styles.gridIcon} />
                                    <div className={styles.gridIcon} />
                                </div>
                            </IconButton>
                            <IconButton
                                variant="solid"
                                color="primary"
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                            >
                                <div className={styles.iconButtonList}>
                                    <div className={styles.listIcon} />
                                    <div className={styles.listIcon} />
                                    <div className={styles.listIcon} />
                                </div>
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>

            {hasActiveFilters && (
                <div className={styles.filterRow}>
                    {genres.map(genre => (
                        <div key={genre} className={styles.filterChip}>
                            <Text size="xs">{genre}</Text>
                        </div>
                    ))}
                    {artists.map(artist => (
                        <div key={artist} className={styles.filterChip}>
                            <Text size="xs">{artist}</Text>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.gridContainer}>
                <MediaGrid
                    items={data?.Items || []}
                    viewMode={viewMode}
                    loading={isLoading}
                    totalCount={data?.TotalRecordCount || 0}
                    showArtist
                    onItemClick={handleItemClick}
                    onItemPlay={handleItemPlay}
                    showPlayButtons
                />
            </div>

            <FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} onApply={() => setFilterOpen(false)} />
        </div>
    );
};

export default Songs;
