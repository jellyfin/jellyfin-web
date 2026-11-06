/**
 * Module that replaces the PlaybackManager's queue.
 * @module components/syncPlay/ui/players/QueueManager
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import type { MovePlaylistItemResult, NextItemInfo } from '@/components/playback/playqueuemanager';
import type SyncPlayManager from '@/plugins/syncPlay/core/Manager';
import type QueueCore from '@/plugins/syncPlay/core/QueueCore';

/**
 * Class that replaces the PlaybackManager's queue.
 */
class QueueManager {
    private queueCore: QueueCore;

    constructor(syncPlayManager: SyncPlayManager) {
        this.queueCore = syncPlayManager.getQueueCore();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getPlaylist(): BaseItemDto[] {
        return this.queueCore.getPlaylist();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    setPlaylist() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    queue() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    shufflePlaylist() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    sortShuffledPlaylist() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    clearPlaylist() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    queueNext() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getCurrentPlaylistIndex(): number {
        return this.queueCore.getCurrentPlaylistIndex();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getCurrentItem(): BaseItemDto | null {
        const index = this.getCurrentPlaylistIndex();
        if (index >= 0) {
            const playlist = this.getPlaylist();
            return playlist[index];
        } else {
            return null;
        }
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getCurrentPlaylistItemId(): string | null {
        return this.queueCore.getCurrentPlaylistItemId();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    setPlaylistState() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    setPlaylistIndex() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    removeFromPlaylist() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    movePlaylistItem(): MovePlaylistItemResult {
        // Do nothing.
        return {
            result: 'noop'
        };
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    reset() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    setRepeatMode() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getRepeatMode(): string {
        return this.queueCore.getRepeatMode();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    setShuffleMode() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    toggleShuffleMode() {
        // Do nothing.
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getShuffleMode(): string {
        return this.queueCore.getShuffleMode();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getNextItemInfo(): NextItemInfo | null {
        const playlist = this.getPlaylist();
        let newIndex: number;

        switch (this.getRepeatMode()) {
            case 'RepeatOne':
                newIndex = this.getCurrentPlaylistIndex();
                break;
            case 'RepeatAll':
                newIndex = this.getCurrentPlaylistIndex() + 1;
                if (newIndex >= playlist.length) {
                    newIndex = 0;
                }
                break;
            default:
                newIndex = this.getCurrentPlaylistIndex() + 1;
                break;
        }

        if (newIndex < 0 || newIndex >= playlist.length) {
            return null;
        }

        const item = playlist[newIndex];

        if (!item) {
            return null;
        }

        return {
            item: item,
            index: newIndex
        };
    }
}

export default QueueManager;
