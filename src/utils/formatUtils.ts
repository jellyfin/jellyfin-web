/**
 * Format Utilities
 *
 * Helper functions for formatting display values.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

/**
 * Format artist name with proper handling for various input types
 */
export const formatArtistName = (
    artist: BaseItemDto | { Name?: string; ProductionYear?: number } | string | null
): string => {
    if (artist === null || artist === undefined) return 'Unknown Artist';

    if (typeof artist === 'string') {
        return artist || 'Unknown Artist';
    }

    if ('Name' in artist) {
        return artist.Name ?? 'Unknown Artist';
    }

    return 'Unknown Artist';
};

/**
 * Format album name with proper handling
 */
export const formatAlbumName = (album: BaseItemDto | { Name?: string } | null): string => {
    if (album === null || album === undefined) return 'Unknown Album';

    if (typeof album === 'string') {
        return album || 'Unknown Album';
    }

    if ('Name' in album) {
        return album.Name ?? 'Unknown Album';
    }

    return 'Unknown Album';
};

/**
 * Format movie/show title
 */
export const formatTitle = (item: BaseItemDto | { Name?: string; OriginalTitle?: string } | null): string => {
    if (item === null || item === undefined) return 'Unknown';

    if (typeof item === 'string') {
        return item || 'Unknown';
    }

    return item.Name ?? item.OriginalTitle ?? 'Unknown';
};

/**
 * Format runtime from ticks to human readable string
 */
export const formatRuntime = (runTimeTicks?: number | null): string => {
    if (runTimeTicks === null || runTimeTicks === undefined) return '';

    const seconds = Math.round(runTimeTicks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

/**
 * Format release year from production year
 */
export const formatYear = (productionYear?: number | null): string => {
    if (productionYear === null || productionYear === undefined) return '';
    return String(productionYear);
};

/**
 * Format rating (e.g., 8.5 -> 8.5)
 */
export const formatRating = (rating?: number | null): string => {
    if (rating === null || rating === undefined) return '';
    return rating.toFixed(1);
};

/**
 * Format file size from bytes
 */
export const formatFileSize = (bytes?: number | null): string => {
    if (bytes === null || bytes === undefined) return '';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Format count (e.g., 1500 -> 1,500)
 */
export const formatCount = (count?: number | null): string => {
    if (count === null || count === undefined) return '0';
    return new Intl.NumberFormat().format(count);
};

/**
 * Format playback position from ticks
 */
export const formatPlaybackPosition = (positionTicks?: number | null): string => {
    if (positionTicks === null || positionTicks === undefined) return '0:00';

    const seconds = Math.round(positionTicks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format artist item name (used in card displays)
 */
export const formatArtistItemName = (item: BaseItemDto): string => {
    if (item.Type === 'MusicArtist') {
        return item.Name ?? 'Unknown Artist';
    }
    if (item.Type === 'MusicAlbum' || item.Type === 'Audio') {
        return item.AlbumArtist ?? item.Artists?.[0] ?? 'Unknown Artist';
    }
    return item.Name ?? 'Unknown';
};

/**
 * Format episode number for TV shows
 */
export const formatEpisodeNumber = (index?: number | null): string => {
    if (index === null || index === undefined) return '';
    return `E${index}`;
};

/**
 * Format season number for TV shows
 */
export const formatSeasonNumber = (index?: number | null): string => {
    if (index === null || index === undefined) return '';
    return `S${index}`;
};
