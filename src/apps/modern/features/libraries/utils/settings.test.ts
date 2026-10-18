import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { beforeEach, describe, expect, it } from 'vitest';

import { ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import { getDefaultLibraryViewSettings, getUserDefaultViewSettings, setUserDefaultViewSettings } from './settings';

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
            SortOrder: SortOrder.Descending,
            SortBy: [],
            StartIndex: 0,
            CardLayout: true,
            ImageType: ImageType.Banner,
            ShowTitle: false,
            ShowYear: false
        });

        const movieDefaults = getDefaultLibraryViewSettings(LibraryTab.Movies);
        expect(movieDefaults.ViewMode).toBe(ViewMode.ListView);
        expect(movieDefaults.SortOrder).toBe(SortOrder.Descending);
        expect(movieDefaults.CardLayout).toBe(true);
        expect(movieDefaults.ShowTitle).toBe(false);
        expect(movieDefaults.ShowYear).toBe(false);

        const studioDefaults = getDefaultLibraryViewSettings(LibraryTab.Studios);
        expect(studioDefaults.ViewMode).toBe(ViewMode.ListView);
    });

    it('should not override the type-specific SortBy or ImageType defaults', () => {
        setUserDefaultViewSettings({
            ViewMode: ViewMode.GridView,
            SortOrder: SortOrder.Ascending,
            SortBy: [],
            StartIndex: 0,
            CardLayout: false,
            ImageType: ImageType.Banner,
            ShowTitle: true,
            ShowYear: true
        });

        const episodeDefaults = getDefaultLibraryViewSettings(LibraryTab.Episodes);
        expect(episodeDefaults.SortBy).toEqual(['SeriesSortName']);

        const studioDefaults = getDefaultLibraryViewSettings(LibraryTab.Studios);
        expect(studioDefaults.ImageType).toBe(ImageType.Thumb);
    });

    it('should fall back to the hardcoded defaults when no user default is saved', () => {
        const movieDefaults = getDefaultLibraryViewSettings(LibraryTab.Movies);
        expect(movieDefaults.ViewMode).toBe(ViewMode.GridView);
        expect(movieDefaults.SortOrder).toBe(SortOrder.Ascending);
    });
});
