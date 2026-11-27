import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { describe, expect, it, vi } from 'vitest';

import { type LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import { getItemsViewRequest } from './useItemsViewByType';

vi.mock('scripts/settings/userSettings', () => ({
    libraryPageSize: () => 100
}));

vi.mock('components/layoutManager', () => ({
    default: { tv: false }
}));

vi.mock('hooks/useApi', () => ({
    useApi: vi.fn()
}));

const baseSettings: LibraryViewSettings = {
    ShowTitle: true,
    ShowYear: true,
    ViewMode: ViewMode.GridView,
    ImageType: ImageType.Primary,
    CardLayout: false,
    SortBy: [ItemSortBy.SortName],
    SortOrder: SortOrder.Ascending,
    StartIndex: 0
};

describe('getItemsViewRequest', () => {
    it('builds the same request the library view used before it was extracted', () => {
        const settings: LibraryViewSettings = {
            ...baseSettings,
            StartIndex: 100,
            Alphabet: 'C',
            Filters: { Status: [ItemFilter.IsUnplayed], Years: [2020] }
        };

        expect(getItemsViewRequest('user', LibraryTab.Movies, 'library', [BaseItemKind.Movie], settings)).toEqual({
            userId: 'user',
            recursive: true,
            imageTypeLimit: 1,
            parentId: 'library',
            enableImageTypes: [ImageType.Primary, ImageType.Backdrop],
            fields: [ItemFields.MediaSourceCount, ItemFields.PrimaryImageAspectRatio],
            filters: [ItemFilter.IsUnplayed],
            years: [2020],
            limit: 100,
            nameStartsWith: 'C',
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            includeItemTypes: [BaseItemKind.Movie],
            startIndex: 100
        });
    });

    it('uses nameLessThan for the "#" alphabet filter', () => {
        const request = getItemsViewRequest('user', LibraryTab.Movies, 'library', [BaseItemKind.Movie], {
            ...baseSettings,
            Alphabet: '#'
        });

        expect(request.nameLessThan).toBe('A');
        expect(request.nameStartsWith).toBeUndefined();
    });

    it('only sets isFavorite for the favorites tab', () => {
        expect(getItemsViewRequest('user', LibraryTab.Favorites, 'library', [], baseSettings).isFavorite).toBe(true);
        expect(getItemsViewRequest('user', LibraryTab.Movies, 'library', [], baseSettings).isFavorite).toBeUndefined();
    });

    it('applies the episode filters for the episodes tab', () => {
        const request = getItemsViewRequest('user', LibraryTab.Episodes, 'library', [BaseItemKind.Episode], baseSettings);

        expect(request.isMissing).toBe(false);
        expect(request.includeItemTypes).toEqual([BaseItemKind.Episode]);
    });

    it('omits the parent id when there is none', () => {
        expect(getItemsViewRequest('user', LibraryTab.Movies, null, [], baseSettings).parentId).toBeUndefined();
    });
});
