/**
 * Module that exposes SyncPlay calls to external modules.
 * @module components/syncPlay/core/Controller
 */

import * as Helper from './Helper';
import { postSyncPlayV2 } from './V2Api';
import toast from '../../../components/toast/toast';
import globalize from '../../../lib/globalize';
import { toBoolean, toFloat } from '../../../utils/string.ts';
import { getSetting } from './Settings';

/**
 * Class that exposes SyncPlay calls to external modules.
 */
class Controller {
    constructor() {
        this.manager = null;
        this.enforceReadyBeforeUnpause = true;
        this.commandCooldownMs = 140.0;
        this.lastTransportCommandAt = 0;
        this.lastSeekCommandAt = 0;
        this.pendingSeekPositionTicks = null;
        this.pendingSeekTimeout = null;
    }

    /**
     * Initializes the controller.
     * @param {Manager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager) {
        this.manager = syncPlayManager;
        this.loadPreferences();
    }

    /**
     * Loads settings used by controller logic.
     */
    loadPreferences() {
        this.enforceReadyBeforeUnpause = toBoolean(getSetting('enforceReadyBeforeUnpause'), true);
        this.commandCooldownMs = Math.max(0, toFloat(getSetting('commandCooldownMs'), 140.0));
    }

    /**
     * Whether user-triggered unpause is blocked while group is still waiting.
     * @returns {boolean} True when ready-gate is enabled.
     */
    isReadyGateBeforeUnpauseEnabled() {
        return this.enforceReadyBeforeUnpause;
    }

    /**
     * Gets command cooldown in milliseconds.
     * @returns {number} Cooldown value.
     */
    getCommandCooldownMs() {
        return this.commandCooldownMs;
    }

    /**
     * Returns true when transport command is currently throttled.
     * @returns {boolean} Whether cooldown is active.
     */
    isTransportCommandOnCooldown() {
        if (this.commandCooldownMs <= 0) {
            return false;
        }

        return (Date.now() - this.lastTransportCommandAt) < this.commandCooldownMs;
    }

    /**
     * Returns remaining seek cooldown in milliseconds.
     * @returns {number} Remaining cooldown.
     */
    getSeekCooldownRemainingMs() {
        if (this.commandCooldownMs <= 0) {
            return 0;
        }

        const elapsed = Date.now() - this.lastSeekCommandAt;
        return Math.max(0, this.commandCooldownMs - elapsed);
    }

    /**
     * Sends a seek command without throttle checks.
     * @param {number} positionTicks The seek position.
     */
    postSeek(positionTicks) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'Seek', {
            PositionTicks: positionTicks
        });
    }

    /**
     * Toggles playback status in SyncPlay group.
     */
    playPause() {
        if (this.manager.isPlaying()) {
            this.pause();
        } else {
            this.unpause();
        }
    }

    /**
     * Unpauses playback in SyncPlay group.
     */
    unpause() {
        this.loadPreferences();
        if (this.isTransportCommandOnCooldown()) {
            return;
        }

        if (this.enforceReadyBeforeUnpause && this.manager.isGroupWaiting()) {
            toast(globalize.translate('MessageSyncPlayWaitForReadyBeforeUnpause'));
            return;
        }

        this.lastTransportCommandAt = Date.now();
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'Unpause');
    }

    /**
     * Pauses playback in SyncPlay group.
     */
    pause() {
        this.loadPreferences();
        if (this.isTransportCommandOnCooldown()) {
            return;
        }

        this.lastTransportCommandAt = Date.now();
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'Pause');

        // Pause locally as well, to give the user some little control.
        const playerWrapper = this.manager.getPlayerWrapper();
        playerWrapper.localPause();
    }

    /**
     * Seeks playback to specified position in SyncPlay group.
     * @param {number} positionTicks The position.
     */
    seek(positionTicks) {
        this.loadPreferences();
        const remainingCooldown = this.getSeekCooldownRemainingMs();
        if (remainingCooldown <= 0) {
            this.lastSeekCommandAt = Date.now();
            this.postSeek(positionTicks);
            return;
        }

        this.pendingSeekPositionTicks = positionTicks;
        if (this.pendingSeekTimeout) {
            return;
        }

        this.pendingSeekTimeout = setTimeout(() => {
            this.pendingSeekTimeout = null;
            if (this.pendingSeekPositionTicks == null) {
                return;
            }

            const pendingPositionTicks = this.pendingSeekPositionTicks;
            this.pendingSeekPositionTicks = null;
            this.lastSeekCommandAt = Date.now();
            this.postSeek(pendingPositionTicks);
        }, remainingCooldown);
    }

    /**
     * Starts playback in SyncPlay group.
     * @param {Object} options The play data.
     */
    play(options) {
        const apiClient = this.manager.getApiClient();
        const sendPlayRequest = (items) => {
            const queue = items.map(item => item.Id);
            return postSyncPlayV2(apiClient, 'SetNewQueue', {
                PlayingQueue: queue,
                PlayingItemPosition: options.startIndex ? options.startIndex : 0,
                StartPositionTicks: options.startPositionTicks ? options.startPositionTicks : 0
            });
        };

        if (options.items) {
            return Helper.translateItemsForPlayback(apiClient, options.items, options).then(sendPlayRequest);
        } else {
            return Helper.getItemsForPlayback(apiClient, {
                Ids: options.ids.join(',')
            }).then(function (result) {
                return Helper.translateItemsForPlayback(apiClient, result.Items, options).then(sendPlayRequest);
            });
        }
    }

    /**
     * Sets current playing item in SyncPlay group.
     * @param {string} playlistItemId The item playlist identifier.
     */
    setCurrentPlaylistItem(playlistItemId) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'SetPlaylistItem', {
            PlaylistItemId: playlistItemId
        });
    }

    /**
     * Clears the playlist of a SyncPlay group.
     * @param {Array} clearPlayingItem Whether to remove the playing item as well.
     */
    clearPlaylist(clearPlayingItem = false) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'RemoveFromPlaylist', {
            ClearPlaylist: true,
            ClearPlayingItem: clearPlayingItem
        });
    }

    /**
     * Removes items from SyncPlay group playlist.
     * @param {Array} playlistItemIds The items to remove.
     */
    removeFromPlaylist(playlistItemIds) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'RemoveFromPlaylist', {
            PlaylistItemIds: playlistItemIds
        });
    }

    /**
     * Moves an item in the SyncPlay group playlist.
     * @param {string} playlistItemId The item playlist identifier.
     * @param {number} newIndex The new position.
     */
    movePlaylistItem(playlistItemId, newIndex) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'MovePlaylistItem', {
            PlaylistItemId: playlistItemId,
            NewIndex: newIndex
        });
    }

    /**
     * Adds items to the SyncPlay group playlist.
     * @param {Object} options The items to add.
     * @param {string} mode The queue mode, optional.
     */
    queue(options, mode = 'Queue') {
        const apiClient = this.manager.getApiClient();
        if (options.items) {
            Helper.translateItemsForPlayback(apiClient, options.items, options).then((items) => {
                const itemIds = items.map(item => item.Id);
                postSyncPlayV2(apiClient, 'Queue', {
                    ItemIds: itemIds,
                    Mode: mode
                });
            });
        } else {
            Helper.getItemsForPlayback(apiClient, {
                Ids: options.ids.join(',')
            }).then(function (result) {
                Helper.translateItemsForPlayback(apiClient, result.Items, options).then((items) => {
                    const itemIds = items.map(item => item.Id);
                    postSyncPlayV2(apiClient, 'Queue', {
                        ItemIds: itemIds,
                        Mode: mode
                    });
                });
            });
        }
    }

    /**
     * Adds items to the SyncPlay group playlist after the playing item.
     * @param {Object} options The items to add.
     */
    queueNext(options) {
        this.queue(options, 'QueueNext');
    }

    /**
     * Plays next item from playlist in SyncPlay group.
     */
    nextItem() {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'NextItem', {
            PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId()
        });
    }

    /**
     * Plays previous item from playlist in SyncPlay group.
     */
    previousItem() {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'PreviousItem', {
            PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId()
        });
    }

    /**
     * Sets the repeat mode in SyncPlay group.
     * @param {string} mode The repeat mode.
     */
    setRepeatMode(mode) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'SetRepeatMode', {
            Mode: mode
        });
    }

    /**
     * Sets the shuffle mode in SyncPlay group.
     * @param {string} mode The shuffle mode.
     */
    setShuffleMode(mode) {
        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'SetShuffleMode', {
            Mode: mode
        });
    }

    /**
     * Toggles the shuffle mode in SyncPlay group.
     */
    toggleShuffleMode() {
        let mode = this.manager.getQueueCore().getShuffleMode();
        mode = mode === 'Sorted' ? 'Shuffle' : 'Sorted';

        const apiClient = this.manager.getApiClient();
        postSyncPlayV2(apiClient, 'SetShuffleMode', {
            Mode: mode
        });
    }
}

export default Controller;
