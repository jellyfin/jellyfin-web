import * as userSettings from '../../scripts/settings/userSettings';

/**
 * Crossfade state management.
 * This object tracks the current crossfade state and configuration.
 */
export const xDuration = {
    enabled: true,
    sustain: 0.45,
    fadeOut: 1,
    busy: false,
    triggered: false,
    manualTrigger: false
};

/**
 * Gets the crossfade duration from user settings.
 */
export function getCrossfadeDuration(): number {
    return userSettings.crossfadeDuration(undefined);
}

/**
 * Sets the crossfade duration and related properties.
 */
export function setXDuration(crossfadeDuration: number): void {
    if (crossfadeDuration < 0.01) {
        xDuration.enabled = false;
        xDuration.fadeOut = 0;
        xDuration.sustain = 0;
        return;
    }

    if (crossfadeDuration < 0.51) {
        xDuration.enabled = true;
        xDuration.fadeOut = crossfadeDuration;
        xDuration.sustain = crossfadeDuration / 2;
        return;
    }

    xDuration.enabled = true;
    xDuration.fadeOut = crossfadeDuration * 2;
    xDuration.sustain = crossfadeDuration / 12;
}

/**
 * Cancels all active crossfade timeouts and resets state.
 */
export function cancelCrossfadeTimeouts(): void {
    xDuration.busy = false;
    xDuration.triggered = false;
    xDuration.manualTrigger = false;
    syncManager.stopSync();
}

/**
 * Checks if the time is running out for the current track.
 * Used to trigger crossfade before track ends.
 */
export function timeRunningOut(player: { currentTime(): number; duration(): number }): boolean {
    const currentTimeMs = player.currentTime() * 1000;
    const durationMs = player.duration() * 1000;
    const fadeOutMs = xDuration.fadeOut * 1000;

    if (!isFinite(durationMs) || durationMs <= 0) {
        return false;
    }

    if (!xDuration.enabled || xDuration.busy || currentTimeMs < fadeOutMs) {
        return false;
    }

    const shouldTrigger = durationMs - currentTimeMs <= fadeOutMs * 1.5;
    if (shouldTrigger) {
        xDuration.triggered = true;
    }
    return shouldTrigger;
}

/**
 * Global Sync Manager for MediaElement timing alignment.
 * Used during crossfade to keep multiple tracks synchronized.
 */
export class SyncManager {
    private elements: Map<HTMLMediaElement, number> = new Map();
    private masterTime: number = 0;
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private observers: Map<HTMLMediaElement, MutationObserver> = new Map();
    private activeElementCount: number = 0;
    private currentInterval: number = 100;
    private readonly activeInterval = 100;
    private readonly idleInterval = 1000;

    registerElement(element: HTMLMediaElement, startTime: number = 0): void {
        this.elements.set(element, startTime);
        element.preload = 'auto';

        // Auto-cleanup when element is removed from DOM
        this.registerCleanupHandler(element);

        // Auto-start sync if not already running
        this.startSync();
    }

    private registerCleanupHandler(element: HTMLMediaElement): void {
        // Remove existing observer if any, but don't remove from elements Map
        const existingObserver = this.observers.get(element);
        if (existingObserver) {
            try {
                existingObserver.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            this.observers.delete(element);
        }

        const cleanup = () => {
            this.unregisterElement(element);
        };

        // Clean up on 'ended' event
        element.addEventListener('ended', cleanup, { once: true });

        // Use MutationObserver to detect element removal from DOM
        if (element.parentNode && element.parentNode.nodeName) {
            try {
                const observer = new MutationObserver((mutations) => {
                    try {
                        for (const mutation of mutations) {
                            const removedNodes = Array.from(mutation.removedNodes);
                            if (removedNodes.includes(element)) {
                                observer.disconnect();
                                this.observers.delete(element);
                                cleanup();
                                break;
                            }
                        }
                    } catch (innerError) {
                        console.debug('[SyncManager] Error in mutation callback:', innerError);
                    }
                });

                observer.observe(element.parentNode, { childList: true });
                this.observers.set(element, observer);
            } catch (error) {
                console.debug('[SyncManager] MutationObserver not supported or failed:', error);
            }
        }
    }

    unregisterElement(element: HTMLMediaElement): void {
        // Disconnect any observer
        const observer = this.observers.get(element);
        if (observer) {
            observer.disconnect();
            this.observers.delete(element);
        }

        this.elements.delete(element);

        // Auto-stop sync when no elements remain
        if (this.elements.size === 0) {
            this.stopSync();
        }
    }

    startSync(): void {
        if (this.syncInterval) return;
        this.currentInterval = this.activeElementCount > 0 ? this.activeInterval : this.idleInterval;
        this.syncInterval = setInterval(() => this.checkSync(), this.currentInterval);
    }

    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    private updateSyncInterval(): void {
        if (!this.syncInterval) return;

        const targetInterval = this.activeElementCount > 0 ? this.activeInterval : this.idleInterval;
        if (targetInterval !== this.currentInterval) {
            this.currentInterval = targetInterval;
            clearInterval(this.syncInterval);
            this.syncInterval = setInterval(() => this.checkSync(), this.currentInterval);
        }
    }

    private checkSync(): void {
        if (this.elements.size === 0) {
            this.stopSync();
            return;
        }

        // Filter out elements that are no longer in DOM
        const validElements: [HTMLMediaElement, number][] = [];
        for (const [element, startTime] of this.elements.entries()) {
            if (element.parentNode && document.body && document.body.contains(element)) {
                validElements.push([element, startTime]);
            } else {
                // Element removed from DOM, clean up
                this.unregisterElement(element);
            }
        }

        if (validElements.length === 0) return;

        try {
            let totalTime = 0;
            let activeCount = 0;
            for (const [element, startTime] of validElements) {
                if (!element.paused && element.readyState >= 2) {
                    totalTime += element.currentTime - startTime;
                    activeCount++;
                }
            }

            // Update active count and adjust interval
            if (activeCount !== this.activeElementCount) {
                this.activeElementCount = activeCount;
                this.updateSyncInterval();
            }

            if (activeCount > 0) {
                this.masterTime = totalTime / activeCount;
            }

            for (const [element, startTime] of validElements) {
                if (!element.paused && element.readyState >= 2) {
                    const elementTime = element.currentTime - startTime;
                    const drift = elementTime - this.masterTime;

                    if (Math.abs(drift) > 0.1) {
                        const targetTime = this.masterTime + startTime;
                        const bufferedAhead = this.getBufferedAhead(element);

                        if (Math.abs(drift) > 0.5 && this.isPositionBuffered(element, targetTime) && !xDuration.busy && bufferedAhead > 2.0) {
                            element.currentTime = targetTime;
                        } else if (Math.abs(drift) <= 0.5 && !xDuration.busy) {
                            if (element.playbackRate === 1.0) {
                                element.playbackRate = drift > 0 ? 0.99 : 1.01;
                                setTimeout(() => {
                                    if (element.playbackRate !== 1.0) {
                                        element.playbackRate = 1.0;
                                    }
                                }, 500);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('[SyncManager] Error in checkSync:', error);
        }
    }

    getBufferedAhead(element: HTMLMediaElement): number {
        if (element.buffered.length > 0) {
            return element.buffered.end(element.buffered.length - 1) - element.currentTime;
        }
        return 0;
    }

    private isPositionBuffered(element: HTMLMediaElement, targetTime: number): boolean {
        if (element.buffered.length === 0) return false;
        for (let i = 0; i < element.buffered.length; i++) {
            if (targetTime >= element.buffered.start(i) && targetTime <= element.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }
}

export const syncManager = new SyncManager();
