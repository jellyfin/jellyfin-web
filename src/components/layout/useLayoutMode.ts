import { useLocation } from '@tanstack/react-router';
import browser from '../../scripts/browser';
import { LayoutMode } from '../../constants/layoutMode';
import { DASHBOARD_APP_PATHS } from '../../apps/dashboard/routes/routes';
import { useUiStore } from '../../store/uiStore';

const LAYOUT_SETTING_KEY = 'layout';

export const useLayoutMode = () => {
    const location = useLocation();
    // Subscribe to layout from store to ensure reactivity
    const storeLayout = useUiStore((state) => state.layout);

    const storedLayout = typeof localStorage !== 'undefined' ? localStorage.getItem(LAYOUT_SETTING_KEY) : null;
    
    // We prefer the store value if it's explicitly set to something other than Auto,
    // otherwise we use the logic.
    const layoutMode = browser.tv ? LayoutMode.Tv : (storeLayout !== LayoutMode.Auto ? storeLayout : storedLayout);

    const isExperimentalLayout =
        layoutMode == null || layoutMode === '' || layoutMode === LayoutMode.Experimental;
    
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS).some((path) =>
        location.pathname.startsWith(`/${path}`)
    );

    return {
        layoutMode,
        isExperimentalLayout,
        isNewLayoutPath,
        shouldHideLegacyHeader: isExperimentalLayout || isNewLayoutPath
    };
};