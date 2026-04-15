import { describe, expect, it, vi, beforeEach } from 'vitest';

import * as Helper from '../Helper';

// Mock toast and globalize to avoid DOM dependencies
vi.mock('../../../../components/toast/toast', () => ({ default: vi.fn() }));
vi.mock('../../../../lib/globalize', () => ({ default: { translate: vi.fn((key) => key) } }));

// Import QueueCore after mocks are set up
const { default: QueueCore } = await import('../QueueCore');

/**
 * Creates a mock SyncPlay manager with the minimum interface needed by QueueCore.
 */
function createMockManager({ lastPlaybackCommand = null, estimateCurrentTicks = null } = {}) {
    const playbackCore = {
        estimateCurrentTicks: estimateCurrentTicks || vi.fn((ticks) => ticks)
    };

    const playerWrapper = {
        localPlay: vi.fn(() => Promise.resolve()),
        localPause: vi.fn(),
        localSetCurrentPlaylistItem: vi.fn(),
        localSetRepeatMode: vi.fn(),
        localSetQueueShuffleMode: vi.fn(),
        onQueueUpdate: vi.fn(),
        currentTime: vi.fn(() => 0),
        currentTimeAsync: null,
        isPlaying: vi.fn(() => false)
    };

    const timeSyncCore = {
        localDateToRemote: vi.fn((date) => date)
    };

    const manager = {
        getPlaybackCore: vi.fn(() => playbackCore),
        getPlayerWrapper: vi.fn(() => playerWrapper),
        getQueueCore: vi.fn(),
        getTimeSyncCore: vi.fn(() => timeSyncCore),
        getLastPlaybackCommand: vi.fn(() => lastPlaybackCommand),
        getApiClient: vi.fn(() => ({
            requestSyncPlayReady: vi.fn(),
            requestSyncPlayBuffering: vi.fn(),
            serverInfo: vi.fn(() => ({ Id: 'server-1' })),
            getCurrentUserId: vi.fn(() => 'user-1'),
            getItem: vi.fn()
        })),
        isFollowingGroupPlayback: vi.fn(() => true),
        isSyncPlayEnabled: vi.fn(() => true),
        isRemote: vi.fn(() => false),
        followGroupPlayback: vi.fn(() => Promise.resolve()),
        haltGroupPlayback: vi.fn(),
        timeSyncCore: timeSyncCore,
        on: vi.fn(),
        off: vi.fn(),
        trigger: vi.fn()
    };

    return { manager, playbackCore, playerWrapper };
}

describe('QueueCore', () => {
    let queueCore;

    beforeEach(() => {
        queueCore = new QueueCore();
    });

    describe('getLastUpdateTime', () => {
        it('should return 0 when no update exists', () => {
            queueCore.init(createMockManager().manager);
            expect(queueCore.getLastUpdateTime()).toBe(0);
        });

        it('should return the timestamp of the last update', () => {
            queueCore.init(createMockManager().manager);
            const updateDate = new Date('2026-01-01T12:00:00Z');
            queueCore.lastPlayQueueUpdate = { LastUpdate: updateDate };
            expect(queueCore.getLastUpdateTime()).toBe(updateDate.getTime());
        });
    });

    describe('getCurrentPlaylistIndex', () => {
        it('should return -1 when no update exists', () => {
            queueCore.init(createMockManager().manager);
            expect(queueCore.getCurrentPlaylistIndex()).toBe(-1);
        });

        it('should return the playing item index', () => {
            queueCore.init(createMockManager().manager);
            queueCore.lastPlayQueueUpdate = { PlayingItemIndex: 3 };
            expect(queueCore.getCurrentPlaylistIndex()).toBe(3);
        });
    });

    describe('startPlayback position clamping', () => {
        it('should clamp startPositionTicks when estimated position exceeds item duration (regression test)', async () => {
            // Simulate: server reported 55s position, but 10s network delay
            // causes estimateCurrentTicks to return 65s, which exceeds the 60s video
            const videoDurationTicks = 60000 * Helper.TicksPerMillisecond;
            const overshootTicks = 65000 * Helper.TicksPerMillisecond;

            const lastPlaybackCommand = {
                PositionTicks: 55000 * Helper.TicksPerMillisecond,
                When: new Date('2026-01-01T00:00:00Z'),
                EmittedAt: new Date('2026-01-01T00:00:00Z')
            };

            const { manager, playerWrapper } = createMockManager({
                lastPlaybackCommand,
                estimateCurrentTicks: vi.fn(() => overshootTicks)
            });

            queueCore.init(manager);

            // Set up a playlist with a known duration item
            queueCore.lastPlayQueueUpdate = {
                LastUpdate: new Date('2026-01-01T00:00:00Z'),
                PlayingItemIndex: 0,
                StartPositionTicks: 55000 * Helper.TicksPerMillisecond,
                Playlist: [{ ItemId: 'item-1', PlaylistItemId: 'pl-item-1' }],
                RepeatMode: 'RepeatNone',
                ShuffleMode: 'Sorted'
            };
            queueCore.playlist = [{
                Id: 'item-1',
                PlaylistItemId: 'pl-item-1',
                RunTimeTicks: videoDurationTicks
            }];

            // Mock scheduleReadyRequestOnPlaybackStart to avoid hanging event listeners
            queueCore.scheduleReadyRequestOnPlaybackStart = vi.fn();

            queueCore.startPlayback(manager.getApiClient());

            // Wait for localPlay to be called
            await vi.waitFor(() => {
                expect(playerWrapper.localPlay).toHaveBeenCalled();
            });

            const callArgs = playerWrapper.localPlay.mock.calls[0][0];
            expect(callArgs.startPositionTicks).toBeLessThanOrEqual(videoDurationTicks);
        });

        it('should not clamp startPositionTicks when within valid range', async () => {
            const videoDurationTicks = 60000 * Helper.TicksPerMillisecond;
            const validTicks = 30000 * Helper.TicksPerMillisecond;

            const { manager, playerWrapper } = createMockManager({
                estimateCurrentTicks: vi.fn(() => validTicks)
            });

            queueCore.init(manager);

            queueCore.lastPlayQueueUpdate = {
                LastUpdate: new Date('2026-01-01T00:00:00Z'),
                PlayingItemIndex: 0,
                StartPositionTicks: 30000 * Helper.TicksPerMillisecond,
                Playlist: [{ ItemId: 'item-1', PlaylistItemId: 'pl-item-1' }],
                RepeatMode: 'RepeatNone',
                ShuffleMode: 'Sorted'
            };
            queueCore.playlist = [{
                Id: 'item-1',
                PlaylistItemId: 'pl-item-1',
                RunTimeTicks: videoDurationTicks
            }];

            queueCore.scheduleReadyRequestOnPlaybackStart = vi.fn();

            queueCore.startPlayback(manager.getApiClient());

            await vi.waitFor(() => {
                expect(playerWrapper.localPlay).toHaveBeenCalled();
            });

            const callArgs = playerWrapper.localPlay.mock.calls[0][0];
            expect(callArgs.startPositionTicks).toBe(validTicks);
        });

        it('should clamp negative startPositionTicks to zero', async () => {
            const videoDurationTicks = 60000 * Helper.TicksPerMillisecond;
            const negativeTicks = -5000 * Helper.TicksPerMillisecond;

            const { manager, playerWrapper } = createMockManager({
                estimateCurrentTicks: vi.fn(() => negativeTicks)
            });

            queueCore.init(manager);

            queueCore.lastPlayQueueUpdate = {
                LastUpdate: new Date('2026-01-01T00:00:00Z'),
                PlayingItemIndex: 0,
                StartPositionTicks: 0,
                Playlist: [{ ItemId: 'item-1', PlaylistItemId: 'pl-item-1' }],
                RepeatMode: 'RepeatNone',
                ShuffleMode: 'Sorted'
            };
            queueCore.playlist = [{
                Id: 'item-1',
                PlaylistItemId: 'pl-item-1',
                RunTimeTicks: videoDurationTicks
            }];

            queueCore.scheduleReadyRequestOnPlaybackStart = vi.fn();

            queueCore.startPlayback(manager.getApiClient());

            await vi.waitFor(() => {
                expect(playerWrapper.localPlay).toHaveBeenCalled();
            });

            const callArgs = playerWrapper.localPlay.mock.calls[0][0];
            expect(callArgs.startPositionTicks).toBe(0);
        });
    });
});
