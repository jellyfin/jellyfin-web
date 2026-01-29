/**
 * Music Albums View
 *
 * React-based music albums browsing view with TanStack Query and Joy UI.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { PlayIcon, ShuffleIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { FilterDialog, SortMenu } from 'components/dialogs';
import { MediaGrid } from 'components/media';
import { appRouter } from 'components/router/appRouter';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { toPlayableItem } from 'lib/utils/playbackUtils';
import React, { useCallback, useState } from 'react';
import { useFilterStore } from 'store/filterStore';
import { useListStore } from 'store/listStore';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { useSortStore } from 'store/sortStore';
import { Button, IconButton, Text } from 'ui-primitives';

import * as styles from './MusicAlbums.css.ts';

export const MusicAlbums: React.FC = () => {
    const { topParentId } = useParams({ strict: false }) as { topParentId?: string };
    const { viewMode, setViewMode } = useListStore();
    const { genres, years, artists } = useFilterStore();
    const { sortBy, sortOrder } = useSortStore();

    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    const queryKey = queryKeys.items(topParentId, {
        includeTypes: ['MusicAlbum'],
        recursive: true,
        sortBy: sortBy,
        sortOrder: sortOrder,
        genres: genres,
        years: years,
        artistIds: artists
    });

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () =>
            getItems(topParentId ?? '', {
                includeTypes: ['MusicAlbum'],
                recursive: true,
                sortBy: sortBy,
                sortOrder: sortOrder,
                genres: genres.length > 0 ? genres : undefined,
                years: years.length > 0 ? years : undefined,
                artistIds: artists.length > 0 ? artists : undefined
            }),
        enabled: !!topParentId
    });

    const handlePlayAll = () => {
        if (data?.Items?.[0]) {
            const playableItem = data.Items[0] as any;
            playbackManagerBridge.setQueue([playableItem], 0);
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
            console.error('[MusicAlbums] Failed to play album', error);
        }
    }, []);

    const hasActiveFilters = genres.length > 0 || years.length > 0 || artists.length > 0;

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <Text color="error">Error loading albums</Text>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.buttonGroup}>
                        <Button
                            variant="primary"
                            onClick={handlePlayAll}
                            disabled={!data?.Items?.length}
                        >
                            <PlayIcon style={{ marginRight: '8px' }} />
                            Play
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleShuffle}
                            disabled={!data?.Items?.length}
                        >
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
                    {genres.map((genre) => (
                        <div key={genre} className={styles.filterChip}>
                            <Text size="xs">{genre}</Text>
                        </div>
                    ))}
                    {years.map((year) => (
                        <div key={year} className={styles.filterChip}>
                            <Text size="xs">{year}</Text>
                        </div>
                    ))}
                    {artists.map((artist) => (
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
                    showAlbumArtist
                    onItemClick={handleItemClick}
                    onItemPlay={handleItemPlay}
                    showPlayButtons
                />
            </div>

            <FilterDialog
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                onApply={() => setFilterOpen(false)}
            />
        </div>
    );
};

export default MusicAlbums;
