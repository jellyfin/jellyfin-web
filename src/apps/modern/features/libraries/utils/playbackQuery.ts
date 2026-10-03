import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import { LibraryTab } from 'types/libraryTab';

/** Query parameters the server binds with a pipe delimiter instead of a comma. */
const PIPE_DELIMITED_PARAMS = new Set(['genres', 'officialRatings', 'tags']);

type PlaybackQueryValue = string | number | boolean;

/**
 * Converts a library filters query (as built for the SDK by `getFiltersQuery`) into the
 * PascalCase, string-serialized form the playback manager passes to `apiClient.getItems`.
 *
 * Empty values are dropped and arrays are joined with the delimiter the server expects, so
 * e.g. multiple selected genres are not sent as a single comma-joined genre name.
 */
export const toPlaybackQuery = (query: Record<string, unknown>) => {
    const result: Record<string, PlaybackQueryValue> = {};

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;

        const paramName = key.charAt(0).toUpperCase() + key.slice(1);

        if (Array.isArray(value)) {
            if (!value.length) continue;
            result[paramName] = value.join(PIPE_DELIMITED_PARAMS.has(key) ? '|' : ',');
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            result[paramName] = value;
        }
    }

    return result;
};

/**
 * Home Videos and Photos libraries can only queue one media type at a time, so pick the one
 * that matches the tab the user is on. `undefined` lets the playback manager decide
 * (videos if the library has any, otherwise photos).
 */
export const getHomeVideosPlaybackMediaType = (
    viewType: LibraryTab,
    collectionType: CollectionType | undefined
): MediaType | undefined => {
    if (collectionType !== CollectionType.Homevideos) return undefined;

    switch (viewType) {
        case LibraryTab.Photos:
        case LibraryTab.PhotoAlbums:
            return MediaType.Photo;
        case LibraryTab.Videos:
            return MediaType.Video;
        default:
            return undefined;
    }
};
