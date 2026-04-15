import { describe, expect, it, vi, beforeEach } from 'vitest';

import PlaybackCore from '../PlaybackCore';
import * as Helper from '../Helper';

/**
 * Creates a mock SyncPlay manager with the minimum interface needed by PlaybackCore.
 */
function createMockManager({ currentTimeMs = 0, isPlaying = false, isPlaybackActive = true, durationTicks = 0 } = {}) {
    const playerWrapper = {
        currentTime: vi.fn(() => currentTimeMs),
        currentTimeAsync: null,
        isPlaying: vi.fn(() => isPlaying),
        hasPlaybackRate: vi.fn(() => false),
        setPlaybackRate: vi.fn(),
        localUnpause: vi.fn(),
        localPause: vi.fn(),
        localSeek: vi.fn(),
        localStop: vi.fn(),
        durationTicks: durationTicks
    };

    const timeSyncCore = {
        localDateToRemote: vi.fn((date) => date),
        remoteDateToLocal: vi.fn((date) => date)
    };

    const queueCore = {
        getCurrentPlaylistItemId: vi.fn(() => 'playlist-item-1'),
        getCurrentPlayingItemDurationTicks: vi.fn(() => durationTicks)
    };

    const manager = {
        getPlayerWrapper: vi.fn(() => playerWrapper),
        getTimeSyncCore: vi.fn(() => timeSyncCore),
        getPlaybackCore: vi.fn(),
        getQueueCore: vi.fn(() => queueCore),
        getApiClient: vi.fn(() => ({
            requestSyncPlayBuffering: vi.fn(),
            requestSyncPlayReady: vi.fn()
        })),
        isPlaybackActive: vi.fn(() => isPlaybackActive),
        isRemote: vi.fn(() => false),
        clearSyncIcon: vi.fn(),
        showSyncIcon: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        trigger: vi.fn()
    };

    return { manager, playerWrapper, timeSyncCore, queueCore };
}

describe('PlaybackCore', () => {
    let playbackCore;

    beforeEach(() => {
        playbackCore = new PlaybackCore();
    });

    describe('estimateCurrentTicks', () => {
        it('should return the same ticks when no time has elapsed', () => {
            const { manager, timeSyncCore } = createMockManager();
            playbackCore.init(manager);

            const baseTicks = 1000 * Helper.TicksPerMillisecond; // 1 second
            const when = new Date('2026-01-01T00:00:00Z');
            const currentTime = new Date('2026-01-01T00:00:00Z'); // Same time

            const result = playbackCore.estimateCurrentTicks(baseTicks, when, currentTime);
            expect(result).toBe(baseTicks);
        });

        it('should add elapsed time to ticks', () => {
            const { manager } = createMockManager();
            playbackCore.init(manager);

            const baseTicks = 1000 * Helper.TicksPerMillisecond; // 1 second
            const when = new Date('2026-01-01T00:00:00Z');
            const currentTime = new Date('2026-01-01T00:00:05Z'); // 5 seconds later

            const result = playbackCore.estimateCurrentTicks(baseTicks, when, currentTime);
            const expectedTicks = baseTicks + 5000 * Helper.TicksPerMillisecond;
            expect(result).toBe(expectedTicks);
        });

        it('should produce ticks exceeding video duration with large network delay (demonstrates the bug)', () => {
            const { manager } = createMockManager();
            playbackCore.init(manager);

            // Video is 60 seconds long
            const videoDurationTicks = 60000 * Helper.TicksPerMillisecond;
            // Server reported position at 55 seconds
            const baseTicks = 55000 * Helper.TicksPerMillisecond;
            const when = new Date('2026-01-01T00:00:00Z');
            // Client processes 10 seconds later (network delay)
            const currentTime = new Date('2026-01-01T00:00:10Z');

            const result = playbackCore.estimateCurrentTicks(baseTicks, when, currentTime);
            // Result would be 65 seconds - past the end of the video!
            expect(result).toBeGreaterThan(videoDurationTicks);
        });
    });

    describe('localSeek', () => {
        it('should clamp positionTicks to media duration', () => {
            const durationTicks = 60000 * Helper.TicksPerMillisecond; // 60 seconds
            const { manager, playerWrapper } = createMockManager({ durationTicks });
            playbackCore.init(manager);

            // Try to seek past the end
            const pastEndTicks = 65000 * Helper.TicksPerMillisecond;
            playbackCore.localSeek(pastEndTicks);

            // Should have clamped to duration
            expect(playerWrapper.localSeek).toHaveBeenCalledWith(durationTicks);
        });

        it('should clamp negative positionTicks to zero', () => {
            const durationTicks = 60000 * Helper.TicksPerMillisecond;
            const { manager, playerWrapper } = createMockManager({ durationTicks });
            playbackCore.init(manager);

            playbackCore.localSeek(-5000 * Helper.TicksPerMillisecond);

            expect(playerWrapper.localSeek).toHaveBeenCalledWith(0);
        });

        it('should pass through valid positionTicks unchanged', () => {
            const durationTicks = 60000 * Helper.TicksPerMillisecond;
            const { manager, playerWrapper } = createMockManager({ durationTicks });
            playbackCore.init(manager);

            const validTicks = 30000 * Helper.TicksPerMillisecond;
            playbackCore.localSeek(validTicks);

            expect(playerWrapper.localSeek).toHaveBeenCalledWith(validTicks);
        });

        it('should not seek when no player is active', () => {
            const { manager, playerWrapper } = createMockManager({ isPlaybackActive: false });
            playbackCore.init(manager);

            playbackCore.localSeek(1000);

            expect(playerWrapper.localSeek).not.toHaveBeenCalled();
        });
    });
});
