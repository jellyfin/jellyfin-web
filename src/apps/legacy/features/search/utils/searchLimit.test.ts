import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { describe, expect, test } from 'vitest';

import { CardShape } from 'components/cardbuilder/utils/shape';

import { getSearchLimit, getSearchShapeForType, SEARCH_SECTION_PAGES } from './searchLimit';

describe('getSearchShapeForType', () => {
    test('uses portrait cards for movies, shows and collections', () => {
        expect(getSearchShapeForType(BaseItemKind.Movie)).toBe(CardShape.PortraitOverflow);
        expect(getSearchShapeForType(BaseItemKind.Series)).toBe(CardShape.PortraitOverflow);
        expect(getSearchShapeForType(BaseItemKind.BoxSet)).toBe(CardShape.PortraitOverflow);
    });

    test('uses backdrop cards for episodes and channels', () => {
        expect(getSearchShapeForType(BaseItemKind.Episode)).toBe(CardShape.BackdropOverflow);
        expect(getSearchShapeForType(BaseItemKind.TvChannel)).toBe(CardShape.BackdropOverflow);
    });

    test('uses square cards for music and photos', () => {
        expect(getSearchShapeForType(BaseItemKind.Audio)).toBe(CardShape.SquareOverflow);
        expect(getSearchShapeForType(BaseItemKind.MusicAlbum)).toBe(CardShape.SquareOverflow);
        expect(getSearchShapeForType(BaseItemKind.Playlist)).toBe(CardShape.SquareOverflow);
        expect(getSearchShapeForType(BaseItemKind.Photo)).toBe(CardShape.SquareOverflow);
        expect(getSearchShapeForType(BaseItemKind.PhotoAlbum)).toBe(CardShape.SquareOverflow);
    });

    test('falls back to square cards for other types', () => {
        expect(getSearchShapeForType(BaseItemKind.Folder)).toBe(CardShape.SquareOverflow);
    });
});

describe('getSearchLimit', () => {
    test('requests a few rows of portrait cards on a 4K landscape screen', () => {
        // 100 / 11.6 portrait cards fit per row above 1700px, rounded up to 9
        expect(getSearchLimit(CardShape.PortraitOverflow, 3840, 2160, false)).toBe(9 * SEARCH_SECTION_PAGES);
    });

    test('requests fewer backdrop cards than portrait cards at the same width', () => {
        // 100 / 18.5 backdrop cards fit per row above 1700px, rounded up to 6
        expect(getSearchLimit(CardShape.BackdropOverflow, 3840, 2160, false)).toBe(6 * SEARCH_SECTION_PAGES);
    });

    test('requests fewer cards on a phone in portrait orientation', () => {
        // 100 / 42 portrait cards fit per row below 400px, rounded up to 3
        expect(getSearchLimit(CardShape.PortraitOverflow, 390, 844, false)).toBe(3 * SEARCH_SECTION_PAGES);
    });

    test('uses the TV layout sizing regardless of resolution', () => {
        // 100 / 15.5 portrait cards fit per row on TV, rounded up to 7
        expect(getSearchLimit(CardShape.PortraitOverflow, 1280, 720, true)).toBe(7 * SEARCH_SECTION_PAGES);
    });

    test('scales with the number of pages requested', () => {
        expect(getSearchLimit(CardShape.PortraitOverflow, 1920, 1080, false, 1)).toBe(9);
        expect(getSearchLimit(CardShape.PortraitOverflow, 1920, 1080, false, 2)).toBe(18);
    });
});
