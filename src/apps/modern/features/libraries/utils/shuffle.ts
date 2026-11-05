import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';

import { LibraryTab } from 'types/libraryTab';

/** The maximum number of items queued by shuffle; matches the legacy UI and the unfiltered library shuffle. */
export const SHUFFLE_ITEMS_LIMIT = 300;

/**
 * Tabs whose items can be played as they are. For these tabs a filtered shuffle fetches a random
 * selection from the server instead of queueing the items shown on the current page.
 */
const SERVER_SHUFFLE_TABS: ReadonlySet<LibraryTab> = new Set([
    LibraryTab.Episodes,
    LibraryTab.Movies,
    LibraryTab.MusicVideos,
    LibraryTab.Songs
]);

export const isServerShuffleTab = (viewType: LibraryTab) => SERVER_SHUFFLE_TABS.has(viewType);

/**
 * Turns a library view request into a request for a random selection of the same items,
 * starting from the first item regardless of the current page. Like the playback manager, it
 * excludes virtual items and does not group movies into collections, so every item can be played.
 */
export const getShuffleItemsRequest = (request: LibraryApiGetItemsRequest): LibraryApiGetItemsRequest => ({
    ...request,
    fields: [ItemFields.Chapters, ItemFields.MediaSources, ItemFields.Trickplay],
    excludeLocationTypes: [LocationType.Virtual],
    collapseBoxSetItems: false,
    sortBy: [ItemSortBy.Random],
    startIndex: 0,
    limit: SHUFFLE_ITEMS_LIMIT
});
