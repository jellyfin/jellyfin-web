/**
 * Module that translates events from a player to SyncPlay events.
 * @module components/syncPlay/core/players/GenericPlayer
 */

import Events from '../../../../utils/events.ts';

/**
 * Class that translates events from a player to SyncPlay events.
 */
class GenericPlayer {
    static type = 'generic';

    constructor(player, syncPlayManager) {
        this.player = player;
        this.manager = syncPlayManager;
        this.playbackCore = syncPlayManager.getPlaybackCore();
        this.queueCore = syncPlayManager.getQueueCore();
        this.bound = false;
    }

    /**
     * Binds to the player's events.
     */
    bindToPlayer() {
        if (this.bound) {
            return;
        }

        this.localBindToPlayer();
        this.bound = true;
    }

    /**
     * Binds to the player's events. Overriden.
     */
    localBindToPlayer() {
        throw new Error('Override this method!');
    }

    /**
     * Removes the bindings from the player's events.
     */
    unbindFromPlayer() {
        if (!this.bound) {
            return;
        }

        this.localUnbindFromPlayer();
        this.bound = false;
    }

    /**
     * Removes the bindings from the player's events. Overriden.
     */
    localUnbindFromPlayer() {
        throw new Error('Override this method!');
    }

    /**
     * Called when playback starts.
     */
    onPlaybackStart(player, state) {
        this.playbackCore.onPlaybackStart(player, state);
        Events.trigger(this, 'playbackstart', [player, state]);
    }

    /**
     * Called when playback stops.
     */
    onPlaybackStop(stopInfo) {
        this.playbackCore.onPlaybackStop(stopInfo);
        Events.trigger(this, 'playbackstop', [stopInfo]);
    }

    /**
     * Called when playback unpauses.
     */
    onUnpause() {
        this.playbackCore.onUnpause();
        Events.trigger(this, 'unpause', [this.currentPlayer]);
    }

    /**
     * Called when playback pauses.
     */
    onPause() {
        this.playbackCore.onPause();
        Events.trigger(this, 'pause', [this.currentPlayer]);
    }

    /**
     * Called on playback progress.
     * @param {Object} event The time update event.
     * @param {Object} timeUpdateData The time update data.
     */
    onTimeUpdate(event, timeUpdateData) {
        this.playbackCore.onTimeUpdate(event, timeUpdateData);
        Events.trigger(this, 'timeupdate', [event, timeUpdateData]);
    }

    /**
     * Called when player is ready to resume playback.
     */
    onReady() {
        this.playbackCore.onReady();
        Events.trigger(this, 'ready');
    }

    /**
     * Called when player is buffering.
     */
    onBuffering() {
        this.playbackCore.onBuffering();
        Events.trigger(this, 'buffering');
    }

    /**
     * Called when changes are made to the play queue.
     */
    onQueueUpdate() {
        // Do nothing.
    }

    /**
     * Gets player status.
     * @returns {boolean} Whether the player has some media loaded.
     */
    isPlaybackActive() {
        return false;
    }

    /**
     * Gets playback status.
     * @returns {boolean} Whether the playback is unpaused.
     */
    isPlaying() {
        return false;
    }

    /**
     * Gets playback position.
     * @returns {number} The player position, in milliseconds.
     */
    currentTime() {
        return 0;
    }

    /**
     * Checks if player has playback rate support.
     * @returns {boolean} _true _ if playback rate is supported, false otherwise.
     */
    hasPlaybackRate() {
        return false;
    }

    /**
     * Sets the playback rate, if supported.
     * @param {number} value The playback rate.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPlaybackRate(value) {
        // Do nothing.
    }

    /**
     * Gets the playback rate.
     * @returns {number} The playback rate.
     */
    getPlaybackRate() {
        return 1.0;
    }

    /**
     * Sets the playback rate locally.
     * @param {number} value The playback rate.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetPlaybackRate(value) {
        // Override
    }

    /**
     * Checks if player is remotely self-managed.
     * @returns {boolean} _true_ if the player is remotely self-managed, _false_ otherwise.
     */
    isRemote() {
        return false;
    }

    /**
     * Unpauses the player.
     */
    localUnpause() {
        // Override
    }

    /**
     * Pauses the player.
     */
    localPause() {
        // Override
    }

    /**
     * Seeks the player to the specified position.
     * @param {number} positionTicks The new position.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSeek(positionTicks) {
        // Override
    }

    /**
     * Stops the player.
     */
    localStop() {
        // Override
    }

    /**
     * Sends a command to the player.
     * @param {Object} command The command.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSendCommand(command) {
        // Override
    }

    /**
     * Starts playback.
     * @param {Object} options Playback data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localPlay(options) {
        // Override
    }

    /**
     * Sets playing item from playlist.
     * @param {string} playlistItemId The item to play.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetCurrentPlaylistItem(playlistItemId) {
        // Override
    }

    /**
     * Removes items from playlist.
     * @param {Array} playlistItemIds The items to remove.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localRemoveFromPlaylist(playlistItemIds) {
        // Override
    }

    /**
     * Moves an item in the playlist.
     * @param {string} playlistItemId The item to move.
     * @param {number} newIndex The new position.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localMovePlaylistItem(playlistItemId, newIndex) {
        // Override
    }

    /**
     * Queues in the playlist.
     * @param {Object} options Queue data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localQueue(options) {
        // Override
    }

    /**
     * Queues after the playing item in the playlist.
     * @param {Object} options Queue data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localQueueNext(options) {
        // Override
    }

    /**
     * Picks next item in playlist.
     */
    localNextItem() {
        // Override
    }

    /**
     * Picks previous item in playlist.
     */
    localPreviousItem() {
        // Override
    }

    /**
     * Sets repeat mode.
     * @param {string} value The repeat mode.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetRepeatMode(value) {
        // Override
    }

    /**
     * Sets shuffle mode.
     * @param {string} value The shuffle mode.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetQueueShuffleMode(value) {
        // Override
    }

    /**
     * Toggles shuffle mode.
     */
    localToggleQueueShuffleMode() {
        // Override
    }
}

export default GenericPlayer;
