import * as userSettings from 'scripts/settings/userSettings';

import { LibraryRoutes } from '../constants/libraryRoutes';

/**
 * Utility function to check if a path is a library path.
 */
export const isLibraryPath = (path: string) =>
    LibraryRoutes.some((route) => route.path === path);

/**
 * Utility function to get the default view index for a specified URL path and library.
 */
export const getDefaultViewIndex = (
    path: string,
    libraryId?: string | null
) => {
    if (!libraryId) return 0;

    const views =
        LibraryRoutes.find((route) => route.path === path)?.views ?? [];
    const defaultView = userSettings.get('landing-' + libraryId, false);

    return (
        views.find((view) => view.view === defaultView)?.index ??
        views.find((view) => view.isDefault)?.index ??
        0
    );
};
