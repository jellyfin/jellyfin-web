/**
 * Module that replaces the PlaybackManager's queue.
 * @module components/syncPlay/ui/players/QueueManager
 */

/**
 * Class that replaces the PlaybackManager's queue.
 */
class QueueManager {
    constructor(syncPlayManager) {
        this.queueCore = syncPlayManager.getQueueCore();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getPlaylist() {
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
    getCurrentPlaylistIndex() {
        return this.queueCore.getCurrentPlaylistIndex();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getCurrentItem() {
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
    getCurrentPlaylistItemId() {
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
    movePlaylistItem() {
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
    getRepeatMode() {
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
    getShuffleMode() {
        return this.queueCore.getShuffleMode();
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getNextItemInfo() {
        const playlist = this.getPlaylist();
        let newIndex;

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
