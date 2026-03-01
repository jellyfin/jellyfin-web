/**
 * Module that manages the SyncPlay feature.
 * @module components/syncPlay/core/Manager
 */

import * as Helper from './Helper';
import TimeSyncCore from './timeSync/TimeSyncCore';
import PlaybackCore from './PlaybackCore';
import QueueCore from './QueueCore';
import Controller from './Controller';
import { postSyncPlayV2 } from './V2Api';
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
        this.pendingSnapshot = null; // Snapshot received before SyncPlay is enabled.
        this.pendingResumePlayback = false; // Resume requested before queue became available.
        this.resumePlaybackInFlight = false; // Guard against duplicate local playback starts.
        this.latestJoinedStateRevision = -1; // Latest revision received from /SyncPlay/V2/Joined.
        this.joinedStateRefreshPromise = null; // In-flight joined-state refresh.
        this.joinedStateReconcileTimer = null; // Periodic v2 state reconciliation timer.
        this.joinedStateReconcileMs = 4000; // Reconcile interval for authoritative v2 state.
        this.pendingDisableTimer = null; // Deferred disable timer to absorb transient membership misses.
        this.v2UnavailableNotified = false; // Legacy flag kept for compatibility with older state-reset paths.

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

        Events.on(this, 'playbackstart', () => {
            this.resumePlaybackInFlight = false;
        });
        Events.on(this, 'playbackstop', () => {
            this.resumePlaybackInFlight = false;
        });

        Events.on(this.timeSyncCore, 'time-sync-server-update', (event, timeOffset, ping) => {
            // Report ping back to server.
            if (this.isSyncPlayEnabled() && Number.isFinite(ping)) {
                postSyncPlayV2(this.getApiClient(), 'Ping', {
                    Ping: ping
                }).catch((error) => {
                    console.debug('SyncPlay ping failed', error);
                });
            }
        });
    }

    /**
     * Update active ApiClient.
     * @param {ApiClient|undefined} apiClient The ApiClient.
     */
    updateApiClient(apiClient) {
        if (!apiClient) {
            throw new Error('ApiClient is null!');
        }

        const apiClientChanged = this.apiClient && this.apiClient !== apiClient;
        this.apiClient = apiClient;

        if (apiClientChanged && this.isSyncPlayEnabled()) {
            this.startJoinedStateReconcileLoop(apiClient);
        }
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
                this.logV2Event('legacy_playqueue_update_received_ignored', { reason: cmd.Data?.Reason });
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
                break;
            case 'GroupSnapshot': {
                const snapshot = cmd.Data;
                if (!this.isSyncPlayEnabled()) {
                    this.pendingSnapshot = snapshot;
                    break;
                }

                this.applySnapshot(snapshot, apiClient);
                break;
            }
            case 'UserJoined':

                toast(globalize.translate('MessageSyncPlayUserJoined', cmd.Data));
                if (this.groupInfo) {
                    if (!this.groupInfo.Participants) {
                        this.groupInfo.Participants = [cmd.Data];
                    } else {
                        this.groupInfo.Participants.push(cmd.Data);
                    }
                }
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
                break;
            case 'UserLeft':
                toast(globalize.translate('MessageSyncPlayUserLeft', cmd.Data));
                if (this.groupInfo?.Participants) {
                    this.groupInfo.Participants = this.groupInfo.Participants.filter((user) => user !== cmd.Data);
                }
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
                break;
            case 'GroupJoined':
                cmd.Data.LastUpdatedAt = new Date(cmd.Data.LastUpdatedAt);
                this.enableSyncPlay(apiClient, cmd.Data, true);
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
                break;
            case 'SyncPlayIsDisabled':
                toast(globalize.translate('MessageSyncPlayIsDisabled'));
                break;
            case 'NotInGroup':
                this.rehydrateGroup(apiClient).then((rehydrated) => {
                    if (rehydrated) {
                        this.cancelPendingDisable();
                        return;
                    }

                    this.schedulePendingDisable(apiClient, 'NotInGroup');
                });
                break;
            case 'GroupLeft':
                if (this.groupInfo?.GroupId && cmd.GroupId && this.groupInfo.GroupId !== cmd.GroupId) {
                    this.logV2Event('ignore_stale_groupleft', { currentGroupId: this.groupInfo.GroupId, messageGroupId: cmd.GroupId });
                    break;
                }

                this.rehydrateGroup(apiClient).then((rehydrated) => {
                    if (rehydrated) {
                        this.cancelPendingDisable();
                        return;
                    }

                    this.schedulePendingDisable(apiClient, 'GroupLeft');
                });
                break;
            case 'GroupUpdate':
                this.logV2Event('legacy_groupupdate_received_ignored');
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
                break;
            case 'StateUpdate':
                this.logV2Event('legacy_stateupdate_received_ignored', { state: cmd.Data?.State, reason: cmd.Data?.Reason });
                this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
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
                toast(globalize.translate('MessageSyncPlayLibraryAccessDenied'));
                break;
            default:
                console.error(`SyncPlay processGroupUpdate: command ${cmd.Type} not recognised.`);
                break;
        }
    }

    /**
     * Handles a playback command from the server.
     * @param {Object|null} cmd The playback command.
     */
    processCommand(cmd, apiClient) {
        if (cmd === null) {
            return;
        }

        const command = this.normalizeCommand(cmd);
        this.logV2Event('legacy_command_received_ignored', { command: command.Command });
        this.refreshJoinedGroupStateV2(apiClient || this.getApiClient(), { allowEnable: true });
    }

    /**
     * Applies a playback command from authoritative v2 state.
     * @param {Object|null} cmd The playback command.
     * @param {Object} apiClient The ApiClient.
     * @param {string} source The command source.
     */
    applyPlaybackCommand(cmd, apiClient, source = 'snapshot') {
        if (cmd === null) {
            return;
        }

        cmd = this.normalizeCommand(cmd);

        if (!this.isSyncPlayEnabled()) {
            console.debug(`SyncPlay applyPlaybackCommand (${source}): SyncPlay not enabled, ignoring command.`, cmd);
            return;
        }

        if (cmd.EmittedAt.getTime() < this.syncPlayEnabledAt.getTime()) {
            console.debug(`SyncPlay applyPlaybackCommand (${source}): ignoring old command.`, cmd);
            return;
        }

        if (!this.syncPlayReady) {
            console.debug(`SyncPlay applyPlaybackCommand (${source}): SyncPlay not ready, queued command.`, cmd);
            this.queuedCommand = cmd;
            return;
        }

        this.lastPlaybackCommand = cmd;

        if (!this.isPlaybackActive()) {
            console.debug(`SyncPlay applyPlaybackCommand (${source}): no active player.`);
            return;
        }

        // Make sure command matches playing item in playlist.
        const playlistItemId = this.queueCore.getCurrentPlaylistItemId();
        if (cmd.PlaylistItemId !== playlistItemId && cmd.Command !== 'Stop') {
            console.warn(`SyncPlay applyPlaybackCommand (${source}): playlist item does not match, refreshing authoritative state.`, {
                commandPlaylistItemId: cmd.PlaylistItemId,
                currentPlaylistItemId: playlistItemId
            });
            this.refreshJoinedGroupStateV2(apiClient || this.getApiClient(), { allowEnable: true });
            return;
        }

        console.log(`SyncPlay will ${cmd.Command} at ${cmd.When} (in ${cmd.When.getTime() - Date.now()} ms)${cmd.PositionTicks ? '' : ' from ' + cmd.PositionTicks}.`);

        this.playbackCore.applyCommand(cmd);
    }

    /**
     * Normalizes a command coming from the server.
     * @param {Object} cmd The command.
     * @returns {Object} The normalized command.
     */
    normalizeCommand(cmd) {
        if (cmd && typeof cmd.When === 'string') {
            cmd.When = new Date(cmd.When);
            cmd.EmittedAt = new Date(cmd.EmittedAt);
            cmd.PositionTicks = cmd.PositionTicks ? parseInt(cmd.PositionTicks, 10) : null;
        }

        return cmd;
    }

    /**
     * Writes a scoped SyncPlay v2 debug log event.
     * @param {string} eventName The event name.
     * @param {Object|undefined} details Optional event details.
     */
    logV2Event(eventName, details) {
        if (details !== undefined) {
            console.debug(`[SyncPlayV2] ${eventName}`, details);
            return;
        }

        console.debug(`[SyncPlayV2] ${eventName}`);
    }

    /**
     * Starts periodic reconciliation against authoritative /SyncPlay/V2/Joined state.
     * @param {Object} apiClient The ApiClient.
     */
    startJoinedStateReconcileLoop(apiClient) {
        this.stopJoinedStateReconcileLoop();

        const client = apiClient || this.getApiClient();
        if (!client) {
            return;
        }

        this.joinedStateReconcileTimer = setInterval(() => {
            if (!this.isSyncPlayEnabled()) {
                return;
            }

            this.refreshJoinedGroupStateV2(client, { allowEnable: true }).then((applied) => {
                if (applied) {
                    this.logV2Event('reconcile_applied', { groupId: this.groupInfo?.GroupId, revision: this.latestJoinedStateRevision });
                }
            });
        }, this.joinedStateReconcileMs);
    }

    /**
     * Stops periodic v2 joined-state reconciliation.
     */
    stopJoinedStateReconcileLoop() {
        if (!this.joinedStateReconcileTimer) {
            return;
        }

        clearInterval(this.joinedStateReconcileTimer);
        this.joinedStateReconcileTimer = null;
    }

    /**
     * Cancels an in-flight deferred disable.
     */
    cancelPendingDisable() {
        if (!this.pendingDisableTimer) {
            return;
        }

        clearTimeout(this.pendingDisableTimer);
        this.pendingDisableTimer = null;
    }

    /**
     * Schedules a guarded disable after re-checking authoritative v2 state.
     * @param {Object} apiClient The ApiClient.
     * @param {string} reason The disable reason for logging.
     */
    schedulePendingDisable(apiClient, reason) {
        this.cancelPendingDisable();
        this.pendingDisableTimer = setTimeout(() => {
            this.pendingDisableTimer = null;
            this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true }).then((rehydrated) => {
                if (rehydrated || !this.isSyncPlayEnabled()) {
                    return;
                }

                this.logV2Event('disable_after_membership_miss', { reason });
                this.disableSyncPlay(true);
            });
        }, 1200);
    }

    /**
     * Extracts the HTTP status code from API client errors.
     * @param {Object} error The error.
     * @returns {number|null} HTTP status code.
     */
    getHttpStatus(error) {
        return error?.statusCode
            ?? error?.status
            ?? error?.response?.status
            ?? error?.xhr?.status
            ?? null;
    }

    /**
     * Fetches authoritative joined group state from the v2 endpoint.
     * @param {Object} apiClient The ApiClient.
     * @returns {Promise<Object|null>} The joined state, or null when user is not in a group.
     */
    async fetchJoinedGroupStateV2(apiClient) {
        const client = apiClient || this.getApiClient();
        if (!client) {
            return null;
        }

        try {
            const url = client.getUrl('SyncPlay/V2/Joined', { _: Date.now() });
            const state = await client.getJSON(url);
            return state || null;
        } catch (error) {
            const status = this.getHttpStatus(error);
            if (status === 404) {
                // 404 from /SyncPlay/V2/Joined means the current session is not in a group.
                this.logV2Event('joined_state_not_found');
                return null;
            }

            throw error;
        }
    }

    /**
     * Applies authoritative joined group state from the v2 endpoint.
     * @param {Object} apiClient The ApiClient.
     * @param {Object|null} joinedState The joined-state payload.
     * @param {Object} options Apply options.
     * @returns {boolean} True when state was applied.
     */
    applyJoinedGroupStateV2(apiClient, joinedState, options = {}) {
        const { allowEnable = true } = options;
        const snapshot = joinedState?.Snapshot;
        if (!snapshot?.GroupInfo || !snapshot?.PlayQueue) {
            return false;
        }

        const incomingRevision = Number(joinedState.Revision);
        const hasIncomingRevision = Number.isFinite(incomingRevision);
        if (hasIncomingRevision && this.latestJoinedStateRevision >= 0 && incomingRevision < this.latestJoinedStateRevision) {
            this.logV2Event('ignore_stale_joined_state', {
                incomingRevision,
                currentRevision: this.latestJoinedStateRevision,
                groupId: joinedState?.GroupId
            });
            return false;
        }

        if (hasIncomingRevision && this.latestJoinedStateRevision >= 0 && incomingRevision === this.latestJoinedStateRevision) {
            this.logV2Event('ignore_duplicate_joined_state', {
                revision: incomingRevision,
                groupId: joinedState?.GroupId
            });
            this.cancelPendingDisable();
            return true;
        }

        const groupInfo = snapshot.GroupInfo;
        groupInfo.LastUpdatedAt = new Date(groupInfo.LastUpdatedAt || joinedState.ServerUtcNow || Date.now());

        if (allowEnable) {
            const currentGroupId = this.groupInfo?.GroupId;
            if (!this.isSyncPlayEnabled() || currentGroupId !== groupInfo.GroupId) {
                this.enableSyncPlay(apiClient, groupInfo, false);
            }
        }

        if (hasIncomingRevision) {
            this.latestJoinedStateRevision = incomingRevision;
        }

        if (this.groupInfo?.GroupId !== groupInfo.GroupId) {
            return false;
        }

        this.cancelPendingDisable();
        this.applySnapshot(snapshot, apiClient);
        this.logV2Event('joined_state_applied', { groupId: groupInfo.GroupId, revision: this.latestJoinedStateRevision });
        return true;
    }

    /**
     * Refreshes joined group state from the server and applies it locally.
     * @param {Object} apiClient The ApiClient.
     * @param {Object} options Refresh options.
     * @returns {Promise<boolean>} True when joined state was applied.
     */
    refreshJoinedGroupStateV2(apiClient, options = {}) {
        const { allowEnable = true } = options;
        const client = apiClient || this.getApiClient();
        if (!client) {
            return Promise.resolve(false);
        }

        if (this.joinedStateRefreshPromise) {
            return this.joinedStateRefreshPromise;
        }

        this.joinedStateRefreshPromise = this.fetchJoinedGroupStateV2(client).then((joinedState) => {
            if (!joinedState) {
                return false;
            }

            return this.applyJoinedGroupStateV2(client, joinedState, { allowEnable });
        }).catch((error) => {
            console.debug('SyncPlay refreshJoinedGroupStateV2: failed', error);
            return false;
        }).finally(() => {
            this.joinedStateRefreshPromise = null;
        });

        return this.joinedStateRefreshPromise;
    }

    /**
     * Applies an authoritative v2 group snapshot.
     * @param {Object} snapshot The snapshot data.
     * @param {Object} apiClient The ApiClient.
     */
    applySnapshot(snapshot, apiClient) {
        const snapshotRevision = Number(snapshot?.Revision);
        const hasSnapshotRevision = Number.isFinite(snapshotRevision);
        if (hasSnapshotRevision && this.latestJoinedStateRevision >= 0 && snapshotRevision < this.latestJoinedStateRevision) {
            this.logV2Event('ignore_stale_snapshot', {
                incomingRevision: snapshotRevision,
                currentRevision: this.latestJoinedStateRevision
            });
            return;
        }

        if (hasSnapshotRevision && this.latestJoinedStateRevision >= 0 && snapshotRevision === this.latestJoinedStateRevision) {
            this.cancelPendingDisable();
            this.logV2Event('ignore_duplicate_snapshot', { revision: snapshotRevision });
            return;
        }

        if (hasSnapshotRevision) {
            this.latestJoinedStateRevision = snapshotRevision;
        }

        this.cancelPendingDisable();
        snapshot.GroupInfo.LastUpdatedAt = new Date(snapshot.GroupInfo.LastUpdatedAt);
        const previousState = this.groupInfo?.State;
        this.groupInfo = snapshot.GroupInfo;
        if (previousState !== undefined && previousState !== this.groupInfo.State) {
            Events.trigger(this, 'group-state-update', [this.groupInfo.State, 'Snapshot']);
        }

        // Keep queue updates side-effect free and let command snapshots drive playback actions.
        const updatePromise = this.queueCore.updatePlayQueue(apiClient, snapshot.PlayQueue, { suppressActions: true });
        Promise.resolve(updatePromise).then(() => {
            this.attemptPendingResumePlayback(apiClient);

            if (!this.isIdleState(snapshot.GroupInfo.State)
                && this.isFollowingGroupPlayback()
                && !this.isPlaybackActive()) {
                this.resumeGroupPlayback(apiClient);
            }

            if (snapshot.PlayingCommand) {
                this.applyPlaybackCommand(snapshot.PlayingCommand, apiClient, 'snapshot');
            }
        }).catch((error) => {
            console.debug('SyncPlay applySnapshot: failed to process snapshot queue update', error);
        });
    }

    /**
     * Handles a group state change.
     * @param {Object|null} update The group state update.
     */
    processStateChange(update) {
        if (update === null || update.State === null || update.Reason === null) return;

        if (!this.isSyncPlayEnabled()) {
            console.debug('SyncPlay processStateChange: SyncPlay not enabled, ignoring group state update.', update);
            return;
        }

        Events.trigger(this, 'group-state-change', [update.State, update.Reason]);
    }

    /**
     * Notifies server that this client is following group's playback.
     * @param {Object} apiClient The ApiClient.
     * @returns {Promise} A Promise fulfilled upon request completion.
     */
    followGroupPlayback(apiClient) {
        this.followingGroupPlayback = true;

        return postSyncPlayV2(apiClient, 'SetIgnoreWait', {
            IgnoreWait: false
        });
    }

    /**
     * Starts this client's playback and loads the group's play queue.
     * @param {Object} apiClient The ApiClient.
     */
    resumeGroupPlayback(apiClient) {
        if (this.resumePlaybackInFlight) {
            return;
        }

        const ensureFollowingPlayback = this.isFollowingGroupPlayback() ?
            Promise.resolve() :
            this.followGroupPlayback(apiClient);

        ensureFollowingPlayback.then(() => {
            if (this.queueCore.isPlaylistEmpty()) {
                this.pendingResumePlayback = true;
                return;
            }

            this.pendingResumePlayback = false;
            this.resumePlaybackInFlight = true;
            Promise.resolve(this.queueCore.startPlayback(apiClient)).catch(() => {
                this.resumePlaybackInFlight = false;
            });
        }).catch((error) => {
            console.debug('SyncPlay resumeGroupPlayback: failed to enter follow mode.', error);
        });
    }

    /**
     * Stops this client's playback and notifies server to be ignored in group wait.
     * @param {Object} apiClient The ApiClient.
     */
    haltGroupPlayback(apiClient) {
        this.followingGroupPlayback = false;
        this.pendingResumePlayback = false;
        this.resumePlaybackInFlight = false;

        postSyncPlayV2(apiClient, 'SetIgnoreWait', {
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
        this.cancelPendingDisable();

        if (this.isSyncPlayEnabled()) {
            if (groupInfo.GroupId === this.groupInfo.GroupId) {
                console.debug(`SyncPlay enableSyncPlay: group ${this.groupInfo.GroupId} already joined, refreshing state.`);
                this.groupInfo = groupInfo;
                this.syncPlayEnabledAt = groupInfo.LastUpdatedAt;

                if (this.pendingSnapshot && this.pendingSnapshot.GroupInfo?.GroupId === groupInfo.GroupId) {
                    this.applySnapshot(this.pendingSnapshot, apiClient);
                    this.pendingSnapshot = null;
                } else if (!this.isIdleState(groupInfo.State) && this.isFollowingGroupPlayback() && !this.isPlaybackActive()) {
                    // Allow same-group refreshes to re-trigger playback after UI-initiated joins.
                    this.resumeGroupPlayback(apiClient);
                }
                return;
            } else {
                console.warn(`SyncPlay enableSyncPlay: switching from group ${this.groupInfo.GroupId} to group ${groupInfo.GroupId}.`);
                this.disableSyncPlay(false);
            }

            showMessage = false;
        }

        this.queueCore.reset();
        this.groupInfo = groupInfo;
        this.pendingResumePlayback = false;
        this.resumePlaybackInFlight = false;
        this.latestJoinedStateRevision = -1;
        this.v2UnavailableNotified = false;

        this.syncPlayEnabledAt = groupInfo.LastUpdatedAt;
        this.playerWrapper.bindToPlayer();
        this.startJoinedStateReconcileLoop(apiClient);

        Events.trigger(this, 'enabled', [true]);

        // Wait for time sync to be ready.
        Helper.waitForEventOnce(this.timeSyncCore, 'time-sync-server-update').then(() => {
            this.syncPlayReady = true;
            this.applyPlaybackCommand(this.queuedCommand, apiClient, 'queued');
            this.queuedCommand = null;
        });

        this.syncPlayReady = false;
        this.followingGroupPlayback = true;

        this.timeSyncCore.forceUpdate();

        if (showMessage) {
            toast(globalize.translate('MessageSyncPlayEnabled'));
        }

        if (this.pendingSnapshot && this.pendingSnapshot.GroupInfo?.GroupId === groupInfo.GroupId) {
            this.applySnapshot(this.pendingSnapshot, apiClient);
            this.pendingSnapshot = null;
        } else if (!this.isIdleState(groupInfo.State)) {
            this.resumeGroupPlayback(apiClient);
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
        this.pendingResumePlayback = false;
        this.groupInfo = null;
        this.latestJoinedStateRevision = -1;
        this.joinedStateRefreshPromise = null;
        this.cancelPendingDisable();
        this.stopJoinedStateReconcileLoop();
        this.queueCore.reset();
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
     * Starts playback when queue becomes available after a deferred resume request.
     * @param {Object} apiClient The ApiClient.
     */
    attemptPendingResumePlayback(apiClient) {
        if (!this.pendingResumePlayback) {
            return;
        }

        if (this.queueCore.isPlaylistEmpty()) {
            return;
        }

        this.pendingResumePlayback = false;
        this.queueCore.startPlayback(apiClient);
    }

    /**
     * Attempts to rehydrate SyncPlay state from the server when membership is unclear.
     * @param {Object} apiClient The ApiClient.
     * @returns {Promise<boolean>} True if SyncPlay was re-enabled.
     */
    async rehydrateGroup(apiClient) {
        try {
            if (!apiClient) {
                return false;
            }

            return await this.refreshJoinedGroupStateV2(apiClient, { allowEnable: true });
        } catch (error) {
            console.debug('SyncPlay rehydrateGroup: failed', error);
            return false;
        }
    }

    /**
     * Checks if a group state represents an idle group.
     * @param {string|number|null|undefined} state The state value.
     * @returns {boolean} _true_ if group is idle, _false_ otherwise.
     */
    isIdleState(state) {
        return state === 'Idle' || state === 0 || state === '0' || state == null;
    }

    /**
     * Checks if a group state represents waiting-for-ready state.
     * @param {string|number|null|undefined} state The state value.
     * @returns {boolean} _true_ if group is waiting, _false_ otherwise.
     */
    isWaitingState(state) {
        return state === 'Waiting' || state === 1 || state === '1';
    }

    /**
     * Whether the current SyncPlay group is waiting for participants to be ready.
     * @returns {boolean} _true_ if current group state is waiting.
     */
    isGroupWaiting() {
        return this.isWaitingState(this.groupInfo?.State);
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
