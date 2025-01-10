/**
 * Module that manages the queue of SyncPlay.
 * @module components/syncPlay/core/QueueCore
 */

import globalize from '@/lib/globalize';
import toast from '@/components/toast/toast';
import * as Helper from '@/plugins/syncPlay/core/Helper';
import Manager from '@/plugins/syncPlay/core/Manager';
import { ApiClient } from 'jellyfin-apiclient';
import type { getItems } from '@/utils/jellyfin-apiclient/getItems';

interface ApiClientPlayMessageData {
    LastUpdate: Date;
    Playlist: Playlist
    PlayingItemIndex: number
    Reason: 'NewPlaylist' | 'SetCurrentItem' | 'NextItem' | 'PreviousItem' | 'RemoveItems' | 'MoveItem' | 'Queue' | 'QueueNext' | 'RepeatMode' | 'ShuffleMode' | string
    StartPositionTicks: number
    RepeatMode: 'shuffle' | string
    ShuffleMode: 'RepeatNone' | string
}
type Playlist = {
    PlaylistItemId: string
    ItemId: string
}[];

type PlaybackCommand = {
    EmittedAt: Date
    PositionTicks: number
    When: Date
};
/**
 * Class that manages the queue of SyncPlay.
 */
class QueueCore {
    private manager: null | Manager;
    private lastPlayQueueUpdate: null | ApiClientPlayMessageData;
    private playlist: any[];
    constructor() {
        this.manager = null;
        this.lastPlayQueueUpdate = null;
        this.playlist = [];
        console.log('constructing');
    }

    /**
     * Initializes the core.
     * @param {Manager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager: Manager) {
        this.manager = syncPlayManager;
    }

    /**
     * Handles the change in the play queue.
     * @param {Object} apiClient The ApiClient.
     * @param {Object} newPlayQueue The new play queue.
     */
    updatePlayQueue(apiClient: ApiClient, newPlayQueue: ApiClientPlayMessageData) {
        newPlayQueue.LastUpdate = new Date(newPlayQueue.LastUpdate);

        if (newPlayQueue.LastUpdate.getTime() <= this.getLastUpdateTime()) {
            console.debug('SyncPlay updatePlayQueue: ignoring old update', newPlayQueue);
            return;
        }

        console.debug('SyncPlay updatePlayQueue:', newPlayQueue);

        const serverId = apiClient.serverInfo().Id;

        this.onPlayQueueUpdate(apiClient, newPlayQueue, serverId).then((previous) => {
            if (!this.manager) {
                throw new Error('Failed to call init()');
            }

            if (newPlayQueue.LastUpdate.getTime() < this.getLastUpdateTime()) {
                console.warn('SyncPlay updatePlayQueue: trying to apply old update.', newPlayQueue);
                throw new Error('Trying to apply old update');
            }

            // Ignore if remote player is self-managed (has own SyncPlay manager running).
            if (this.manager.isRemote()) {
                console.warn('SyncPlay updatePlayQueue: remote player has own SyncPlay manager.');
                return;
            }

            const playerWrapper = this.manager.getPlayerWrapper();

            switch (newPlayQueue.Reason) {
                case 'NewPlaylist': {
                    if (!this.manager.isFollowingGroupPlayback()) {
                        void this.manager.followGroupPlayback(apiClient).then(() => {
                            void this.startPlayback(apiClient);
                        });
                    } else {
                        void this.startPlayback(apiClient);
                    }
                    break;
                }
                case 'SetCurrentItem':
                case 'NextItem':
                case 'PreviousItem': {
                    playerWrapper.onQueueUpdate();

                    const playlistItemId = this.getCurrentPlaylistItemId();
                    this.setCurrentPlaylistItem(apiClient, playlistItemId);
                    break;
                }
                case 'RemoveItems': {
                    playerWrapper.onQueueUpdate();

                    const index = previous.playQueueUpdate?.PlayingItemIndex;
                    const oldPlaylistItemId = (index === -1 || typeof index === 'undefined') ? null : previous.playlist[index].PlaylistItemId;
                    const playlistItemId = this.getCurrentPlaylistItemId();
                    if (oldPlaylistItemId !== playlistItemId) {
                        this.setCurrentPlaylistItem(apiClient, playlistItemId);
                    }
                    break;
                }
                case 'MoveItem':
                case 'Queue':
                case 'QueueNext': {
                    playerWrapper.onQueueUpdate();
                    break;
                }
                case 'RepeatMode':
                    playerWrapper.localSetRepeatMode(this.getRepeatMode());
                    break;
                case 'ShuffleMode':
                    playerWrapper.localSetQueueShuffleMode(this.getShuffleMode());
                    break;
                default:
                    console.error('SyncPlay updatePlayQueue: unknown reason for update:', newPlayQueue.Reason);
                    break;
            }
        }).catch((error) => {
            console.warn('SyncPlay updatePlayQueue:', error);
        });
    }

    /**
     * Called when a play queue update needs to be applied.
     * @param {ApiClient} apiClient The ApiClient.
     * @param {ApiClientPlayMessageData} playQueueUpdate The play queue update.
     * @param {string} serverId The server identifier.
     * @returns {Promise} A promise that gets resolved when update is applied.
     */
    onPlayQueueUpdate(apiClient: ApiClient, playQueueUpdate: ApiClientPlayMessageData, serverId: string): Promise<{ playQueueUpdate: ApiClientPlayMessageData | null, playlist: Playlist }> {
        const oldPlayQueueUpdate: ApiClientPlayMessageData | null = this.lastPlayQueueUpdate;
        const oldPlaylist: Playlist = this.playlist;

        const itemIds = playQueueUpdate.Playlist.map(queueItem => queueItem.ItemId);

        if (!itemIds.length) {
            if (this.lastPlayQueueUpdate && playQueueUpdate.LastUpdate.getTime() <= this.getLastUpdateTime()) {
                return Promise.reject(new Error('Trying to apply old update'));
            }

            this.lastPlayQueueUpdate = playQueueUpdate;
            this.playlist = [];

            return Promise.resolve({
                playQueueUpdate: oldPlayQueueUpdate,
                playlist: oldPlaylist
            });
        }

        return Helper.getItemsForPlayback(apiClient, {
            Ids: itemIds.join(',')
        }).then((result: Awaited<ReturnType<typeof getItems>>) => {
            return Helper.translateItemsForPlayback(apiClient, result.Items, {
                ids: itemIds,
                serverId: serverId
            }).then((items: any[]) => {
                if (this.lastPlayQueueUpdate && playQueueUpdate.LastUpdate.getTime() <= this.getLastUpdateTime()) {
                    throw new Error('Trying to apply old update');
                }

                for (let i = 0; i < items.length; i++) {
                    items[i].PlaylistItemId = playQueueUpdate.Playlist[i].PlaylistItemId;
                }

                this.lastPlayQueueUpdate = playQueueUpdate;
                this.playlist = items;

                return {
                    playQueueUpdate: oldPlayQueueUpdate,
                    playlist: oldPlaylist
                };
            });
        });
    }

    /**
     * Sends a SyncPlayBuffering request on playback start.
     * @param {ApiClient} apiClient The ApiClient.
     * @param {string} origin The origin of the wait call, used for debug.
     */
    scheduleReadyRequestOnPlaybackStart(apiClient: ApiClient, origin: string) {
        if (!this.manager) {
            throw new Error('Failed to call init()');
        }
        const manager = this.manager;
        Helper.waitForEventOnce(this.manager, 'playbackstart', Helper.WaitForEventDefaultTimeout, ['playbackerror']).then(async () => {
            console.debug('SyncPlay scheduleReadyRequestOnPlaybackStart: local pause and notify server.');
            const playerWrapper = manager.getPlayerWrapper();
            playerWrapper.localPause();

            const currentTime = new Date();
            const now = manager.timeSyncCore.localDateToRemote(currentTime);
            const currentPosition = (playerWrapper.currentTimeAsync ?
                await playerWrapper.currentTimeAsync() :
                playerWrapper.currentTime());
            const currentPositionTicks = Math.round(currentPosition * Helper.TicksPerMillisecond);
            const isPlaying = playerWrapper.isPlaying();

            await apiClient.requestSyncPlayReady({
                When: now.toISOString(),
                PositionTicks: currentPositionTicks,
                IsPlaying: isPlaying,
                PlaylistItemId: this.getCurrentPlaylistItemId()
            });
        }).catch((error) => {
            console.error('Error while waiting for `playbackstart` event!', origin, error);
            if (!manager.isSyncPlayEnabled()) {
                toast(globalize.translate('MessageSyncPlayErrorMedia'));
            }

            manager.haltGroupPlayback(apiClient);
        });
    }

    /**
     * Prepares this client for playback by loading the group's content.
     * @param {ApiClient} apiClient The ApiClient.
     */
    startPlayback(apiClient: ApiClient) {
        if (!this.manager) {
            throw new Error('Failed to call init()');
        }

        if (!this.manager.isFollowingGroupPlayback()) {
            console.debug('SyncPlay startPlayback: ignoring, not following playback.');
            return Promise.reject();
        }

        if (this.isPlaylistEmpty()) {
            console.debug('SyncPlay startPlayback: empty playlist.');
            return;
        }

        // Estimate start position ticks from last playback command, if available.
        const playbackCommand = this.manager.getLastPlaybackCommand() as PlaybackCommand;
        let startPositionTicks = 0;

        if (playbackCommand && playbackCommand.EmittedAt.getTime() >= this.getLastUpdateTime()) {
            // Prefer playback commands as they're more frequent (and also because playback position is PlaybackCore's concern).
            startPositionTicks = this.manager.getPlaybackCore().estimateCurrentTicks(playbackCommand.PositionTicks, playbackCommand.When);
        } else {
            // A PlayQueueUpdate is emited only on queue changes so it's less reliable for playback position syncing.
            const oldStartPositionTicks = this.getStartPositionTicks();
            const lastQueueUpdateDate = this.getLastUpdate();
            startPositionTicks = this.manager.getPlaybackCore().estimateCurrentTicks(oldStartPositionTicks, lastQueueUpdateDate || new Date());
        }

        const serverId = apiClient.serverInfo().Id;

        this.scheduleReadyRequestOnPlaybackStart(apiClient, 'startPlayback');

        const playerWrapper = this.manager.getPlayerWrapper();
        playerWrapper.localPlay({
            ids: this.getPlaylistAsItemIds(),
            startPositionTicks: startPositionTicks,
            startIndex: this.getCurrentPlaylistIndex(),
            serverId: serverId
        }).catch((error: Error) => {
            console.error(error);
            toast(globalize.translate('MessageSyncPlayErrorMedia'));
        });
    }

    /**
     * Sets the current playing item.
     * @param {ApiClient} apiClient The ApiClient.
     * @param {string} playlistItemId The playlist id of the item to play.
     */
    setCurrentPlaylistItem(apiClient: ApiClient, playlistItemId: string) {
        if (!this.manager) {
            throw new Error('Failed to call init()');
        }

        if (!this.manager.isFollowingGroupPlayback()) {
            console.debug('SyncPlay setCurrentPlaylistItem: ignoring, not following playback.');
            return;
        }

        this.scheduleReadyRequestOnPlaybackStart(apiClient, 'setCurrentPlaylistItem');

        const playerWrapper = this.manager.getPlayerWrapper();
        playerWrapper.localSetCurrentPlaylistItem(playlistItemId);
    }

    /**
     * Gets the index of the current playing item.
     * @returns {number} The index of the playing item.
     */
    getCurrentPlaylistIndex() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.PlayingItemIndex;
        } else {
            return -1;
        }
    }

    /**
     * Gets the playlist item id of the playing item.
     * @returns {string} The playlist item id.
     */
    getCurrentPlaylistItemId() {
        if (this.lastPlayQueueUpdate) {
            const index = this.lastPlayQueueUpdate.PlayingItemIndex;
            return index === -1 ? null : this.playlist[index].PlaylistItemId;
        } else {
            return null;
        }
    }

    /**
     * Gets a copy of the playlist.
     * @returns {Array} The playlist.
     */
    getPlaylist() {
        return this.playlist.slice(0);
    }

    /**
     * Checks if playlist is empty.
     * @returns {boolean} _true_ if playlist is empty, _false_ otherwise.
     */
    isPlaylistEmpty() {
        return this.playlist.length === 0;
    }

    /**
     * Gets the last update time as date, if any.
     * @returns {Date} The date.
     */
    getLastUpdate() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.LastUpdate;
        } else {
            return null;
        }
    }

    /**
     * Gets the time of when the queue has been updated.
     * @returns {number} The last update time.
     */
    getLastUpdateTime() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.LastUpdate.getTime();
        } else {
            return 0;
        }
    }

    /**
     * Gets the last reported start position ticks of playing item.
     * @returns {number} The start position ticks.
     */
    getStartPositionTicks() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.StartPositionTicks;
        } else {
            return 0;
        }
    }

    /**
     * Gets the list of item identifiers in the playlist.
     * @returns {Array} The list of items.
     */
    getPlaylistAsItemIds() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.Playlist.map(queueItem => queueItem.ItemId);
        } else {
            return [];
        }
    }

    /**
     * Gets the repeat mode.
     * @returns {string} The repeat mode.
     */
    getRepeatMode() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.RepeatMode;
        } else {
            return 'Sorted';
        }
    }
    /**
     * Gets the shuffle mode.
     * @returns {string} The shuffle mode.
     */
    getShuffleMode() {
        if (this.lastPlayQueueUpdate) {
            return this.lastPlayQueueUpdate.ShuffleMode;
        } else {
            return 'RepeatNone';
        }
    }
}

export default QueueCore;
