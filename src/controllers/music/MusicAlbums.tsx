/**
 * Music Albums View
 *
 * React-based music albums browsing view with TanStack Query and Joy UI.
 */

import React, { useState } from 'react';

import { IconButton } from 'ui-primitives/IconButton';
import { Button } from 'ui-primitives/Button';
import { Text } from 'ui-primitives/Text';

import PlayArrow from '@mui/icons-material/PlayArrow';
import Shuffle from '@mui/icons-material/Shuffle';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { MediaGrid } from 'components/joy-ui/media';
import { FilterDialog, SortMenu } from 'components/joy-ui/dialogs';
import { useFilterStore } from 'store/filterStore';
import { useSortStore } from 'store/sortStore';
import { useListStore } from 'store/listStore';
import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { playbackManagerBridge } from 'store/playbackManagerBridge';

import * as styles from './MusicAlbums.css';

export const MusicAlbums: React.FC = () => {
    const { topParentId } = useParams<{ topParentId: string }>();
    const { viewMode, setViewMode } = useListStore();
    const { genres, years, artists } = useFilterStore();
    const { sortBy, sortOrder } = useSortStore();

    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    const queryKey = queryKeys.items(topParentId, {
        IncludeItemTypes: 'MusicAlbum',
        Recursive: true,
        SortBy: sortBy,
        SortOrder: sortOrder,
        Genres: genres,
        Years: years,
        ArtistIds: artists,
    });

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => getItems(topParentId, {
            IncludeItemTypes: 'MusicAlbum',
            Recursive: true,
            SortBy: sortBy,
            SortOrder: sortOrder,
            Genres: genres.length > 0 ? genres : undefined,
            Years: years.length > 0 ? years : undefined,
            ArtistIds: artists.length > 0 ? artists : undefined,
            Fields: 'PrimaryImageAspectRatio,SortName,AlbumArtist',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        }),
        enabled: !!topParentId,
    });

    const handlePlayAll = () => {
        if (data?.Items?.[0]) {
            playbackManagerBridge.playItem(data.Items[0]);
        }
    };

    const handleShuffle = () => {
        if (data?.Items) {
            playbackManagerBridge.shufflePlay(data.Items);
        }
    };

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
                            <PlayArrow style={{ marginRight: '8px' }} />
                            Play
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleShuffle}
                            disabled={!data?.Items?.length}
                        >
                            <Shuffle style={{ marginRight: '8px' }} />
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
                                variant={viewMode === 'Poster' ? 'solid' : 'plain'}
                                onClick={() => setViewMode('Poster')}
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
                                variant={viewMode === 'List' ? 'solid' : 'plain'}
                                onClick={() => setViewMode('List')}
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
