/**
 * Test Utilities for Store Migration
 *
 * Provides utilities for testing stores with performance monitoring,
 * error injection, and state verification.
 */

import { logger } from 'utils/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

export interface TestContext {
    startTime: number;
    snapshots: Map<string, unknown>;
    errors: TestError[];
}

export interface TestError {
    message: string;
    timestamp: number;
    context?: string;
}

/**
 * Create a test context for tracking state during tests
 */
export function createTestContext(): TestContext {
    return {
        startTime: Date.now(),
        snapshots: new Map(),
        errors: []
    };
}

/**
 * Take a snapshot of state
 */
export function takeSnapshot<T>(context: TestContext, key: string, state: T): void {
    // Deep clone to avoid reference issues
    context.snapshots.set(key, JSON.parse(JSON.stringify(state)));
}

/**
 * Compare current state with snapshot
 */
export function compareWithSnapshot<T extends Record<string, unknown>>(
    context: TestContext,
    key: string,
    currentState: T
): {
    matched: boolean;
    differences: string[];
} {
    const snapshot = context.snapshots.get(key);
    if (!snapshot) {
        return { matched: false, differences: ['No snapshot found'] };
    }

    const currentClone = JSON.parse(JSON.stringify(currentState));
    const snapshotClone = snapshot as T;
    const differences: string[] = [];

    // Compare keys
    const snapshotKeys = Object.keys(snapshotClone);
    const currentKeys = Object.keys(currentClone);

    for (const key of snapshotKeys) {
        if (!(key in currentClone)) {
            differences.push(`Missing key: ${key}`);
        } else if (JSON.stringify(snapshotClone[key]) !== JSON.stringify(currentClone[key])) {
            differences.push(`Changed key: ${key}`);
        }
    }

    for (const key of currentKeys) {
        if (!(key in snapshotClone)) {
            differences.push(`New key: ${key}`);
        }
    }

    return {
        matched: differences.length === 0,
        differences
    };
}

/**
 * Track an error in test context
 */
export function trackError(context: TestContext, error: Error, contextInfo?: string): void {
    context.errors.push({
        message: error.message,
        timestamp: Date.now(),
        context: contextInfo
    });
}

/**
 * Verify no errors occurred
 */
export function verifyNoErrors(context: TestContext): void {
    if (context.errors.length > 0) {
        const errorMessages = context.errors
            .map((e) => `${e.message} (${e.context || 'unknown'})`)
            .join(', ');
        throw new Error(`Unexpected errors occurred: ${errorMessages}`);
    }
}

/**
 * Performance timer for tests
 */
export function createTestTimer() {
    const start = performance.now();

    return {
        stop: (): number => {
            const duration = performance.now() - start;
            logger.debug('Test timer', { durationMs: duration });
            return duration;
        },
        assertBelow: (thresholdMs: number): void => {
            const duration = performance.now() - start;
            if (duration > thresholdMs) {
                throw new Error(
                    `Performance regression: ${duration.toFixed(2)}ms exceeds threshold of ${thresholdMs}ms`
                );
            }
        }
    };
}

/**
 * Mock logger for tests
 */
export function createMockLogger() {
    return {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        assert: vi.fn()
    };
}

/**
 * Create a store mock for testing
 */
export function createStoreMock<T extends object>(initialState: T) {
    let state = initialState;
    const subscribers = new Set<(state: T, prevState: T) => void>();

    return {
        getState: () => state,

        setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => {
            const prevState = state;
            const newPartial = typeof partial === 'function' ? partial(state) : partial;
            state = { ...state, ...newPartial };

            subscribers.forEach((sub) => {
                try {
                    sub(state, prevState);
                } catch (error) {
                    logger.error('Subscriber error', { error: String(error) });
                }
            });
        },

        subscribe: (fn: (state: T, prevState: T) => void) => {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        },

        reset: (newState: T) => {
            state = newState;
            subscribers.clear();
        }
    };
}

/**
 * Test helpers for error injection
 */
export function createErrorInjector() {
    const shouldInjectError = new Map<string, boolean>();
    const errorCount = new Map<string, number>();

    return {
        setShouldInject: (key: string, shouldInject: boolean) => {
            shouldInjectError.set(key, shouldInject);
        },

        injectError: <T>(key: string, errorMessage: string, fallback: T): T => {
            const shouldInject = shouldInjectError.get(key) || false;
            const count = (errorCount.get(key) || 0) + 1;
            errorCount.set(key, count);

            if (shouldInject) {
                throw new Error(`${errorMessage} (injected error #${count})`);
            }
            return fallback;
        },

        reset: () => {
            shouldInjectError.clear();
            errorCount.clear();
        }
    };
}

/**
 * Async test wrapper with timeout
 */
export function asyncTest<T>(
    name: string,
    fn: () => Promise<T>,
    timeoutMs: number = 5000
): { name: string; fn: () => Promise<T> } {
    return {
        name,
        async fn() {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Test "${name}" timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            });

            return Promise.race([fn(), timeoutPromise]);
        }
    };
}

/**
 * Performance assertion helper
 */
export function assertPerformance(
    operation: string,
    durationMs: number,
    thresholds: { warning: number; critical: number }
): 'passed' | 'warning' | 'failed' {
    if (durationMs >= thresholds.critical) {
        return 'failed';
    }
    if (durationMs >= thresholds.warning) {
        return 'warning';
    }
    return 'passed';
}

/**
 * Generate test data factories
 */
export const testFactories = {
    createPlayableItem: (
        overrides: Partial<import('../types/media').PlayableItem> = {}
    ): import('../types/media').PlayableItem => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Test Item',
        mediaType: 'Audio',
        serverId: 'test-server',
        title: 'Test Title',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        imageUrl: 'https://example.com/image.jpg',
        artwork: [],
        ...overrides
    }),

    createQueue: (length: number = 5): import('../types/media').QueueState => ({
        items: Array.from({ length }, (_, i) => ({
            id: `queue-item-${i}`,
            item: testFactories.createPlayableItem(),
            index: i,
            addedAt: new Date()
        })),
        currentIndex: 0,
        startPosition: 0,
        shuffleMode: 'Sorted',
        repeatMode: 'RepeatNone'
    }),

    createPlaybackState: (
        overrides: Partial<import('../types/media').PlaybackState> = {}
    ): import('../types/media').PlaybackState => ({
        status: 'idle',
        currentItem: null,
        progress: {
            currentTime: 0,
            duration: 0,
            percent: 0,
            buffered: 0
        },
        repeatMode: 'RepeatNone',
        shuffleMode: 'Sorted',
        volume: 100,
        isMuted: false,
        playbackRate: 1,
        audioTrack: null,
        subtitleTrack: null,
        ...overrides
    })
};

/**
 * Cleanup helper for tests
 */
export function createCleanupHelper() {
    const cleanups: (() => void)[] = [];

    return {
        add: (cleanup: () => void) => {
            cleanups.push(cleanup);
        },

        cleanup: () => {
            for (const cleanup of cleanups.reverse()) {
                try {
                    cleanup();
                } catch (error) {
                    logger.error('Cleanup error', { error: String(error) });
                }
            }
            cleanups.length = 0;
        }
    };
}
