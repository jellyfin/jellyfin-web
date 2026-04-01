import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies before importing the module under test
vi.mock('./playback/playbackmanager', () => ({
    playbackManager: {
        getPlaylist: vi.fn(),
        getCurrentPlaylistIndex: vi.fn(),
        stop: vi.fn(),
        nextTrack: vi.fn(),
        play: vi.fn()
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getApiClient: vi.fn()
    }
}));

vi.mock('lib/globalize', () => ({
    default: {
        translate: vi.fn((key) => key)
    }
}));

vi.mock('./confirm/confirm', () => ({
    default: vi.fn()
}));

vi.mock('./toast/toast', () => ({
    default: vi.fn()
}));

import { recycleCurrentItem } from './recycleHelper';
import { playbackManager } from './playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import confirm from './confirm/confirm';
import toast from './toast/toast';

function createMockApiClient() {
    return {
        getCurrentUserId: vi.fn(() => 'user-1'),
        getItem: vi.fn(),
        getUrl: vi.fn((path) => `http://localhost:8096/${path}`),
        ajax: vi.fn()
    };
}

function setupPlaylist(items, currentIndex) {
    playbackManager.getPlaylist.mockResolvedValue(
        items.map((id, i) => ({ Id: id, PlaylistItemId: `pl-${i}` }))
    );
    playbackManager.getCurrentPlaylistIndex.mockReturnValue(currentIndex);
    playbackManager.stop.mockResolvedValue();
    playbackManager.nextTrack.mockResolvedValue();
    playbackManager.play.mockResolvedValue();
}

describe('recycleCurrentItem', () => {
    let apiClient;
    let mockPlayer;

    beforeEach(() => {
        vi.useFakeTimers();
        apiClient = createMockApiClient();
        ServerConnections.getApiClient.mockReturnValue(apiClient);
        confirm.mockResolvedValue();
        mockPlayer = { id: 'test-player' };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should do nothing when nowPlayingItem is null', async () => {
        await recycleCurrentItem(mockPlayer, null);
        expect(ServerConnections.getApiClient).not.toHaveBeenCalled();
    });

    it('should do nothing when nowPlayingItem has no Id', async () => {
        await recycleCurrentItem(mockPlayer, { ServerId: 'srv-1' });
        expect(ServerConnections.getApiClient).not.toHaveBeenCalled();
    });

    it('should do nothing when item.CanDelete is false', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-1', CanDelete: false });
        await recycleCurrentItem(mockPlayer, { Id: 'item-1', ServerId: 'srv-1' });
        expect(confirm).not.toHaveBeenCalled();
    });

    it('should call nextTrack (not stop) before recycling when queue has more items', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-1', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-1', 'item-2', 'item-3'], 0);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-1', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(playbackManager.nextTrack).toHaveBeenCalledWith(mockPlayer);
        expect(playbackManager.stop).not.toHaveBeenCalled();
    });

    it('should call RecycleBin API with correct item ID', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-42', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-42', 'item-99'], 0);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-42', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(apiClient.ajax).toHaveBeenCalledWith({
            type: 'POST',
            url: 'http://localhost:8096/RecycleBin/item-42'
        });
    });

    it('should use nextTrack when deleting middle item in queue', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-2', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-1', 'item-2', 'item-3', 'item-4'], 1);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-2', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(playbackManager.nextTrack).toHaveBeenCalledWith(mockPlayer);
        expect(playbackManager.stop).not.toHaveBeenCalled();
    });

    it('should stop (not nextTrack) when deleting last item in queue', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-3', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-1', 'item-2', 'item-3'], 2);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-3', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(playbackManager.stop).toHaveBeenCalledWith(mockPlayer);
        expect(playbackManager.nextTrack).not.toHaveBeenCalled();
    });

    it('should show error toast when recycle API fails', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-1', CanDelete: true });
        apiClient.ajax.mockRejectedValue(new Error('Server error'));
        setupPlaylist(['item-1', 'item-2'], 0);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-1', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(toast).toHaveBeenCalledWith({ text: 'ErrorDeletingItem' });
    });

    it('should stop when player is null and last track', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-1', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-1'], 0);

        const promise = recycleCurrentItem(null, { Id: 'item-1', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        expect(playbackManager.stop).not.toHaveBeenCalled();
        expect(playbackManager.nextTrack).not.toHaveBeenCalled();
        expect(apiClient.ajax).toHaveBeenCalled();
    });

    it('should recycle the original item even after advancing to next track', async () => {
        apiClient.getItem.mockResolvedValue({ Id: 'item-1', CanDelete: true });
        apiClient.ajax.mockResolvedValue();
        setupPlaylist(['item-1', 'item-2'], 0);

        const promise = recycleCurrentItem(mockPlayer, { Id: 'item-1', ServerId: 'srv-1' });
        await vi.advanceTimersByTimeAsync(600);
        await promise;

        // Should recycle item-1, not item-2
        expect(apiClient.ajax).toHaveBeenCalledWith({
            type: 'POST',
            url: 'http://localhost:8096/RecycleBin/item-1'
        });
    });
});
