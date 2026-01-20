import { LayoutMode } from 'constants/layoutMode';
import { useUiStore } from '../store/uiStore';
import Events from '../utils/events';

/**
 * LayoutManager (Refactored)
 * 
 * Legacy wrapper around useUiStore. Maintains compatibility with 
 * existing code while delegating state to the reactive store.
 */
class LayoutManager {
    get tv() {
        return useUiStore.getState().effectiveLayout === 'tv';
    }

    get mobile() {
        return useUiStore.getState().effectiveLayout === 'mobile';
    }

    get desktop() {
        return useUiStore.getState().effectiveLayout === 'desktop';
    }

    get experimental() {
        return useUiStore.getState().layout === LayoutMode.Experimental;
    }

    setLayout(layout, save = true) {
        useUiStore.getState().setLayout(layout || LayoutMode.Auto);
        
        // Trigger legacy event for non-reactive components
        Events.trigger(this, 'modechange');
    }

    init() {
        // Initialized by the store's autoDetectLayout on rehydration
    }
}

const layoutManager = new LayoutManager();

export { layoutManager };
export default layoutManager;