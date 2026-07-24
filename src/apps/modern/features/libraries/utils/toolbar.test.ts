import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { describe, expect, it } from 'vitest';

import { getToolbarParentItemId } from './toolbar';

describe('getToolbarParentItemId', () => {
    it('returns undefined when no item-backed toolbar buttons are enabled', () => {
        expect(getToolbarParentItemId({
            parentId: 'library-id',
            collectionType: CollectionType.Movies
        })).toBeUndefined();
    });

    it('returns the parent id when an item-backed toolbar button is enabled', () => {
        expect(getToolbarParentItemId({
            parentId: 'library-id',
            collectionType: CollectionType.Movies,
            isBtnPlayAllEnabled: true
        })).toBe('library-id');
    });

    it('does not return the synthetic Live TV route key as an item id', () => {
        expect(getToolbarParentItemId({
            parentId: 'livetv',
            collectionType: CollectionType.Livetv,
            isBtnPlayAllEnabled: true
        })).toBeUndefined();
    });

    it('returns undefined when there is no parent id', () => {
        expect(getToolbarParentItemId({
            parentId: null,
            collectionType: CollectionType.Movies,
            isBtnPlayAllEnabled: true
        })).toBeUndefined();
    });
});
