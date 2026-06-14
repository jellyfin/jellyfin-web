import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import type { LibraryTabContent } from 'types/libraryTabContent';

import booksViews from './books';
import boxSetsViews from './boxsets';
import homeVideosViews from './homevideos';
import liveTvViews from './livetv';
import mixedViews from './mixed';
import moviesViews from './movies';
import musicViews from './music';
import musicVideosViews from './musicvideos';
import playlistsViews from './playlists';
import tvShowsViews from './tvshows';

const viewsByKind: Record<CollectionType, Record<number, LibraryTabContent>> = {
    [CollectionType.Books]: booksViews,
    [CollectionType.Boxsets]: boxSetsViews,
    [CollectionType.Folders]: {},
    [CollectionType.Homevideos]: homeVideosViews,
    [CollectionType.Livetv]: liveTvViews,
    [CollectionType.Movies]: moviesViews,
    [CollectionType.Music]: musicViews,
    [CollectionType.Musicvideos]: musicVideosViews,
    [CollectionType.Photos]: homeVideosViews,
    [CollectionType.Playlists]: playlistsViews,
    [CollectionType.Trailers]: {},
    [CollectionType.Tvshows]: tvShowsViews,
    // Technically mixed libraries have an undefined collection type, but unknown is otherwise unused
    [CollectionType.Unknown]: mixedViews
};

export default viewsByKind;
