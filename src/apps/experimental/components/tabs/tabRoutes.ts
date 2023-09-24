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

];

export default TabRoutes;
