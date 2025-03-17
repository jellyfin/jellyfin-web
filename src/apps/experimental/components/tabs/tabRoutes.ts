import * as userSettings from 'scripts/settings/userSettings';
import { LibraryTab } from 'types/libraryTab';

interface TabDefinition {
    index: number
    label: string
    value: LibraryTab
    isDefault?: boolean
}

interface TabRoute {
    path: string,
    tabs: TabDefinition[]
}

/**
 * Utility function to check if a path has tabs.
 */
export const isTabPath = (path: string) => (
    TabRoutes.some(route => route.path === path)
);

/**
 * Utility function to get the default tab index for a specified URL path and library.
 */
export const getDefaultTabIndex = (path: string, libraryId?: string | null) => {
    if (!libraryId) return 0;

    const tabs = TabRoutes.find(route => route.path === path)?.tabs ?? [];
    const defaultTab = userSettings.get('landing-' + libraryId, false);

    return tabs.find(tab => tab.value === defaultTab)?.index
        ?? tabs.find(tab => tab.isDefault)?.index
        ?? 0;
};

const TabRoutes: TabRoute[] = [
    {
        path: '/livetv',
        tabs: [
            {
                index: 0,
                label: 'Programs',
                value: LibraryTab.Programs,
                isDefault: true
            },
            {
                index: 1,
                label: 'Guide',
                value: LibraryTab.Guide
            },
            {
                index: 2,
                label: 'Channels',
                value: LibraryTab.Channels
            },
            {
                index: 3,
                label: 'Recordings',
                value: LibraryTab.Recordings
            },
            {
                index: 4,
                label: 'Schedule',
                value: LibraryTab.Schedule
            },
            {
                index: 5,
                label: 'Series',
                value: LibraryTab.SeriesTimers
            }
        ]
    },
    {
        path: '/movies',
        tabs: [
            {
                index: 0,
                label: 'Movies',
                value: LibraryTab.Movies,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'Trailers',
                value: LibraryTab.Trailers
            },
            {
                index: 3,
                label: 'Favorites',
                value: LibraryTab.Favorites
            },
            {
                index: 4,
                label: 'Collections',
                value: LibraryTab.Collections
            },
            {
                index: 5,
                label: 'Genres',
                value: LibraryTab.Genres
            }
        ]
    },
    {
        path: '/music',
        tabs: [
            {
                index: 0,
                label: 'Albums',
                value: LibraryTab.Albums,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'HeaderAlbumArtists',
                value: LibraryTab.AlbumArtists
            },
            {
                index: 3,
                label: 'Artists',
                value: LibraryTab.Artists
            },
            {
                index: 4,
                label: 'Playlists',
                value: LibraryTab.Playlists
            },
            {
                index: 5,
                label: 'Songs',
                value: LibraryTab.Songs
            },
            {
                index: 6,
                label: 'Genres',
                value: LibraryTab.Genres
            }
        ]
    },
    {
        path: '/tv',
        tabs: [
            {
                index: 0,
                label: 'Shows',
                value: LibraryTab.Series,
                isDefault: true
            },
            {
                index: 1,
                label: 'Suggestions',
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: 'TabUpcoming',
                value: LibraryTab.Upcoming
            },
            {
                index: 3,
                label: 'Genres',
                value: LibraryTab.Genres
            },
            {
                index: 4,
                label: 'TabNetworks',
                value: LibraryTab.Networks
            },
            {
                index: 5,
                label: 'Episodes',
                value: LibraryTab.Episodes
            }
        ]
    },
    {
        path: '/homevideos',
        tabs: [
            {
                index: 0,
                label: 'Photos',
                value: LibraryTab.Photos,
                isDefault: true
            },
            {
                index: 1,
                label: 'HeaderPhotoAlbums',
                value: LibraryTab.PhotoAlbums,
                isDefault: true
            },
            {
                index: 2,
                label: 'HeaderVideos',
                value: LibraryTab.Videos
            }
        ]
    }
];

export default TabRoutes;
