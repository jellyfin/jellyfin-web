import * as Helper from './Helper';

class Controller {
    private manager: any = null;

    init(syncPlayManager: any) { this.manager = syncPlayManager; }

    playPause() {
        if (this.manager.isPlaying()) this.pause();
        else this.unpause();
    }

    unpause() { this.manager.getApiClient().requestSyncPlayUnpause(); }

    pause() {
        this.manager.getApiClient().requestSyncPlayPause();
        this.manager.getPlayerWrapper().localPause();
    }

    seek(positionTicks: number) {
        this.manager.getApiClient().requestSyncPlaySeek({ PositionTicks: positionTicks });
    }

    play(options: any) {
        const apiClient = this.manager.getApiClient();
        const sendPlayRequest = (items: any[]) => {
            const queue = items.map(item => item.Id);
            return apiClient.requestSyncPlaySetNewQueue({
                PlayingQueue: queue,
                PlayingItemPosition: options.startIndex || 0,
                StartPositionTicks: options.startPositionTicks || 0
            });
        };

        if (options.items) return Helper.translateItemsForPlayback(apiClient, options.items, options).then(sendPlayRequest);
        return Helper.getItemsForPlayback(apiClient, { Ids: options.ids.join(',') })
            .then((result: any) => Helper.translateItemsForPlayback(apiClient, result.Items, options).then(sendPlayRequest));
    }

    setCurrentPlaylistItem(playlistItemId: string) {
        this.manager.getApiClient().requestSyncPlaySetPlaylistItem({ PlaylistItemId: playlistItemId });
    }

    clearPlaylist(clearPlayingItem = false) {
        this.manager.getApiClient().requestSyncPlayRemoveFromPlaylist({ ClearPlaylist: true, ClearPlayingItem: clearPlayingItem });
    }

    removeFromPlaylist(playlistItemIds: string[]) {
        this.manager.getApiClient().requestSyncPlayRemoveFromPlaylist({ PlaylistItemIds: playlistItemIds });
    }

    movePlaylistItem(playlistItemId: string, newIndex: number) {
        this.manager.getApiClient().requestSyncPlayMovePlaylistItem({ PlaylistItemId: playlistItemId, NewIndex: newIndex });
    }

    queue(options: any, mode: string = 'Queue') {
        const apiClient = this.manager.getApiClient();
        const sendQueue = (items: any[]) => {
            const itemIds = items.map(item => item.Id);
            apiClient.requestSyncPlayQueue({ ItemIds: itemIds, Mode: mode });
        };

        if (options.items) Helper.translateItemsForPlayback(apiClient, options.items, options).then(sendQueue);
        else Helper.getItemsForPlayback(apiClient, { Ids: options.ids.join(',') })
            .then((result: any) => Helper.translateItemsForPlayback(apiClient, result.Items, options).then(sendQueue));
    }

    queueNext(options: any) { this.queue(options, 'QueueNext'); }

    nextItem() {
        this.manager.getApiClient().requestSyncPlayNextItem({ PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId() });
    }

    previousItem() {
        this.manager.getApiClient().requestSyncPlayPreviousItem({ PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId() });
    }

    setRepeatMode(mode: string) { this.manager.getApiClient().requestSyncPlaySetRepeatMode({ Mode: mode }); }
    setShuffleMode(mode: string) { this.manager.getApiClient().requestSyncPlaySetShuffleMode({ Mode: mode }); }

    toggleShuffleMode() {
        let mode = this.manager.getQueueCore().getShuffleMode();
        mode = mode === 'Sorted' ? 'Shuffle' : 'Sorted';
        this.manager.getApiClient().requestSyncPlaySetShuffleMode({ Mode: mode });
    }
}

export { Controller };
export default Controller;