/**
 * Playback Utilities
 *
 * Shared utilities for converting Jellyfin API items to playable format.
 * Supports both audio and video content.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { MediaType, PlayableItem } from 'store/types';

/**
 * Detect media type from Jellyfin item type
 * @param itemType The Jellyfin item type
 * @returns The corresponding media type
 */
const detectMediaType = (itemType?: string): MediaType => {
    if (!itemType) return 'Audio';

    const videoTypes = ['Movie', 'Series', 'Episode', 'MusicVideo', 'Video'];
    const audioTypes = ['Audio', 'MusicAlbum', 'MusicArtist'];

    if (videoTypes.includes(itemType)) return 'Video';
    if (audioTypes.includes(itemType)) return 'Audio';

    // Default to Audio for backward compatibility
    return 'Audio';
};

/**
 * Convert a BaseItemDto to a PlayableItem for playback queue
 * Automatically detects media type and extracts appropriate metadata.
 * @param source The Jellyfin API item (audio or video)
 * @returns A playable item with required metadata
 */
export const toPlayableItem = (source: BaseItemDto): PlayableItem => {
    const id = source.Id ?? '';
    const name = source.Name ?? '';
    const serverId = source.ServerId ?? '';
    const mediaType = detectMediaType(source.Type);

    // Audio-specific metadata
    const artist = source.AlbumArtist ?? source.ArtistItems?.[0]?.Name ?? undefined;
    const album = source.Album ?? undefined;

    // Common metadata
    const year = source.ProductionYear ?? undefined;
    const duration = source.RunTimeTicks ? source.RunTimeTicks / 10000000 : undefined;
    const runtimeTicks = source.RunTimeTicks ?? undefined;

    return {
        id,
        name,
        serverId,
        mediaType,
        title: name,
        artist,
        album,
        year,
        duration,
        runtimeTicks
    };
};

/**
 * Convert a BaseItemDto to a PlayableItem with explicit media type for audio
 * Used for music library items where mediaType should always be Audio.
 * @param source The Jellyfin API item
 * @returns A playable item with Audio mediaType
 */
export const toAudioItem = (source: BaseItemDto): PlayableItem => {
    const playable = toPlayableItem(source);
    return {
        ...playable,
        mediaType: 'Audio'
    };
};

/**
 * Convert a BaseItemDto to a PlayableItem with explicit media type for video
 * Used for video library items where mediaType should always be Video.
 * @param source The Jellyfin API item
 * @returns A playable item with Video mediaType
 */
export const toVideoItem = (source: BaseItemDto): PlayableItem => {
    const playable = toPlayableItem(source);
    return {
        ...playable,
        mediaType: 'Video'
    };
};

/**
 * Convert multiple items to playable format
 * Automatically detects media type for each item.
 * @param items Array of Jellyfin API items
 * @returns Array of playable items
 */
export const toPlayableItems = (items: BaseItemDto[]): PlayableItem[] => {
    return items.map(toPlayableItem);
};

/**
 * Convert multiple audio items to playable format
 * @param items Array of Jellyfin audio API items
 * @returns Array of playable items with Audio mediaType
 */
export const toAudioItems = (items: BaseItemDto[]): PlayableItem[] => {
    return items.map(toAudioItem);
};

/**
 * Convert multiple video items to playable format
 * @param items Array of Jellyfin video API items
 * @returns Array of playable items with Video mediaType
 */
export const toVideoItems = (items: BaseItemDto[]): PlayableItem[] => {
    return items.map(toVideoItem);
};
