import * as userSettings from 'scripts/settings/userSettings';

import { LibraryTab } from 'types/libraryTab';

import { LibraryRoutes } from '../constants/libraryRoutes';

/**
 * The library view that was last selected by the user. This is kept in memory so that
 * switching between libraries preserves the active selector (e.g. staying on "Upcoming"),
 * falling back to the library's default view when it doesn't offer the same selector.
 */
let lastSelectedView: LibraryTab | undefined;

/**
 * Utility function to remember the last library view the user selected.
 */
export const setLastSelectedView = (view: LibraryTab) => {
    lastSelectedView = view;
};

/**
 * Utility function to get the library view for a specified URL path and tab index.
 */
export const getViewForIndex = (path: string, index: number) => {
    const views = LibraryRoutes.find(route => route.path === path)?.views ?? [];
    return views.find(view => view.index === index)?.view;
};

/**
 * Utility function to check if a path is a details path.
 */
export const isDetailsPath = (path: string) => (
    path === '/details'
);

/**
 * Utility function to check if a path is a library path.
 */
export const isLibraryPath = (path: string) => (
    LibraryRoutes.some(route => route.path === path)
);

/**
 * Utility function to get the default view index for a specified URL path and library.
 */
export const getDefaultViewIndex = (path: string, libraryId?: string | null) => {
    if (!libraryId) return 0;

    const views = LibraryRoutes.find(route => route.path === path)?.views ?? [];
    const defaultView = userSettings.get('landing-' + libraryId, false);

    return views.find(view => view.view === lastSelectedView)?.index
        ?? views.find(view => view.view === defaultView)?.index
        ?? views.find(view => view.isDefault)?.index
        ?? 0;
};
