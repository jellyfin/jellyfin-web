import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { describe, expect, it } from 'vitest';

import { CardShape } from 'components/cardbuilder/utils/shape';
import { LibraryTab } from 'types/libraryTab';

import { getLibraryTabShape } from './cardShape';

describe('Utils: cardShape', () => {
    describe('Function: getLibraryTabShape', () => {
        it.each([
            [LibraryTab.Movies, CollectionType.Movies, CardShape.Portrait],
            [LibraryTab.Series, CollectionType.Tvshows, CardShape.Portrait],
            [LibraryTab.Collections, CollectionType.Movies, CardShape.Portrait],
            [LibraryTab.Collections, CollectionType.Tvshows, CardShape.Portrait],
            [LibraryTab.Episodes, CollectionType.Tvshows, CardShape.Backdrop],
            [LibraryTab.Albums, CollectionType.Music, CardShape.Square],
            [LibraryTab.AlbumArtists, CollectionType.Music, CardShape.Square],
            [LibraryTab.Artists, CollectionType.Music, CardShape.Square],
            [LibraryTab.Songs, CollectionType.Music, CardShape.Square],
            [LibraryTab.Playlists, CollectionType.Playlists, CardShape.Square],
            [LibraryTab.Playlists, undefined, CardShape.Square],
            [LibraryTab.Channels, CollectionType.Livetv, CardShape.Square],
            [LibraryTab.Favorites, CollectionType.Movies, CardShape.Portrait],
            [LibraryTab.Favorites, CollectionType.Playlists, CardShape.Square]
        ])('Should return the canonical shape for %s in %s', (viewType, collectionType, expected) => {
            expect(getLibraryTabShape(viewType, collectionType)).toEqual(expected);
        });

        it.each([
            [LibraryTab.Collections, CollectionType.Boxsets],
            [LibraryTab.Collections, CollectionType.Music],
            [LibraryTab.Collections, CollectionType.Books],
            [LibraryTab.Collections, undefined],
            [LibraryTab.Books, CollectionType.Books],
            [LibraryTab.Authors, CollectionType.Books],
            [LibraryTab.Folders, CollectionType.Movies],
            [LibraryTab.Folders, CollectionType.Homevideos],
            [LibraryTab.Photos, CollectionType.Homevideos],
            [LibraryTab.PhotoAlbums, CollectionType.Homevideos],
            [LibraryTab.Videos, CollectionType.Homevideos],
            [LibraryTab.MusicVideos, CollectionType.Musicvideos],
            [LibraryTab.Mixed, null],
            [LibraryTab.Studios, undefined],
            [LibraryTab.Favorites, CollectionType.Boxsets],
            [LibraryTab.Favorites, CollectionType.Books],
            [LibraryTab.Favorites, undefined],
            [LibraryTab.Favorites, CollectionType.Unknown]
        ])('Should return undefined for %s in %s', (viewType, collectionType) => {
            expect(getLibraryTabShape(viewType, collectionType)).toBeUndefined();
        });
    });
});
