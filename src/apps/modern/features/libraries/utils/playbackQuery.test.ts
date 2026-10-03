import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { describe, expect, it } from 'vitest';

import { LibraryTab } from 'types/libraryTab';

import { getHomeVideosPlaybackMediaType, toPlaybackQuery } from './playbackQuery';

describe('toPlaybackQuery', () => {
    it('Should drop empty values', () => {
        expect(toPlaybackQuery({
            isHd: undefined,
            filters: [],
            genres: null
        })).toEqual({});
    });

    it('Should PascalCase keys and keep scalar values', () => {
        expect(toPlaybackQuery({
            isHd: false,
            is4K: true,
            parentIndexNumber: 0
        })).toEqual({
            IsHd: false,
            Is4K: true,
            ParentIndexNumber: 0
        });
    });

    it('Should comma join arrays', () => {
        expect(toPlaybackQuery({
            filters: [ItemFilter.IsUnplayed, ItemFilter.IsFavorite],
            years: [2020, 2021]
        })).toEqual({
            Filters: 'IsUnplayed,IsFavorite',
            Years: '2020,2021'
        });
    });

    it('Should pipe join arrays the server expects pipe delimited', () => {
        expect(toPlaybackQuery({
            genres: ['Action', 'Comedy'],
            officialRatings: ['PG', 'PG-13'],
            tags: ['a,b', 'c']
        })).toEqual({
            Genres: 'Action|Comedy',
            OfficialRatings: 'PG|PG-13',
            Tags: 'a,b|c'
        });
    });
});

describe('getHomeVideosPlaybackMediaType', () => {
    it('Should return undefined for other library types', () => {
        expect(getHomeVideosPlaybackMediaType(LibraryTab.Videos, CollectionType.Movies)).toBeUndefined();
        expect(getHomeVideosPlaybackMediaType(LibraryTab.Photos, undefined)).toBeUndefined();
    });

    it('Should match the media type of the tab', () => {
        expect(getHomeVideosPlaybackMediaType(LibraryTab.Videos, CollectionType.Homevideos)).toBe(MediaType.Video);
        expect(getHomeVideosPlaybackMediaType(LibraryTab.Photos, CollectionType.Homevideos)).toBe(MediaType.Photo);
        expect(getHomeVideosPlaybackMediaType(LibraryTab.PhotoAlbums, CollectionType.Homevideos)).toBe(MediaType.Photo);
    });

    it('Should let the playback manager decide for the folders tab', () => {
        expect(getHomeVideosPlaybackMediaType(LibraryTab.Folders, CollectionType.Homevideos)).toBeUndefined();
    });
});
