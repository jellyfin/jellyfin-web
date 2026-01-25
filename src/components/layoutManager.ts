import { LayoutMode } from '../constants/layoutMode';
import { useUiStore } from '../store/uiStore';
import Events from '../utils/events';

/**
 * LayoutManager
 *
 * Legacy wrapper around useUiStore. Maintains compatibility with
 * existing code while delegating state to reactive store.
 */
class LayoutManager {
    get tv(): boolean {
        return useUiStore.getState().effectiveLayout === 'tv';
    }

    get mobile(): boolean {
        return useUiStore.getState().effectiveLayout === 'mobile';
    }

    get desktop(): boolean {
        return useUiStore.getState().effectiveLayout === 'desktop';
    }

    get experimental(): boolean {
        return useUiStore.getState().layout === LayoutMode.Experimental;
    }

    setLayout(layout?: LayoutMode, _save = true): void {
        useUiStore.getState().setLayout(layout || LayoutMode.Auto);

        // Trigger legacy event for non-reactive components
        Events.trigger(this as any, 'modechange');
    }

    init(): void {
        // Initialized by store's autoDetectLayout on rehydration
    }

    getSavedLayout(): LayoutMode {
        return useUiStore.getState().layout;
    }
}

const layoutManager = new LayoutManager();

export { layoutManager };
export default layoutManager;
