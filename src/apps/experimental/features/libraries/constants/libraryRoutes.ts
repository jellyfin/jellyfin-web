import { LibraryTab } from 'types/libraryTab';

import { type LibraryRoute } from '../types/LibraryRoute';

export const LibraryRoutes: LibraryRoute[] = [
    {
        path: '/livetv',
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
        path: '/movies',
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
            }
        ]
    },
    {
        path: '/music',
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
            }
        ]
    },
    {
        path: '/tv',
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
                view: LibraryTab.Networks
            },
            {
                index: 5,
                label: 'Episodes',
                view: LibraryTab.Episodes
            }
        ]
    },
    {
        path: '/homevideos',
        views: [
            {
                index: 0,
                label: 'Photos',
                view: LibraryTab.Photos,
                isDefault: true
            },
            {
                index: 1,
                label: 'HeaderPhotoAlbums',
                view: LibraryTab.PhotoAlbums,
                isDefault: true
            },
            {
                index: 2,
                label: 'HeaderVideos',
                view: LibraryTab.Videos
            }
        ]
    }
];
