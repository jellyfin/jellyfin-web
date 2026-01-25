import { useUiStore } from '../../store';

/**
 * Loading Manager (Refactored)
 *
 * Legacy wrapper around useUiStore. Maintains compatibility with
 * existing code while delegating state to the reactive store.
 */
export function show() {
    useUiStore.getState().setIsLoading(true);
}

export function hide() {
    useUiStore.getState().setIsLoading(false);
}

const loading = {
    show,
    hide
};

declare global {
    interface Window {
        Loading: typeof loading;
    }
}

if (typeof window !== 'undefined') {
    window.Loading = loading;
}

export default loading;
