/**
 * Checks if the document is currently visible to the user.
 * Uses the Page Visibility API to determine visibility state.
 * @returns {boolean} True if the document is visible, false otherwise.
 */
export function isVisible(): boolean {
    return document.visibilityState === 'visible';
}

import { logger } from './logger';

type VisibilityCallback = (visible: boolean) => void;
const visibilityCallbacks: Set<VisibilityCallback> = new Set();

/**
 * Subscribe to visibility change events.
 * @param callback Function to call when visibility changes
 * @returns Unsubscribe function
 */
export function onVisibilityChange(callback: VisibilityCallback): () => void {
    visibilityCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
        visibilityCallbacks.delete(callback);
    };
}

// Initialize visibility change listener (module-level)
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        const visible = !document.hidden;
        visibilityCallbacks.forEach((cb) => {
            try {
                cb(visible);
            } catch (err) {
                logger.warn(
                    '[Visibility] Callback error',
                    { component: 'Visibility' },
                    err as Error
                );
            }
        });
    });
}
