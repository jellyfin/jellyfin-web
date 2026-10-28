import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';

/**
 * Legacy `ApiClient.getItems` queries use PascalCase keys and comma-separated strings for lists.
 * The SDK uses camelCase keys and arrays. This is only for the public playback boundary
 * (`playbackManager.getItemsForPlayback` and `play({ queryOptions })`), where external callers
 * still pass the legacy shape. Remove it together with those legacy inputs.
 */

type ItemsParam = keyof LibraryApiGetItemsRequest;

/** Every parameter of the SDK getItems request typed against the SDK. */
const ITEMS_PARAMS = [
    'userId', 'maxOfficialRating', 'hasThemeSong', 'hasThemeVideo', 'hasSubtitles', 'hasSpecialFeature',
    'hasTrailer', 'adjacentTo', 'indexNumber', 'parentIndexNumber', 'hasParentalRating', 'isHd', 'is4K',
    'locationTypes', 'excludeLocationTypes', 'isMissing', 'isUnaired', 'minCommunityRating', 'minCriticRating',
    'minPremiereDate', 'minDateLastSaved', 'minDateLastSavedForUser', 'maxPremiereDate', 'hasOverview',
    'hasImdbId', 'hasTmdbId', 'hasTvdbId', 'isMovie', 'isSeries', 'isNews', 'isKids', 'isSports',
    'excludeItemIds', 'startIndex', 'limit', 'recursive', 'searchTerm', 'sortOrder', 'parentId', 'fields',
    'excludeItemTypes', 'includeItemTypes', 'filters', 'isFavorite', 'mediaTypes', 'imageTypes', 'sortBy',
    'isPlayed', 'genres', 'officialRatings', 'tags', 'years', 'enableUserData', 'imageTypeLimit',
    'enableImageTypes', 'person', 'personIds', 'personTypes', 'studios', 'artists', 'excludeArtistIds',
    'artistIds', 'albumArtistIds', 'contributingArtistIds', 'albums', 'albumIds', 'ids', 'videoTypes',
    'minOfficialRating', 'isLocked', 'isPlaceHolder', 'hasOfficialRating', 'collapseBoxSetItems', 'minWidth',
    'minHeight', 'maxWidth', 'maxHeight', 'is3D', 'seriesStatus', 'nameStartsWithOrGreater', 'nameStartsWith',
    'nameLessThan', 'studioIds', 'genreIds', 'audioLanguages', 'subtitleLanguages', 'enableTotalRecordCount',
    'enableImages'
] as const satisfies readonly ItemsParam[];

/** Lower-cased parameter name to SDK parameter name, so any casing of a legacy key resolves (`IsHD` to `isHd`). */
const PARAM_NAMES: ReadonlyMap<string, ItemsParam> = new Map(
    ITEMS_PARAMS.map(name => [ name.toLowerCase(), name ])
);

/** SDK parameters that are arrays. */
const LIST_PARAMS: ReadonlySet<ItemsParam> = new Set<ItemsParam>([
    'locationTypes', 'excludeLocationTypes', 'excludeItemIds', 'sortOrder', 'fields', 'excludeItemTypes',
    'includeItemTypes', 'filters', 'mediaTypes', 'imageTypes', 'sortBy', 'genres', 'officialRatings', 'tags',
    'years', 'enableImageTypes', 'personIds', 'personTypes', 'studios', 'artists', 'excludeArtistIds',
    'artistIds', 'albumArtistIds', 'contributingArtistIds', 'albums', 'albumIds', 'ids', 'videoTypes',
    'seriesStatus', 'studioIds', 'genreIds', 'audioLanguages', 'subtitleLanguages'
]);

/**
 * Converts a legacy getItems query to SDK request parameters.
 *
 * Keys are matched case-insensitively. Keys that are not SDK getItems parameters are dropped
 * (the SDK would ignore them), as are null, undefined and empty-string values.
 * Comma-separated strings for list parameters are split into arrays.
 */
export function toItemsRequest(query?: Record<string, unknown> | null): LibraryApiGetItemsRequest {
    const params: Record<string, unknown> = {};

    for (const [ key, value ] of Object.entries(query ?? {})) {
        if (value === undefined || value === null || value === '') continue;

        const name = PARAM_NAMES.get(key.toLowerCase());
        if (!name) {
            console.warn(`[toItemsRequest] Could not map unknown parameter: ${key}`, value);
            continue;
        }

        params[name] = LIST_PARAMS.has(name) && typeof value === 'string' ?
            value.split(',') :
            value;
    }

    return params as LibraryApiGetItemsRequest;
}
