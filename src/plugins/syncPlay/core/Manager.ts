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
import Events from '../../../utils/events';
import { logger } from '../../../utils/logger';
import { useSyncPlayStore, SyncPlayGroupInfo, SyncPlayState } from '../../../store/syncPlayStore';

/**
 * Class that manages the SyncPlay feature.
 */
class Manager {
    playerFactory: any;
    apiClient: any;
    timeSyncCore: any;
    playbackCore: any;
    queueCore: any;
    controller: any;
    syncMethod: string = 'None';
    groupInfo: any = null;
    syncPlayEnabledAt: Date | null = null;
    syncPlayReady: boolean = false;
    queuedCommand: any = null;
    followingGroupPlayback: boolean = true;
    lastPlaybackCommand: any = null;
    currentPlayer: any = null;
    playerWrapper: any = null;

    /**
     * Creates an instance of SyncPlay Manager.
     * @param {PlayerFactory} playerFactory The PlayerFactory instance.
     */
    constructor(playerFactory: any) {
        this.playerFactory = playerFactory;
        this.apiClient = null;

        this.timeSyncCore = new (TimeSyncCore as any)();
        this.playbackCore = new (PlaybackCore as any)();
        this.queueCore = new (QueueCore as any)();
        this.controller = new (Controller as any)();
    }

    /**
     * Initialise SyncPlay.
     * @param {Object} apiClient The ApiClient.
     */
    init(apiClient: any) {
        // Set ApiClient.
        this.updateApiClient(apiClient);

        // Get default player wrapper.
        this.playerWrapper = this.playerFactory.getDefaultWrapper(this);

        // Initialize components.
        this.timeSyncCore.init(this);
        this.playbackCore.init(this);
        this.queueCore.init(this);
        this.controller.init(this);

        Events.on(this.timeSyncCore, 'time-sync-server-update', (_event: any, _timeOffset: number, ping: number) => {
            // Report ping back to server.
            if (this.isSyncPlayEnabled()) {
                this.getApiClient().sendSyncPlayPing({
                    Ping: ping
                });
            }
        });
    }

    /**
     * Update active ApiClient.
     * @param {ApiClient|undefined} apiClient The ApiClient.
     */
    updateApiClient(apiClient: any) {
        if (!apiClient) {
            throw new Error('ApiClient is null!');
        }

        this.apiClient = apiClient;
    }

    getApiClient() {
        return this.apiClient;
    }

    /**
     * Called when the player changes.
     */
    onPlayerChange(newPlayer: any) {
        this.bindToPlayer(newPlayer);
    }

    /**
     * Binds to the player's events.
     * @param {Object} player The player.
     */
    bindToPlayer(player: any) {
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
        if (this.playerWrapper) {
            this.playerWrapper.unbindFromPlayer();
        }

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
    processGroupUpdate(cmd: any, apiClient: any) {
        switch (cmd.Type) {
            case 'PlayQueue':
                this.queueCore.updatePlayQueue(apiClient, cmd.Data);
                break;
            case 'UserJoined':
                toast(globalize.translate('MessageSyncPlayUserJoined', cmd.Data));
                if (this.groupInfo) {
                    if (!this.groupInfo.Participants) {
                        this.groupInfo.Participants = [cmd.Data];
                    } else {
                        this.groupInfo.Participants.push(cmd.Data);
                    }
                    this.updateStoreGroupInfo();
                }
                break;
            case 'UserLeft':
                toast(globalize.translate('MessageSyncPlayUserLeft', cmd.Data));
                if (this.groupInfo && this.groupInfo.Participants) {
                    this.groupInfo.Participants = this.groupInfo.Participants.filter((user: string) => user !== cmd.Data);
                    this.updateStoreGroupInfo();
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
                this.updateStoreGroupInfo();
                break;
            case 'StateUpdate':
                useSyncPlayStore.getState().setGroupState(cmd.Data.State);
                Events.trigger(this, 'group-state-update', [cmd.Data.State, cmd.Data.Reason]);
                logger.debug('SyncPlay group state changed', { component: 'SyncPlay', state: cmd.Data.State, reason: cmd.Data.Reason });
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
                logger.error('SyncPlay processGroupUpdate: command not recognised', { component: 'SyncPlay', commandType: cmd.Type });
                break;
        }
    }

    private updateStoreGroupInfo() {
        if (this.groupInfo) {
            useSyncPlayStore.getState().setGroupInfo({
                groupId: this.groupInfo.GroupId,
                groupName: this.groupInfo.GroupName,
                participants: this.groupInfo.Participants || [],
                lastUpdatedAt: this.groupInfo.LastUpdatedAt.getTime()
            });
        } else {
            useSyncPlayStore.getState().setGroupInfo(null);
        }
    }

    /**
     * Handles a playback command from the server.
     * @param {Object|null} cmd The playback command.
     */
    processCommand(cmd: any) {
        if (cmd === null) return;

        if (typeof cmd.When === 'string') {
            cmd.When = new Date(cmd.When);
            cmd.EmittedAt = new Date(cmd.EmittedAt);
            cmd.PositionTicks = cmd.PositionTicks ? parseInt(cmd.PositionTicks, 10) : null;
        }

        if (!this.isSyncPlayEnabled()) {
            logger.debug('SyncPlay processCommand: SyncPlay not enabled, ignoring command', { component: 'SyncPlay', command: cmd });
            return;
        }

        if (this.syncPlayEnabledAt && cmd.EmittedAt.getTime() < this.syncPlayEnabledAt.getTime()) {
            logger.debug('SyncPlay processCommand: ignoring old command', { component: 'SyncPlay', command: cmd });
            return;
        }

        if (!this.syncPlayReady) {
            logger.debug('SyncPlay processCommand: SyncPlay not ready, queued command', { component: 'SyncPlay', command: cmd });
            this.queuedCommand = cmd;
            return;
        }

        this.lastPlaybackCommand = cmd;
        useSyncPlayStore.getState().processCommand(cmd);

        if (!this.isPlaybackActive()) {
            logger.debug('SyncPlay processCommand: no active player', { component: 'SyncPlay' });
            return;
        }

        // Make sure command matches playing item in playlist.
        const playlistItemId = this.queueCore.getCurrentPlaylistItemId();
        if (cmd.PlaylistItemId !== playlistItemId && cmd.Command !== 'Stop') {
            logger.error('SyncPlay processCommand: playlist item does not match', { component: 'SyncPlay', command: cmd });
            return;
        }

        logger.info('SyncPlay processing command', { component: 'SyncPlay', command: cmd.Command, when: cmd.When, delayMs: cmd.When.getTime() - Date.now() });

        this.playbackCore.applyCommand(cmd);
    }

    /**
     * Enables SyncPlay.
     * @param {Object} apiClient The ApiClient.
     * @param {Object} groupInfo The joined group's info.
     * @param {boolean} showMessage Display message.
     */
    enableSyncPlay(apiClient: any, groupInfo: any, showMessage = false) {
        if (this.isSyncPlayEnabled()) {
            if (groupInfo.GroupId === this.groupInfo.GroupId) {
                logger.debug('SyncPlay enableSyncPlay: group already joined', { component: 'SyncPlay', groupId: this.groupInfo.GroupId });
                return;
            } else {
                logger.warn('SyncPlay enableSyncPlay: switching groups', { component: 'SyncPlay', fromGroupId: this.groupInfo.GroupId, toGroupId: groupInfo.GroupId });
                this.disableSyncPlay(false);
            }

            showMessage = false;
        }

        this.groupInfo = groupInfo;
        this.syncPlayEnabledAt = groupInfo.LastUpdatedAt;
        
        this.updateStoreGroupInfo();
        useSyncPlayStore.getState().setEnabled(true);

        this.playerWrapper.bindToPlayer();

        Events.trigger(this, 'enabled', [true]);

        // Wait for time sync to be ready.
        (Helper as any).waitForEventOnce(this.timeSyncCore, 'time-sync-server-update').then(() => {
            this.syncPlayReady = true;
            useSyncPlayStore.getState().setReady(true);
            this.processCommand(this.queuedCommand);
            this.queuedCommand = null;
        });

        this.syncPlayReady = false;
        this.followingGroupPlayback = true;
        useSyncPlayStore.getState().setFollowing(true);

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
        this.groupInfo = null;
        this.syncPlayEnabledAt = null;
        this.syncPlayReady = false;
        this.followingGroupPlayback = true;
        this.lastPlaybackCommand = null;
        this.queuedCommand = null;
        this.playbackCore.syncEnabled = false;
        
        useSyncPlayStore.getState().reset();
        
        Events.trigger(this, 'enabled', [false]);
        if (this.playerWrapper) {
            this.playerWrapper.unbindFromPlayer();
        }

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
     * Emits an event to update the SyncPlay status icon.
     */
    showSyncIcon(syncMethod: SyncPlayState['syncMethod']) {
        this.syncMethod = syncMethod;
        useSyncPlayStore.getState().setSyncMethod(syncMethod);
        Events.trigger(this, 'syncing', [true, this.syncMethod]);
    }

    /**
     * Emits an event to clear the SyncPlay status icon.
     */
    clearSyncIcon() {
        this.syncMethod = 'None';
        useSyncPlayStore.getState().setSyncMethod('None');
        Events.trigger(this, 'syncing', [false, this.syncMethod]);
    }

    isPlaybackActive() {
        return this.playerWrapper && this.playerWrapper.isPlaybackActive();
    }
}

export default Manager;