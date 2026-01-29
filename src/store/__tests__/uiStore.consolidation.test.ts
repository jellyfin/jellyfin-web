import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutMode } from '../../constants/layoutMode';
import browser from '../../scripts/browser';
import { useUiStore } from '../uiStore';

// Mock browser
vi.mock('../../scripts/browser', () => ({
    default: {
        tv: false,
        mobile: false
    }
}));

describe('uiStore Consolidation', () => {
    beforeEach(() => {
        // Reset store state before each test
        useUiStore.setState({
            layout: LayoutMode.Auto,
            effectiveLayout: 'experimental',
            isDrawerOpen: false,
            isSearchOpen: false,
            isLoading: false
        });
        vi.clearAllMocks();
    });

    it('should update effectiveLayout based on browser detection when Auto', () => {
        (browser as any).tv = true;
        useUiStore.getState().autoDetectLayout();
        expect(useUiStore.getState().effectiveLayout).toBe('tv');

        (browser as any).tv = false;
        (browser as any).mobile = true;
        useUiStore.getState().autoDetectLayout();
        expect(useUiStore.getState().effectiveLayout).toBe('mobile');
    });

    it('should respect manual layout override', () => {
        useUiStore.getState().setLayout(LayoutMode.Desktop);
        expect(useUiStore.getState().layout).toBe(LayoutMode.Desktop);
        expect(useUiStore.getState().effectiveLayout).toBe('desktop');
    });

    it('should toggle drawer state correctly', () => {
        const store = useUiStore.getState();

        store.toggleDrawer(true);
        expect(useUiStore.getState().isDrawerOpen).toBe(true);

        store.toggleDrawer(false);
        expect(useUiStore.getState().isDrawerOpen).toBe(false);

        store.toggleDrawer(); // Toggle
        expect(useUiStore.getState().isDrawerOpen).toBe(true);
    });

    it('should update HTML classes when layout changes', () => {
        const spy = vi.spyOn(document.documentElement.classList, 'add');

        useUiStore.getState().setLayout(LayoutMode.Tv);

        expect(spy).toHaveBeenCalledWith('layout-tv');
        expect(document.documentElement.classList.contains('layout-tv')).toBe(true);
    });

    it('should update orientation when viewport changes', () => {
        useUiStore.getState().setViewport({ width: 1000, height: 500 });
        expect(useUiStore.getState().orientation).toBe('landscape');

        useUiStore.getState().setViewport({ width: 500, height: 1000 });
        expect(useUiStore.getState().orientation).toBe('portrait');
    });
});
