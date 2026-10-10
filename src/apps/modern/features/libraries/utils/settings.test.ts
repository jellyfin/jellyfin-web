import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { describe, expect, it } from 'vitest';

import { getSortSettingsFromUrl } from './settings';

describe('getSortSettingsFromUrl', () => {
    it('parses valid sort settings', () => {
        expect(getSortSettingsFromUrl('DateCreated,SortName', 'Descending')).toEqual({
            SortBy: [ItemSortBy.DateCreated, ItemSortBy.SortName],
            SortOrder: SortOrder.Descending
        });
    });

    it('ignores missing sort settings', () => {
        expect(getSortSettingsFromUrl(null, 'Descending')).toBeUndefined();
        expect(getSortSettingsFromUrl('DateCreated', null)).toBeUndefined();
    });

    it('ignores invalid sort orders', () => {
        expect(getSortSettingsFromUrl('DateCreated', 'Newest')).toBeUndefined();
    });

    it('ignores invalid sort fields', () => {
        expect(getSortSettingsFromUrl('Newest', 'Descending')).toBeUndefined();
    });
});
