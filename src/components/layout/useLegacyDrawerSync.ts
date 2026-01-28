import { useEffect } from 'react';
import { useUiStore } from '../../store/uiStore';
import { useLayoutMode } from './useLayoutMode';

export const useLegacyDrawerSync = () => {
    const { isExperimentalLayout, isNewLayoutPath } = useLayoutMode();
    const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
    const toggleDrawer = useUiStore((state) => state.toggleDrawer);

    // Sync FROM uiStore TO legacy drawer
    useEffect(() => {
        // Only sync if we are in legacy mode (i.e. AppHeader is visible)
        // If we are in new layout, the legacy drawer is hidden via CSS or not rendered,
        // so we don't need to sync, OR we might want to sync if the user switches modes?
        // But for now, let's assume active mode.
        if (isExperimentalLayout || isNewLayoutPath) return;

        const drawer = document.querySelector('.mainDrawer');
        if (!drawer) return;

        const isOpen = drawer.classList.contains('drawer-open');

        if (isDrawerOpen && !isOpen) {
            // Open it.
            // We can't easily access the instance, so we simulate interaction or use the global LibraryMenu if available.
            // Using the button is the safest way to trigger the legacy event handlers.
            const btn = document.querySelector('.mainDrawerButton') as HTMLElement;
            btn?.click();
        } else if (!isDrawerOpen && isOpen) {
            // Close it.
            const btn = document.querySelector('.mainDrawerButton') as HTMLElement;
            btn?.click();
        }
    }, [isDrawerOpen, isExperimentalLayout, isNewLayoutPath]);

    // Sync FROM legacy drawer TO uiStore
    useEffect(() => {
        if (isExperimentalLayout || isNewLayoutPath) return;

        const drawer = document.querySelector('.mainDrawer');
        if (!drawer) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isOpen = drawer.classList.contains('drawer-open');
                    // Avoid infinite loops by checking if state matches
                    if (isOpen !== useUiStore.getState().isDrawerOpen) {
                        toggleDrawer(isOpen);
                    }
                }
            });
        });

        observer.observe(drawer, { attributes: true });

        return () => observer.disconnect();
    }, [isExperimentalLayout, isNewLayoutPath, toggleDrawer]);
};
