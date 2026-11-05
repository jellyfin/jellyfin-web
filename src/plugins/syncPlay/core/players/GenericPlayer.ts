/**
 * Module that translates events from a player to SyncPlay events.
 * @module plugins/syncPlay/core/players/GenericPlayer
 */

import type { GroupRepeatMode, GroupShuffleMode } from '@jellyfin/sdk/lib/generated-client';

import type { PlaybackStopInfo, PlayerState } from 'types/playbackStopInfo';
import type { PlayOptions } from 'types/playOptions';
import Events, { type Event } from 'utils/events';

import type Manager from '../Manager';
import type PlaybackCore from '../PlaybackCore';
import type QueueCore from '../QueueCore';

/** The data passed to the player wrapper on playback progress. */
interface TimeUpdateData {
    currentTime: Date;
    currentPosition: number;
}

/** The data passed to the player wrapper to start or queue playback. */
interface PlayOrQueueOptions extends PlayOptions {
    /** The IDs of the items in the play queue */
    ids?: string[];
    /** The ID of the server the items belong to */
    serverId?: string;
}

/**
 * Class that translates events from a player to SyncPlay events.
 */
class GenericPlayer {
    // NOTE: Widened to string so that subclasses can override the type.
    static readonly type: string = 'generic';

    player: unknown;
    manager: Manager;
    playbackCore: PlaybackCore;
    queueCore: QueueCore;
    bound: boolean;
    // FIXME: This is never assigned by the wrapper, so it is always undefined at runtime.
    declare currentPlayer: unknown;
    /** Gets current playback position, in milliseconds. Only defined by players that support it. */
    declare currentTimeAsync?: () => Promise<number>;

    constructor(player: unknown, syncPlayManager: Manager) {
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
    localBindToPlayer(): void {
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
    localUnbindFromPlayer(): void {
        throw new Error('Override this method!');
    }

    /**
     * Called when playback starts.
     */
    onPlaybackStart(player: unknown, state: PlayerState) {
        this.playbackCore.onPlaybackStart(player, state);
        Events.trigger(this, 'playbackstart', [player, state]);
    }

    /**
     * Called when playback stops.
     */
    onPlaybackStop(stopInfo: PlaybackStopInfo) {
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
     * @param event The time update event.
     * @param timeUpdateData The time update data.
     */
    onTimeUpdate(event: Event, timeUpdateData: TimeUpdateData) {
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
     * @returns Whether the player has some media loaded.
     */
    isPlaybackActive() {
        return false;
    }

    /**
     * Gets playback status.
     * @returns Whether the playback is unpaused.
     */
    isPlaying() {
        return false;
    }

    /**
     * Gets playback position.
     * @returns The player position, in milliseconds.
     */
    currentTime() {
        return 0;
    }

    /**
     * Checks if player has playback rate support.
     * @returns _true _ if playback rate is supported, false otherwise.
     */
    hasPlaybackRate() {
        return false;
    }

    /**
     * Sets the playback rate, if supported.
     * @param value The playback rate.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPlaybackRate(value: number) {
        // Do nothing.
    }

    /**
     * Gets the playback rate.
     * @returns The playback rate.
     */
    getPlaybackRate() {
        return 1.0;
    }

    /**
     * Checks if player is remotely self-managed.
     * @returns _true_ if the player is remotely self-managed, _false_ otherwise.
     */
    isRemote() {
        return false;
    }

    /**
     * Unpauses the player.
     */
    localUnpause() {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Pauses the player.
     */
    localPause() {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Seeks the player to the specified position.
     * @param positionTicks The new position.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSeek(positionTicks: number) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Stops the player.
     */
    localStop() {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Sends a command to the player.
     * @param command The command.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSendCommand(command: unknown) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Starts playback.
     * @param options Playback data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localPlay(options: PlayOrQueueOptions) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Sets playing item from playlist.
     * @param playlistItemId The item to play.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetCurrentPlaylistItem(playlistItemId: string) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Removes items from playlist.
     * @param playlistItemIds The items to remove.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localRemoveFromPlaylist(playlistItemIds: string[]) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Moves an item in the playlist.
     * @param playlistItemId The item to move.
     * @param newIndex The new position.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localMovePlaylistItem(playlistItemId: string, newIndex: number) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Queues in the playlist.
     * @param options Queue data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localQueue(options: PlayOrQueueOptions) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Queues after the playing item in the playlist.
     * @param options Queue data.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localQueueNext(options: PlayOrQueueOptions) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Picks next item in playlist.
     */
    localNextItem() {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Picks previous item in playlist.
     */
    localPreviousItem() {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Sets repeat mode.
     * @param value The repeat mode.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetRepeatMode(value: GroupRepeatMode) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Sets shuffle mode.
     * @param value The shuffle mode.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    localSetQueueShuffleMode(value: GroupShuffleMode) {
        // Do nothing by default; override in subclasses.
    }

    /**
     * Toggles shuffle mode.
     */
    localToggleQueueShuffleMode() {
        // Do nothing by default; override in subclasses.
    }
}

export default GenericPlayer;
