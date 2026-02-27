import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { describe, expect, it, vi } from 'vitest';

import { LibraryTab } from 'types/libraryTab';
import { ViewMode } from 'types/library';
import type { LibraryViewSettings } from 'types/library';

import { getFieldsQuery } from './items';

vi.mock('scripts/settings/userSettings');
vi.mock('components/layoutManager', () => ({ default: {} }));

const baseSettings: LibraryViewSettings = {
    SortBy: ItemSortBy.SortName,
    SortOrder: SortOrder.Ascending,
    StartIndex: 0,
    CardLayout: false,
    ImageType: ImageType.Primary,
    ViewMode: ViewMode.GridView,
    ShowTitle: true
};

describe('getFieldsQuery', () => {
    it('should include OriginalTitle field when useOriginalTitles is true', () => {
        const result = getFieldsQuery(LibraryTab.Movies, baseSettings, true);
        expect(result.fields).toContain(ItemFields.OriginalTitle);
    });

    it('should not include OriginalTitle field when useOriginalTitles is false', () => {
        const result = getFieldsQuery(LibraryTab.Movies, baseSettings, false);
        expect(result.fields).not.toContain(ItemFields.OriginalTitle);
    });

    it('should not include OriginalTitle field when useOriginalTitles is not provided', () => {
        const result = getFieldsQuery(LibraryTab.Movies, baseSettings);
        expect(result.fields).not.toContain(ItemFields.OriginalTitle);
    });
});
