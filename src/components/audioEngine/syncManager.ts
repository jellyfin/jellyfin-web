/**
 * Sync Manager
 *
 * Event-driven drift detection for MediaElement synchronization during crossfade.
 * Only active during crossfade operations. Uses timeupdate event for drift detection
 * rather than polling with setInterval.
 */

import { usePreferencesStore } from '../../store/preferencesStore';
import { logger } from '../../utils/logger';

interface TrackedElement {
    element: HTMLMediaElement;
    startTime: number;
    startOffset: number;
}

export class SyncManager {
    private trackedElements: Map<HTMLMediaElement, TrackedElement> = new Map();
    private masterTime: number = 0;
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private observers: Map<HTMLMediaElement, MutationObserver> = new Map();
    private activeElementCount: number = 0;
    private currentInterval: number = 100;
    private readonly activeInterval = 100;
    private readonly idleInterval = 1000;
    private readonly driftThreshold = 0.1;
    private readonly seekThreshold = 0.5;
    private readonly maxPlaybackRateDeviation = 0.01;
    private unsubscribe: (() => void) | null = null;
    private timeUpdateHandler: (() => void) | null = null;
    private isActive: boolean = false;

    constructor() {
        this.subscribeToCrossfadeState();
    }

    private subscribeToCrossfadeState(): void {
        if (typeof window === 'undefined') return;

        const { usePreferencesStore } = require('../../store/preferencesStore');
        this.unsubscribe = usePreferencesStore.subscribe(
            (state: ReturnType<typeof usePreferencesStore.getState>) => state._runtime.busy,
            (busy: boolean) => {
                if (busy && !this.isActive) {
                    this.activate();
                } else if (!busy && this.isActive) {
                    this.deactivate();
                }
            }
        );
    }

    activate(): void {
        if (this.isActive) return;
        this.isActive = true;
        logger.debug('[SyncManager] Activated', { component: 'SyncManager' });
        this.startSync();
    }

    deactivate(): void {
        if (!this.isActive) return;
        this.isActive = false;
        logger.debug('[SyncManager] Deactivated', { component: 'SyncManager' });
        this.stopSync();
        this.clearAll();
    }

    registerElement(element: HTMLMediaElement, startTime: number = 0): void {
        if (!element) return;

        const existing = this.trackedElements.get(element);
        if (existing) {
            existing.startTime = startTime;
            return;
        }

        this.trackedElements.set(element, {
            element,
            startTime,
            startOffset: element.currentTime - startTime
        });

        this.registerCleanupHandler(element);

        if (this.isActive) {
            this.startSync();
        }

        logger.debug('[SyncManager] Registered element', {
            component: 'SyncManager',
            elementCount: this.trackedElements.size
        });
    }

    unregisterElement(element: HTMLMediaElement): void {
        if (!element) return;

        this.cleanupElement(element);
        this.trackedElements.delete(element);

        if (this.trackedElements.size === 0) {
            this.stopSync();
        }

        logger.debug('[SyncManager] Unregistered element', {
            component: 'SyncManager',
            elementCount: this.trackedElements.size
        });
    }

    private registerCleanupHandler(element: HTMLMediaElement): void {
        const cleanup = () => {
            this.unregisterElement(element);
        };

        element.addEventListener('ended', cleanup, { once: true });

        if (typeof MutationObserver !== 'undefined') {
            const setupObserver = () => {
                if (!element.parentNode) return;

                try {
                    const observer = new MutationObserver(() => {
                        if (!element.parentNode || (document.body && !document.body.contains(element))) {
                            observer.disconnect();
                            this.observers.delete(element);
                            cleanup();
                        }
                    });
                    observer.observe(element.parentNode as Node, { childList: true });
                    this.observers.set(element, observer);
                } catch {
                    logger.debug('[SyncManager] MutationObserver setup failed', { component: 'SyncManager' });
                }
            };
            setupObserver();
        }
    }

    private cleanupElement(element: HTMLMediaElement): void {
        const observer = this.observers.get(element);
        if (observer) {
            try {
                observer.disconnect();
            } catch {}
            this.observers.delete(element);
        }

        element.removeEventListener('ended', () => this.unregisterElement(element));
    }

    private startSync(): void {
        if (this.syncInterval) return;

        this.timeUpdateHandler = () => this.checkSync();
        this.currentInterval = this.activeInterval;

        window.addEventListener('timeupdate', this.timeUpdateHandler);
        this.syncInterval = setInterval(() => this.checkSync(), this.currentInterval);

        logger.debug('[SyncManager] Sync started', { component: 'SyncManager' });
    }

    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        if (this.timeUpdateHandler) {
            window.removeEventListener('timeupdate', this.timeUpdateHandler);
            this.timeUpdateHandler = null;
        }

        logger.debug('[SyncManager] Sync stopped', { component: 'SyncManager' });
    }

    private checkSync(): void {
        if (!this.isActive) return;

        const elements = Array.from(this.trackedElements.values());

        for (const { element } of elements) {
            if (!element.parentNode || (document.body && !document.body.contains(element))) {
                this.unregisterElement(element);
                return;
            }
        }

        try {
            let totalTime = 0;
            let activeCount = 0;
            const validElements: TrackedElement[] = [];

            for (const tracked of elements) {
                const { element, startTime } = tracked;
                if (!element.paused && element.readyState >= 2) {
                    const elapsed = element.currentTime - startTime;
                    totalTime += elapsed;
                    activeCount++;
                    validElements.push(tracked);
                }
            }

            if (activeCount !== this.activeElementCount) {
                this.activeElementCount = activeCount;
                this.updateInterval();
            }

            if (activeCount > 0) {
                this.masterTime = totalTime / activeCount;
            }

            for (const tracked of validElements) {
                this.correctDrift(tracked);
            }
        } catch (error) {
            logger.warn('[SyncManager] Sync check failed', { component: 'SyncManager' }, error as Error);
        }
    }

    private correctDrift(tracked: TrackedElement): void {
        const { element, startTime } = tracked;
        const elapsed = element.currentTime - startTime;
        const drift = elapsed - this.masterTime;

        if (Math.abs(drift) <= this.driftThreshold) return;

        const targetTime = this.masterTime + startTime;
        const bufferedAhead = this.getBufferedAhead(element);
        const isCrossfading = usePreferencesStore.getState()._runtime.busy;

        if (
            Math.abs(drift) > this.seekThreshold &&
            this.isPositionBuffered(element, targetTime) &&
            bufferedAhead > 2.0 &&
            !isCrossfading
        ) {
            try {
                element.currentTime = targetTime;
                logger.debug('[SyncManager] Seek correction', {
                    component: 'SyncManager',
                    drift,
                    targetTime
                });
            } catch (error) {
                logger.warn('[SyncManager] Seek failed', { component: 'SyncManager' }, error as Error);
            }
        } else if (Math.abs(drift) <= this.seekThreshold) {
            if (Math.abs(element.playbackRate - 1.0) < this.maxPlaybackRateDeviation) {
                const rateCorrection =
                    drift > 0 ? 1.0 - this.maxPlaybackRateDeviation : 1.0 + this.maxPlaybackRateDeviation;
                element.playbackRate = rateCorrection;

                setTimeout(() => {
                    if (Math.abs(element.playbackRate - 1.0) < this.maxPlaybackRateDeviation) {
                        element.playbackRate = 1.0;
                    }
                }, 500);
            }
        }
    }

    private updateInterval(): void {
        if (!this.syncInterval) return;

        const targetInterval = this.activeElementCount > 0 ? this.activeInterval : this.idleInterval;

        if (targetInterval !== this.currentInterval) {
            this.currentInterval = targetInterval;
            clearInterval(this.syncInterval);
            this.syncInterval = setInterval(() => this.checkSync(), this.currentInterval);
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

    clearAll(): void {
        this.trackedElements.forEach(tracked => {
            this.cleanupElement(tracked.element);
        });
        this.trackedElements.clear();
        for (const observer of this.observers.values()) {
            observer.disconnect();
        }
        this.observers.clear();
    }

    destroy(): void {
        this.deactivate();
        this.unsubscribe?.();
        this.clearAll();
        logger.debug('[SyncManager] Destroyed', { component: 'SyncManager' });
    }

    getTrackedCount(): number {
        return this.trackedElements.size;
    }

    isCurrentlyActive(): boolean {
        return this.isActive;
    }

    getMasterTime(): number {
        return this.masterTime;
    }
}

export const syncManager = new SyncManager();

export function isSyncActive(): boolean {
    return syncManager.isCurrentlyActive();
}

export function getSyncTrackedCount(): number {
    return syncManager.getTrackedCount();
}

export function registerSyncElement(element: HTMLMediaElement, startTime: number = 0): void {
    syncManager.registerElement(element, startTime);
}

export function unregisterSyncElement(element: HTMLMediaElement): void {
    syncManager.unregisterElement(element);
}
