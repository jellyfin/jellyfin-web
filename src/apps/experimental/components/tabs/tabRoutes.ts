import globalize from 'scripts/globalize';
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
        path: '/livetv.html',
        tabs: [
            {
                index: 0,
                label: globalize.translate('Programs'),
                value: LibraryTab.Programs,
                isDefault: true
            },
            {
                index: 1,
                label: globalize.translate('Guide'),
                value: LibraryTab.Guide
            },
            {
                index: 2,
                label: globalize.translate('Channels'),
                value: LibraryTab.Channels
            },
            {
                index: 3,
                label: globalize.translate('Recordings'),
                value: LibraryTab.Recordings
            },
            {
                index: 4,
                label: globalize.translate('Schedule'),
                value: LibraryTab.Schedule
            },
            {
                index: 5,
                label: globalize.translate('Series'),
                value: LibraryTab.SeriesTimers
            }
        ]
    },
    {
        path: '/movies.html',
        tabs: [
            {
                index: 0,
                label: globalize.translate('Movies'),
                value: LibraryTab.Movies,
                isDefault: true
            },
            {
                index: 1,
                label: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: globalize.translate('Trailers'),
                value: LibraryTab.Trailers
            },
            {
                index: 3,
                label: globalize.translate('Favorites'),
                value: LibraryTab.Favorites
            },
            {
                index: 4,
                label: globalize.translate('Collections'),
                value: LibraryTab.Collections
            },
            {
                index: 5,
                label: globalize.translate('Genres'),
                value: LibraryTab.Genres
            }
        ]
    },
    {
        path: '/music.html',
        tabs: [
            {
                index: 0,
                label: globalize.translate('Albums'),
                value: LibraryTab.Albums,
                isDefault: true
            },
            {
                index: 1,
                label: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: globalize.translate('HeaderAlbumArtists'),
                value: LibraryTab.AlbumArtists
            },
            {
                index: 3,
                label: globalize.translate('Artists'),
                value: LibraryTab.Artists
            },
            {
                index: 4,
                label: globalize.translate('Playlists'),
                value: LibraryTab.Playlists
            },
            {
                index: 5,
                label: globalize.translate('Songs'),
                value: LibraryTab.Songs
            },
            {
                index: 6,
                label: globalize.translate('Genres'),
                value: LibraryTab.Genres
            }
        ]
    },
    {
        path: '/tv.html',
        tabs: [
            {
                index: 0,
                label: globalize.translate('Shows'),
                value: LibraryTab.Series,
                isDefault: true
            },
            {
                index: 1,
                label: globalize.translate('Suggestions'),
                value: LibraryTab.Suggestions
            },
            {
                index: 2,
                label: globalize.translate('TabUpcoming'),
                value: LibraryTab.Upcoming
            },
            {
                index: 3,
                label: globalize.translate('Genres'),
                value: LibraryTab.Genres
            },
            {
                index: 4,
                label: globalize.translate('TabNetworks'),
                value: LibraryTab.Networks
            },
            {
                index: 5,
                label: globalize.translate('Episodes'),
                value: LibraryTab.Episodes
            }
        ]
    }
];

export default TabRoutes;
