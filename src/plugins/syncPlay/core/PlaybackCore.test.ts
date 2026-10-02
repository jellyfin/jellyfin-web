import { describe, expect, it, vi } from 'vitest';

import PlaybackCore from './PlaybackCore';

vi.mock('./Settings', () => ({
    getSetting: vi.fn()
}));

function createPlaybackCore() {
    let isPlaying = false;
    const requestSyncPlayReady = vi.fn();
    const playerWrapper = {
        currentTime: vi.fn(() => 10),
        hasPlaybackRate: vi.fn(() => false),
        isPlaying: vi.fn(() => isPlaying),
        localPause: vi.fn(() => {
            isPlaying = false;
        }),
        localSeek: vi.fn(),
        localUnpause: vi.fn(() => {
            isPlaying = true;
        })
    };
    const timeSyncCore = {
        localDateToRemote: vi.fn((date: Date) => date),
        remoteDateToLocal: vi.fn((date: Date) => date)
    };
    const manager: Record<string, unknown> & {
        _callbacks?: Record<string, unknown[]>
    } = {
        clearSyncIcon: vi.fn(),
        getApiClient: vi.fn(() => ({ requestSyncPlayReady })),
        getPlayerWrapper: vi.fn(() => playerWrapper),
        getQueueCore: vi.fn(() => ({
            getCurrentPlaylistItemId: vi.fn(() => 'playlist-item')
        })),
        getTimeSyncCore: vi.fn(() => timeSyncCore),
        isPlaybackActive: vi.fn(() => true)
    };
    const playbackCore = new PlaybackCore();
    playbackCore.init(manager);

    return {
        manager,
        playbackCore,
        playerWrapper,
        requestSyncPlayReady
    };
}

describe('SyncPlay PlaybackCore', () => {
    it('reports ready only once when a seek completes', async () => {
        const {
            playbackCore,
            playerWrapper,
            requestSyncPlayReady
        } = createPlaybackCore();

        playbackCore.scheduleSeek(new Date(0), 100_000);
        playbackCore.onReady();
        await Promise.resolve();

        expect(playerWrapper.localPause).toHaveBeenCalledOnce();
        expect(requestSyncPlayReady).toHaveBeenCalledOnce();
        expect(requestSyncPlayReady).toHaveBeenCalledWith(expect.objectContaining({
            IsPlaying: false
        }));
    });

    it('keeps only the latest seek ready listener', async () => {
        const { manager, playbackCore, playerWrapper } = createPlaybackCore();

        playbackCore.scheduleSeek(new Date(0), 100_000);
        playbackCore.scheduleSeek(new Date(0), 200_000);

        expect(manager._callbacks?.ready).toHaveLength(1);

        playbackCore.onReady();
        await Promise.resolve();

        expect(playerWrapper.localPause).toHaveBeenCalledOnce();
    });

    it('ignores a completed seek wait that is superseded before settling', async () => {
        const {
            playbackCore,
            playerWrapper,
            requestSyncPlayReady
        } = createPlaybackCore();

        playbackCore.scheduleSeek(new Date(0), 100_000);
        playbackCore.onReady();
        playbackCore.scheduleSeek(new Date(0), 200_000);
        await Promise.resolve();

        expect(playerWrapper.localPause).not.toHaveBeenCalled();
        expect(requestSyncPlayReady).not.toHaveBeenCalled();

        playbackCore.onReady();
        await Promise.resolve();

        expect(playerWrapper.localPause).toHaveBeenCalledOnce();
        expect(requestSyncPlayReady).toHaveBeenCalledOnce();
    });
});
