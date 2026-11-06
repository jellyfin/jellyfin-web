import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { describe, expect, it } from 'vitest';

import { LibraryTab } from 'types/libraryTab';

import { SHUFFLE_ITEMS_LIMIT, getShuffleItemsRequest, isServerShuffleTab } from './shuffle';

describe('getShuffleItemsRequest', () => {
    const viewRequest: LibraryApiGetItemsRequest = {
        userId: 'user',
        parentId: 'library',
        recursive: true,
        fields: [ItemFields.MediaSourceCount],
        filters: [ItemFilter.IsUnplayed],
        isFavorite: true,
        nameStartsWith: 'C',
        nameLessThan: undefined,
        years: [2020],
        genres: ['Comedy'],
        includeItemTypes: [BaseItemKind.Movie],
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        startIndex: 200,
        limit: 100
    };

    it('requests a random selection from the first item', () => {
        const request = getShuffleItemsRequest(viewRequest);

        expect(request.sortBy).toEqual([ItemSortBy.Random]);
        expect(request.startIndex).toBe(0);
        expect(request.limit).toBe(SHUFFLE_ITEMS_LIMIT);
        expect(SHUFFLE_ITEMS_LIMIT).toBe(300);
    });

    it('requests the fields needed for playback', () => {
        expect(getShuffleItemsRequest(viewRequest).fields).toEqual([
            ItemFields.Chapters,
            ItemFields.MediaSources,
            ItemFields.Trickplay
        ]);
    });

    it('excludes virtual items such as unaired episodes', () => {
        expect(getShuffleItemsRequest(viewRequest).excludeLocationTypes).toEqual([LocationType.Virtual]);
    });

    it('does not group movies into collections', () => {
        expect(getShuffleItemsRequest({ ...viewRequest, collapseBoxSetItems: true }).collapseBoxSetItems).toBe(false);
    });

    it('keeps the filters of the library view', () => {
        expect(getShuffleItemsRequest(viewRequest)).toMatchObject({
            userId: 'user',
            parentId: 'library',
            recursive: true,
            filters: [ItemFilter.IsUnplayed],
            isFavorite: true,
            nameStartsWith: 'C',
            years: [2020],
            genres: ['Comedy'],
            includeItemTypes: [BaseItemKind.Movie]
        });
    });

    it('does not modify the original request', () => {
        const original = JSON.parse(JSON.stringify(viewRequest)) as LibraryApiGetItemsRequest;

        getShuffleItemsRequest(viewRequest);

        expect(viewRequest).toEqual(original);
    });
});

describe('isServerShuffleTab', () => {
    it.each([
        LibraryTab.Episodes,
        LibraryTab.Movies,
        LibraryTab.MusicVideos,
        LibraryTab.Songs
    ])('shuffles the %s tab on the server', viewType => {
        expect(isServerShuffleTab(viewType)).toBe(true);
    });

    it.each([
        LibraryTab.Albums,
        LibraryTab.Folders,
        LibraryTab.Mixed,
        LibraryTab.PhotoAlbums,
        LibraryTab.Photos,
        LibraryTab.Series,
        LibraryTab.Videos
    ])('keeps the existing behavior for the %s tab', viewType => {
        expect(isServerShuffleTab(viewType)).toBe(false);
    });
});
