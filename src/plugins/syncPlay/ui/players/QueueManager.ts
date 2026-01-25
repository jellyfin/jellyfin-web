class QueueManager {
    private queueCore: any;

    constructor(syncPlayManager: any) {
        this.queueCore = syncPlayManager.getQueueCore();
    }

    getPlaylist() {
        return this.queueCore.getPlaylist();
    }
    setPlaylist() {}
    queue() {}
    shufflePlaylist() {}
    sortShuffledPlaylist() {}
    clearPlaylist() {}
    queueNext() {}
    getCurrentPlaylistIndex() {
        return this.queueCore.getCurrentPlaylistIndex();
    }

    getCurrentItem() {
        const index = this.getCurrentPlaylistIndex();
        if (index >= 0) {
            const playlist = this.getPlaylist();
            return playlist[index];
        }
        return null;
    }

    getCurrentPlaylistItemId() {
        return this.queueCore.getCurrentPlaylistItemId();
    }
    setPlaylistState() {}
    setPlaylistIndex() {}
    removeFromPlaylist() {}
    movePlaylistItem() {
        return { result: 'noop' };
    }
    reset() {}
    setRepeatMode() {}
    getRepeatMode() {
        return this.queueCore.getRepeatMode();
    }
    setShuffleMode() {}
    toggleShuffleMode() {}
    getShuffleMode() {
        return this.queueCore.getShuffleMode();
    }

    getNextItemInfo() {
        const playlist = this.getPlaylist();
        let newIndex;

        switch (this.getRepeatMode()) {
            case 'RepeatOne':
                newIndex = this.getCurrentPlaylistIndex();
                break;
            case 'RepeatAll':
                newIndex = this.getCurrentPlaylistIndex() + 1;
                if (newIndex >= playlist.length) newIndex = 0;
                break;
            default:
                newIndex = this.getCurrentPlaylistIndex() + 1;
                break;
        }

        if (newIndex < 0 || newIndex >= playlist.length) return null;
        const item = playlist[newIndex];
        if (!item) return null;

        return { item, index: newIndex };
    }
}

export default QueueManager;
