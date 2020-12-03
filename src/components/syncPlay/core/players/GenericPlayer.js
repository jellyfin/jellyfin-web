/**
 * Module that translates events from a player to SyncPlay events.
 * @module components/syncPlay/core/players/GenericPlayer
 */

import { Events } from 'jellyfin-apiclient';

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

    }

    /**
     * Pauses the player.
     */
    localPause() {

    }

    /**
     * Seeks the player to the specified position.
     * @param {number} positionTicks The new position.
     */
    localSeek(positionTicks) {

    }

    /**
     * Stops the player.
     */
    localStop() {

    }

    /**
     * Sends a command to the player.
     * @param {Object} command The command.
     */
    localSendCommand(command) {

    }

    /**
     * Starts playback.
     * @param {Object} options Playback data.
     */
    localPlay(options) {

    }

    /**
     * Sets playing item from playlist.
     * @param {string} playlistItemId The item to play.
     */
    localSetCurrentPlaylistItem(playlistItemId) {

    }

    /**
     * Removes items from playlist.
     * @param {Array} playlistItemIds The items to remove.
     */
    localRemoveFromPlaylist(playlistItemIds) {

    }

    /**
     * Moves an item in the playlist.
     * @param {string} playlistItemId The item to move.
     * @param {number} newIndex The new position.
     */
    localMovePlaylistItem(playlistItemId, newIndex) {

    }

    /**
     * Queues in the playlist.
     * @param {Object} options Queue data.
     */
    localQueue(options) {

    }

    /**
     * Queues after the playing item in the playlist.
     * @param {Object} options Queue data.
     */
    localQueueNext(options) {

    }

    /**
     * Picks next item in playlist.
     */
    localNextItem() {

    }

    /**
     * Picks previous item in playlist.
     */
    localPreviousItem() {

    }

    /**
     * Sets repeat mode.
     * @param {string} value The repeat mode.
     */
    localSetRepeatMode(value) {

    }

    /**
     * Sets shuffle mode.
     * @param {string} value The shuffle mode.
     */
    localSetQueueShuffleMode(value) {

    }

    /**
     * Toggles shuffle mode.
     */
    localToggleQueueShuffleMode() {

    }
}

export default GenericPlayer;
