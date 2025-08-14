/**
 * Module that manages the SyncPlay feature.
 * @module components/syncPlay/core/Manager
 */

import * as Helper from './Helper';
import TimeSyncCore from './timeSync/TimeSyncCore';
import PlaybackCore from './PlaybackCore';
import QueueCore from './QueueCore';
import Controller from './Controller';
import toast from '../../../components/toast/toast';
import globalize from '../../../lib/globalize';
import Events from '../../../utils/events.ts';

/**
 * Class that manages the SyncPlay feature.
 */
class Manager {
    /**
     * Creates an instance of SyncPlay Manager.
     * @param {PlayerFactory} playerFactory The PlayerFactory instance.
     */
    constructor(playerFactory) {
        this.playerFactory = playerFactory;
        this.apiClient = null;

        this.timeSyncCore = new TimeSyncCore();
        this.playbackCore = new PlaybackCore();
        this.queueCore = new QueueCore();
        this.controller = new Controller();

        this.syncMethod = 'None'; // Used for stats.

        this.groupInfo = null;
        this.syncPlayEnabledAt = null; // Server time of when SyncPlay has been enabled.
        this.syncPlayReady = false; // SyncPlay is ready after first ping to server.
        this.queuedCommand = null; // Queued playback command, applied when SyncPlay is ready.
        this.followingGroupPlayback = true; // Follow or ignore group playback.
        this.lastPlaybackCommand = null; // Last received playback command from server, tracks state of group.

        this.currentPlayer = null;
        this.playerWrapper = null;
    }

    /**
     * Initialise SyncPlay.
     * @param {Object} apiClient The ApiClient.
     */
    init(apiClient) {
        // Set ApiClient.
        this.updateApiClient(apiClient);

        // Get default player wrapper.
        this.playerWrapper = this.playerFactory.getDefaultWrapper(this);

        // Initialize components.
        this.timeSyncCore.init(this);
        this.playbackCore.init(this);
        this.queueCore.init(this);
        this.controller.init(this);

        Events.on(
            this.timeSyncCore,
            'time-sync-server-update',
            (event, timeOffset, ping) => {
                // Report ping back to server.
                if (this.syncEnabled) {
                    this.getApiClient().sendSyncPlayPing({
                        Ping: ping
                    });
                }
            }
        );
    }

    /**
     * Update active ApiClient.
     * @param {ApiClient|undefined} apiClient The ApiClient.
     */
    updateApiClient(apiClient) {
        if (!apiClient) {
            throw new Error('ApiClient is null!');
        }

        this.apiClient = apiClient;
    }

    /**
     * Gets the time sync core.
     * @returns {TimeSyncCore} The time sync core.
     */
    getTimeSyncCore() {
        return this.timeSyncCore;
    }

    /**
     * Gets the playback core.
     * @returns {PlaybackCore} The playback core.
     */
    getPlaybackCore() {
        return this.playbackCore;
    }

    /**
     * Gets the queue core.
     * @returns {QueueCore} The queue core.
     */
    getQueueCore() {
        return this.queueCore;
    }

    /**
     * Gets the controller used to manage SyncPlay playback.
     * @returns {Controller} The controller.
     */
    getController() {
        return this.controller;
    }

    /**
     * Gets the player wrapper used to control local playback.
     * @returns {SyncPlayGenericPlayer} The player wrapper.
     */
    getPlayerWrapper() {
        return this.playerWrapper;
    }

    /**
     * Gets the ApiClient used to communicate with the server.
     * @returns {Object} The ApiClient.
     */
    getApiClient() {
        return this.apiClient;
    }

    /**
     * Gets the last playback command, if any.
     * @returns {Object} The playback command.
     */
    getLastPlaybackCommand() {
        return this.lastPlaybackCommand;
    }

    /**
     * Called when the player changes.
     */
    onPlayerChange(newPlayer) {
        this.bindToPlayer(newPlayer);
    }

    /**
     * Binds to the player's events.
     * @param {Object} player The player.
     */
    bindToPlayer(player) {
        this.releaseCurrentPlayer();

        if (!player) {
            return;
        }

        this.playerWrapper.unbindFromPlayer();

        this.currentPlayer = player;
        this.playerWrapper = this.playerFactory.getWrapper(player, this);

        if (this.isSyncPlayEnabled()) {
            this.playerWrapper.bindToPlayer();
        }

        Events.trigger(this, 'playerchange', [this.currentPlayer]);
    }

    /**
     * Removes the bindings from the current player's events.
     */
    releaseCurrentPlayer() {
        this.currentPlayer = null;
        this.playerWrapper.unbindFromPlayer();

        this.playerWrapper = this.playerFactory.getDefaultWrapper(this);
        if (this.isSyncPlayEnabled()) {
            this.playerWrapper.bindToPlayer();
        }

        Events.trigger(this, 'playerchange', [this.currentPlayer]);
    }

    /**
     * Handles a group update from the server.
     * @param {Object} cmd The group update.
     * @param {Object} apiClient The ApiClient.
     */
    processGroupUpdate(cmd, apiClient) {
        switch (cmd.Type) {
            case 'PlayQueue':
                this.queueCore.updatePlayQueue(apiClient, cmd.Data);
                break;
            case 'UserJoined':
                toast(
                    globalize.translate('MessageSyncPlayUserJoined', cmd.Data)
                );
                if (!this.groupInfo.Participants) {
                    this.groupInfo.Participants = [cmd.Data];
                } else {
                    this.groupInfo.Participants.push(cmd.Data);
                }
                break;
            case 'UserLeft':
                toast(globalize.translate('MessageSyncPlayUserLeft', cmd.Data));
                if (this.groupInfo.Participants) {
                    this.groupInfo.Participants =
                        this.groupInfo.Participants.filter(
                            (user) => user !== cmd.Data
                        );
                }
                break;
            case 'GroupJoined':
                cmd.Data.LastUpdatedAt = new Date(cmd.Data.LastUpdatedAt);
                this.enableSyncPlay(apiClient, cmd.Data, true);
                break;
            case 'SyncPlayIsDisabled':
                toast(globalize.translate('MessageSyncPlayIsDisabled'));
                break;
            case 'NotInGroup':
            case 'GroupLeft':
                this.disableSyncPlay(true);
                break;
            case 'GroupUpdate':
                cmd.Data.LastUpdatedAt = new Date(cmd.Data.LastUpdatedAt);
                this.groupInfo = cmd.Data;
                break;
            case 'StateUpdate':
                Events.trigger(this, 'group-state-update', [
                    cmd.Data.State,
                    cmd.Data.Reason
                ]);
                console.debug(
                    `SyncPlay processGroupUpdate: state changed to ${cmd.Data.State} because ${cmd.Data.Reason}.`
                );
                break;
            case 'GroupDoesNotExist':
                toast(globalize.translate('MessageSyncPlayGroupDoesNotExist'));
                break;
            case 'CreateGroupDenied':
                toast(globalize.translate('MessageSyncPlayCreateGroupDenied'));
                break;
            case 'JoinGroupDenied':
                toast(globalize.translate('MessageSyncPlayJoinGroupDenied'));
                break;
            case 'LibraryAccessDenied':
                toast(
                    globalize.translate('MessageSyncPlayLibraryAccessDenied')
                );
                break;
            default:
                console.error(
                    `SyncPlay processGroupUpdate: command ${cmd.Type} not recognised.`
                );
                break;
        }
    }

    /**
     * Handles a playback command from the server.
     * @param {Object|null} cmd The playback command.
     */
    processCommand(cmd) {
        if (cmd === null) return;

        if (typeof cmd.When === 'string') {
            cmd.When = new Date(cmd.When);
            cmd.EmittedAt = new Date(cmd.EmittedAt);
            cmd.PositionTicks = cmd.PositionTicks
                ? parseInt(cmd.PositionTicks, 10)
                : null;
        }

        if (!this.isSyncPlayEnabled()) {
            console.debug(
                'SyncPlay processCommand: SyncPlay not enabled, ignoring command.',
                cmd
            );
            return;
        }

        if (cmd.EmittedAt.getTime() < this.syncPlayEnabledAt.getTime()) {
            console.debug(
                'SyncPlay processCommand: ignoring old command.',
                cmd
            );
            return;
        }

        if (!this.syncPlayReady) {
            console.debug(
                'SyncPlay processCommand: SyncPlay not ready, queued command.',
                cmd
            );
            this.queuedCommand = cmd;
            return;
        }

        this.lastPlaybackCommand = cmd;

        if (!this.isPlaybackActive()) {
            console.debug('SyncPlay processCommand: no active player!');
            return;
        }

        // Make sure command matches playing item in playlist.
        const playlistItemId = this.queueCore.getCurrentPlaylistItemId();
        if (cmd.PlaylistItemId !== playlistItemId && cmd.Command !== 'Stop') {
            console.error(
                'SyncPlay processCommand: playlist item does not match!',
                cmd
            );
            return;
        }

        console.log(
            `SyncPlay will ${cmd.Command} at ${cmd.When} (in ${cmd.When.getTime() - Date.now()} ms)${cmd.PositionTicks ? '' : ' from ' + cmd.PositionTicks}.`
        );

        this.playbackCore.applyCommand(cmd);
    }

    /**
     * Handles a group state change.
     * @param {Object|null} update The group state update.
     */
    processStateChange(update) {
        if (update === null || update.State === null || update.Reason === null)
            return;

        if (!this.isSyncPlayEnabled()) {
            console.debug(
                'SyncPlay processStateChange: SyncPlay not enabled, ignoring group state update.',
                update
            );
            return;
        }

        Events.trigger(this, 'group-state-change', [
            update.State,
            update.Reason
        ]);
    }

    /**
     * Notifies server that this client is following group's playback.
     * @param {Object} apiClient The ApiClient.
     * @returns {Promise} A Promise fulfilled upon request completion.
     */
    followGroupPlayback(apiClient) {
        this.followingGroupPlayback = true;

        return apiClient.requestSyncPlaySetIgnoreWait({
            IgnoreWait: false
        });
    }

    /**
     * Starts this client's playback and loads the group's play queue.
     * @param {Object} apiClient The ApiClient.
     */
    resumeGroupPlayback(apiClient) {
        this.followGroupPlayback(apiClient).then(() => {
            this.queueCore.startPlayback(apiClient);
        });
    }

    /**
     * Stops this client's playback and notifies server to be ignored in group wait.
     * @param {Object} apiClient The ApiClient.
     */
    haltGroupPlayback(apiClient) {
        this.followingGroupPlayback = false;

        apiClient.requestSyncPlaySetIgnoreWait({
            IgnoreWait: true
        });
        this.playbackCore.localStop();
    }

    /**
     * Whether this client is following group playback.
     * @returns {boolean} _true_ if client should play group's content, _false_ otherwise.
     */
    isFollowingGroupPlayback() {
        return this.followingGroupPlayback;
    }

    /**
     * Enables SyncPlay.
     * @param {Object} apiClient The ApiClient.
     * @param {Object} groupInfo The joined group's info.
     * @param {boolean} showMessage Display message.
     */
    enableSyncPlay(apiClient, groupInfo, showMessage = false) {
        if (this.isSyncPlayEnabled()) {
            if (groupInfo.GroupId === this.groupInfo.GroupId) {
                console.debug(
                    `SyncPlay enableSyncPlay: group ${this.groupInfo.GroupId} already joined.`
                );
                return;
            } else {
                console.warn(
                    `SyncPlay enableSyncPlay: switching from group ${this.groupInfo.GroupId} to group ${groupInfo.GroupId}.`
                );
                this.disableSyncPlay(false);
            }

            showMessage = false;
        }

        this.groupInfo = groupInfo;

        this.syncPlayEnabledAt = groupInfo.LastUpdatedAt;
        this.playerWrapper.bindToPlayer();

        Events.trigger(this, 'enabled', [true]);

        // Wait for time sync to be ready.
        Helper.waitForEventOnce(
            this.timeSyncCore,
            'time-sync-server-update'
        ).then(() => {
            this.syncPlayReady = true;
            this.processCommand(this.queuedCommand, apiClient);
            this.queuedCommand = null;
        });

        this.syncPlayReady = false;
        this.followingGroupPlayback = true;

        this.timeSyncCore.forceUpdate();

        if (showMessage) {
            toast(globalize.translate('MessageSyncPlayEnabled'));
        }
    }

    /**
     * Disables SyncPlay.
     * @param {boolean} showMessage Display message.
     */
    disableSyncPlay(showMessage = false) {
        this.syncPlayEnabledAt = null;
        this.syncPlayReady = false;
        this.followingGroupPlayback = true;
        this.lastPlaybackCommand = null;
        this.queuedCommand = null;
        this.playbackCore.syncEnabled = false;
        Events.trigger(this, 'enabled', [false]);
        this.playerWrapper.unbindFromPlayer();

        if (showMessage) {
            toast(globalize.translate('MessageSyncPlayDisabled'));
        }
    }

    /**
     * Gets SyncPlay status.
     * @returns {boolean} _true_ if user joined a group, _false_ otherwise.
     */
    isSyncPlayEnabled() {
        return this.syncPlayEnabledAt !== null;
    }

    /**
     * Gets the group information.
     * @returns {Object} The group information, null if SyncPlay is disabled.
     */
    getGroupInfo() {
        return this.groupInfo;
    }

    /**
     * Gets SyncPlay stats.
     * @returns {Object} The SyncPlay stats.
     */
    getStats() {
        return {
            TimeSyncDevice: this.timeSyncCore.getActiveDeviceName(),
            TimeSyncOffset: this.timeSyncCore.getTimeOffset().toFixed(2),
            PlaybackDiff: this.playbackCore.playbackDiffMillis.toFixed(2),
            SyncMethod: this.syncMethod
        };
    }

    /**
     * Gets playback status.
     * @returns {boolean} Whether a player is active.
     */
    isPlaybackActive() {
        return this.playerWrapper.isPlaybackActive();
    }

    /**
     * Whether the player is remotely self-managed.
     * @returns {boolean} _true_ if the player is remotely self-managed, _false_ otherwise.
     */
    isRemote() {
        return this.playerWrapper.isRemote();
    }

    /**
     * Checks if playlist is empty.
     * @returns {boolean} _true_ if playlist is empty, _false_ otherwise.
     */
    isPlaylistEmpty() {
        return this.queueCore.isPlaylistEmpty();
    }

    /**
     * Checks if playback is unpaused.
     * @returns {boolean} _true_ if media is playing, _false_ otherwise.
     */
    isPlaying() {
        if (!this.lastPlaybackCommand) {
            return false;
        } else {
            return this.lastPlaybackCommand.Command === 'Unpause';
        }
    }

    /**
     * Emits an event to update the SyncPlay status icon.
     */
    showSyncIcon(syncMethod) {
        this.syncMethod = syncMethod;
        Events.trigger(this, 'syncing', [true, this.syncMethod]);
    }

    /**
     * Emits an event to clear the SyncPlay status icon.
     */
    clearSyncIcon() {
        this.syncMethod = 'None';
        Events.trigger(this, 'syncing', [false, this.syncMethod]);
    }
}

export default Manager;
