/**
 * Module that replaces the PlaybackManager's queue when playing local files.
 * @module components/syncPlay/ui/players/OfflineQueueManager
 */

import QueueManager from './QueueManager';
import OfflinePlayback from '../offlinePlayback/OfflinePlayback';

/**
 * Class that replaces the PlaybackManager's queue when playing local files.
 */
class OfflineQueueManager extends QueueManager {
    constructor(syncPlayManager) {
        super(syncPlayManager);
    }

    toOffline(item) {
        return OfflinePlayback.toOffline(item);
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getPlaylist() {
        const items = super.getPlaylist();
        for (let i = 0; i < items.length; i++) {
            items[i] = this.toOffline(items[i]);
        }

        return items;
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getCurrentItem() {
        const item = super.getCurrentItem();
        return this.toOffline(item);
    }

    /**
     * Placeholder for original PlayQueueManager method.
     */
    getNextItemInfo() {
        const result = super.getNextItemInfo();
        if (result) {
            result.item = this.toOffline(result.item);
        }

        return result;
    }
}

export default OfflineQueueManager;
