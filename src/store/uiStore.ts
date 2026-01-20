/**
 * UI Store - Layout and Interface State
 * 
 * Manages layout modes (mobile, tv, desktop), window dimensions, 
 * and global UI state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { LayoutMode } from '../constants/layoutMode';
import browser from '../scripts/browser';
import { logger } from '../utils/logger';

export interface ViewportSize {
    width: number;
    height: number;
}

export interface UiState {
    layout: LayoutMode;
    effectiveLayout: 'mobile' | 'tv' | 'desktop' | 'experimental';
    viewport: ViewportSize;
    orientation: 'portrait' | 'landscape';
    isDrawerOpen: boolean;
    isSearchOpen: boolean;
    isLoading: boolean;
}

export interface UiActions {
    setLayout: (layout: LayoutMode) => void;
    setViewport: (size: ViewportSize) => void;
    toggleDrawer: (open?: boolean) => void;
    toggleSearch: (open?: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    autoDetectLayout: () => void;
}

const getEffectiveLayout = (layout: LayoutMode): UiState['effectiveLayout'] => {
    if (layout === LayoutMode.Auto) {
        if (browser.tv) return 'tv';
        if (browser.mobile) return 'mobile';
        return 'experimental';
    }
    return layout as UiState['effectiveLayout'];
};

const updateHtmlClasses = (effectiveLayout: string) => {
    const classes = ['layout-mobile', 'layout-tv', 'layout-desktop', 'layout-experimental'];
    const activeClass = `layout-${effectiveLayout}`;
    
    document.documentElement.classList.remove(...classes);
    document.documentElement.classList.add(activeClass);
};

export const useUiStore = create<UiState & UiActions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                layout: LayoutMode.Auto,
                effectiveLayout: getEffectiveLayout(LayoutMode.Auto),
                viewport: {
                    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
                    height: typeof window !== 'undefined' ? window.innerHeight : 1080
                },
                orientation: typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
                isDrawerOpen: false,
                isSearchOpen: false,
                isLoading: false,

                setLayout: (layout) => {
                    const effective = getEffectiveLayout(layout);
                    set({ layout, effectiveLayout: effective });
                    updateHtmlClasses(effective);
                    logger.debug('Layout changed', { component: 'UiStore', layout, effective });
                },

                setViewport: (viewport) => {
                    const orientation = viewport.height > viewport.width ? 'portrait' : 'landscape';
                    set({ viewport, orientation });
                },

                toggleDrawer: (open) => {
                    set((state) => ({ isDrawerOpen: open ?? !state.isDrawerOpen }));
                },

                toggleSearch: (open) => {
                    set((state) => ({ isSearchOpen: open ?? !state.isSearchOpen }));
                },

                setIsLoading: (isLoading) => {
                    set({ isLoading });
                },

                autoDetectLayout: () => {
                    const layout = get().layout;
                    if (layout === LayoutMode.Auto) {
                        const effective = getEffectiveLayout(LayoutMode.Auto);
                        set({ effectiveLayout: effective });
                        updateHtmlClasses(effective);
                    }
                }
            }),
            {
                name: 'jellyfin-ui-store',
                partialize: (state) => ({ layout: state.layout }),
                onRehydrateStorage: (state) => {
                    return (rehydratedState) => {
                        if (rehydratedState) {
                            rehydratedState.autoDetectLayout();
                        }
                    };
                }
            }
        )
    )
);

// Listen for window resize
if (typeof window !== 'undefined') {
    const handleResize = () => {
        useUiStore.getState().setViewport({
            width: window.innerWidth,
            height: window.innerHeight
        });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
}
