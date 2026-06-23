import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { LibraryTab } from 'types/libraryTab';

import { LibraryRoute } from '../types/LibraryRoute';

export const LibraryRoutes: LibraryRoute[] = [
    {
        path: '/livetv',
        type: CollectionType.Livetv,
        views: [
            {
                index: 0,
                label: 'Programs',
                view: LibraryTab.Programs,
                isDefault: true
            },
            {
                index: 1,
                label: 'Guide',
                view: LibraryTab.Guide
            },
            {
                index: 2,
                label: 'Channels',
                view: LibraryTab.Channels
            },
            {
                index: 3,
                label: 'Recordings',
                view: LibraryTab.Recordings
            },
            {
                index: 4,
                label: 'Schedule',
                view: LibraryTab.Schedule
            },
            {
                index: 5,
                label: 'Series',
                view: LibraryTab.SeriesTimers
            }
        ]
    },
    {
        path: '/books',
        type: CollectionType.Books,
        views: [
            {
                index: 0,
                label: 'Folders',
                view: LibraryTab.Folders,
                isDefault: true
            },
            {
                index: 1,
                label: 'Books',
                view: LibraryTab.Books
            },
            {
                index: 2,
                label: 'Authors',
                view: LibraryTab.Authors
            },
            {
                index: 3,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 4,
                label: 'Genres',
                view: LibraryTab.Genres
            },
            {
                index: 5,
                label: 'Collections',
                view: LibraryTab.Collections
            },
            {
                index: 6,
                label: 'Favorites',
                view: LibraryTab.Favorites
            }
        ]
    },
    {
        path: '/boxsets',
        type: CollectionType.Boxsets,
        views: [
            {
                index: 0,
                label: 'Collections',
                view: LibraryTab.Collections,
                isDefault: true
            },
            {
                index: 1,
                label: 'Favorites',
                view: LibraryTab.Favorites
            },
            {
                index: 2,
                label: 'Genres',
                view: LibraryTab.Genres
            }
        ]
    },
    {
        path: '/movies',
        type: CollectionType.Movies,
        views: [
            {
                index: 0,
                label: 'Movies',
                view: LibraryTab.Movies,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'Favorites',
                view: LibraryTab.Favorites
            },
            {
                index: 3,
                label: 'Collections',
                view: LibraryTab.Collections
            },
            {
                index: 4,
                label: 'Genres',
                view: LibraryTab.Genres
            },
            {
                index: 5,
                label: 'Studios',
                view: LibraryTab.Studios
            },
            {
                index: 6,
                label: 'Playlists',
                view: LibraryTab.Playlists
            }
        ]
    },
    {
        path: '/music',
        type: CollectionType.Music,
        views: [
            {
                index: 0,
                label: 'Albums',
                view: LibraryTab.Albums,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'HeaderAlbumArtists',
                view: LibraryTab.AlbumArtists
            },
            {
                index: 3,
                label: 'Artists',
                view: LibraryTab.Artists
            },
            {
                index: 4,
                label: 'Playlists',
                view: LibraryTab.Playlists
            },
            {
                index: 5,
                label: 'Songs',
                view: LibraryTab.Songs
            },
            {
                index: 6,
                label: 'Genres',
                view: LibraryTab.Genres
            },
            {
                index: 7,
                label: 'Collections',
                view: LibraryTab.Collections
            }
        ]
    },
    {
        path: '/tv',
        type: CollectionType.Tvshows,
        views: [
            {
                index: 0,
                label: 'Shows',
                view: LibraryTab.Series,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'TabUpcoming',
                view: LibraryTab.Upcoming
            },
            {
                index: 3,
                label: 'Genres',
                view: LibraryTab.Genres
            },
            {
                index: 4,
                label: 'TabNetworks',
                view: LibraryTab.Studios
            },
            {
                index: 5,
                label: 'Episodes',
                view: LibraryTab.Episodes
            },
            {
                index: 6,
                label: 'Collections',
                view: LibraryTab.Collections
            },
            {
                index: 7,
                label: 'Playlists',
                view: LibraryTab.Playlists
            }
        ]
    },
    {
        path: '/homevideos',
        type: CollectionType.Homevideos,
        views: [
            {
                index: 0,
                label: 'Folders',
                view: LibraryTab.Folders,
                isDefault: true
            },
            {
                index: 1,
                label: 'Photos',
                view: LibraryTab.Photos
            },
            {
                index: 2,
                label: 'HeaderPhotoAlbums',
                view: LibraryTab.PhotoAlbums
            },
            {
                index: 3,
                label: 'HeaderVideos',
                view: LibraryTab.Videos
            }
        ]
    },
    {
        path: '/musicvideos',
        type: CollectionType.Musicvideos,
        views: [
            {
                index: 0,
                label: 'Folders',
                view: LibraryTab.Folders,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'HeaderVideos',
                view: LibraryTab.MusicVideos
            },
            {
                index: 3,
                label: 'Playlists',
                view: LibraryTab.Playlists
            }
        ]
    },
    {
        path: '/playlists',
        type: CollectionType.Playlists,
        views: [
            {
                index: 0,
                label: 'Playlists',
                view: LibraryTab.Playlists,
                isDefault: true
            },
            {
                index: 1,
                label: 'Favorites',
                view: LibraryTab.Favorites
            }
        ]
    },
    {
        path: '/mixed',
        type: CollectionType.Unknown,
        views: [
            {
                index: 0,
                label: 'Folders',
                view: LibraryTab.Folders,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                view: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'HeaderMedia',
                view: LibraryTab.Mixed
            },
            {
                index: 3,
                label: 'Collections',
                view: LibraryTab.Collections
            },
            {
                index: 4,
                label: 'Playlists',
                view: LibraryTab.Playlists
            }
        ]
    }
];
