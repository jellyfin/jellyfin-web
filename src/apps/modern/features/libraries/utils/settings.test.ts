import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { beforeEach, describe, expect, it } from 'vitest';

import { ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import {
    clearAllLibraryViewSettings,
    DefaultSortByOption,
    getDefaultLibraryViewSettings,
    getSettingsKey,
    getUserDefaultViewSettings,
    setUserDefaultViewSettings
} from './settings';

describe('getUserDefaultViewSettings()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return an empty object when nothing has been saved', () => {
        expect(getUserDefaultViewSettings()).toEqual({});
    });

    it('should return an empty object when the stored value is invalid JSON', () => {
        localStorage.setItem('libraryUserDefaultViewSettings', 'not json');
        expect(getUserDefaultViewSettings()).toEqual({});
    });
});

describe('setUserDefaultViewSettings() / getDefaultLibraryViewSettings()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should carry ViewMode and SortOrder into every library type\'s defaults', () => {
        setUserDefaultViewSettings({
            ViewMode: ViewMode.ListView,
            SortOrder: SortOrder.Descending
        });

        const movieDefaults = getDefaultLibraryViewSettings(LibraryTab.Movies);
        expect(movieDefaults.ViewMode).toBe(ViewMode.ListView);
        expect(movieDefaults.SortOrder).toBe(SortOrder.Descending);

        const studioDefaults = getDefaultLibraryViewSettings(LibraryTab.Studios);
        expect(studioDefaults.ViewMode).toBe(ViewMode.ListView);
    });

    it('should not override the type-specific ImageType default', () => {
        setUserDefaultViewSettings({
            ViewMode: ViewMode.GridView,
            SortOrder: SortOrder.Ascending
        });

        const studioDefaults = getDefaultLibraryViewSettings(LibraryTab.Studios);
        expect(studioDefaults.ImageType).toBe('Thumb');
    });

    it('should fall back to the hardcoded defaults when no user default is saved', () => {
        const movieDefaults = getDefaultLibraryViewSettings(LibraryTab.Movies);
        expect(movieDefaults.ViewMode).toBe(ViewMode.GridView);
        expect(movieDefaults.SortOrder).toBe(SortOrder.Ascending);
        expect(movieDefaults.SortBy).toEqual(['SortName']);
    });

    it('should resolve the Name sort option using each type\'s own name field', () => {
        setUserDefaultViewSettings({ SortBy: DefaultSortByOption.Name });

        expect(getDefaultLibraryViewSettings(LibraryTab.Movies).SortBy).toEqual([ItemSortBy.SortName]);
        expect(getDefaultLibraryViewSettings(LibraryTab.Episodes).SortBy).toEqual([ItemSortBy.SeriesSortName]);
    });

    it('should resolve the DateAdded sort option with a type-specific tiebreaker', () => {
        setUserDefaultViewSettings({ SortBy: DefaultSortByOption.DateAdded });

        expect(getDefaultLibraryViewSettings(LibraryTab.Movies).SortBy).toEqual([ItemSortBy.DateCreated, ItemSortBy.SortName]);
        expect(getDefaultLibraryViewSettings(LibraryTab.Episodes).SortBy).toEqual([ItemSortBy.DateCreated, ItemSortBy.SeriesSortName]);
    });

    it('should resolve the Random sort option the same for every type', () => {
        setUserDefaultViewSettings({ SortBy: DefaultSortByOption.Random });

        expect(getDefaultLibraryViewSettings(LibraryTab.Movies).SortBy).toEqual([ItemSortBy.Random]);
        expect(getDefaultLibraryViewSettings(LibraryTab.Studios).SortBy).toEqual([ItemSortBy.Random]);
    });
});

describe('clearAllLibraryViewSettings()', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should remove saved per-library settings but leave unrelated keys alone', () => {
        const movieKey = getSettingsKey(LibraryTab.Movies, 'parent-1');
        const musicKey = getSettingsKey(LibraryTab.Songs, 'parent-2');
        localStorage.setItem(movieKey, '{"ViewMode":"list"}');
        localStorage.setItem(musicKey, '{"ViewMode":"grid"}');
        localStorage.setItem('unrelatedKey', 'keep-me');

        clearAllLibraryViewSettings();

        expect(localStorage.getItem(movieKey)).toBeNull();
        expect(localStorage.getItem(musicKey)).toBeNull();
        expect(localStorage.getItem('unrelatedKey')).toBe('keep-me');
    });

    it('should leave the saved user default untouched', () => {
        setUserDefaultViewSettings({ ViewMode: ViewMode.ListView, SortOrder: SortOrder.Descending });

        clearAllLibraryViewSettings();

        expect(getUserDefaultViewSettings()).toEqual({ ViewMode: ViewMode.ListView, SortOrder: SortOrder.Descending });
    });
});
