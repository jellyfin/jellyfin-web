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
import { useSyncPlayStore, SyncPlayState } from '../../../store/syncPlayStore';

/**
 * Class that manages the SyncPlay feature.
 */
class Manager {
    playerFactory: any;
    apiClient: any;
    timeSyncCore: TimeSyncCore;
    playbackCore: PlaybackCore;
    queueCore: any;
    controller: Controller;
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

        this.timeSyncCore = new TimeSyncCore();
        this.playbackCore = new PlaybackCore();
        this.queueCore = new (QueueCore as any)();
        this.controller = new Controller();
    }

    /**
     * Initialise SyncPlay.
     * @param {Object} apiClient The ApiClient.
     */
    init(apiClient: any) {
        this.updateApiClient(apiClient);
        this.playerWrapper = this.playerFactory.getDefaultWrapper(this);

        this.timeSyncCore.init(this);
        this.playbackCore.init(this);
        this.queueCore.init(this);
        this.controller.init(this);

        Events.on(this.timeSyncCore, 'time-sync-server-update', (_event: any, _timeOffset: number, ping: number) => {
            if (this.isSyncPlayEnabled()) {
                this.getApiClient().sendSyncPlayPing({ Ping: ping });
            }
        });
    }

    updateApiClient(apiClient: any) {
        if (!apiClient) throw new Error('ApiClient is null!');
        this.apiClient = apiClient;
    }

    getApiClient() {
        return this.apiClient;
    }
    getTimeSyncCore() {
        return this.timeSyncCore;
    }
    getPlaybackCore() {
        return this.playbackCore;
    }
    getQueueCore() {
        return this.queueCore;
    }
    getController() {
        return this.controller;
    }
    getPlayerWrapper() {
        return this.playerWrapper;
    }

    onPlayerChange(newPlayer: any) {
        this.bindToPlayer(newPlayer);
    }

    bindToPlayer(player: any) {
        this.releaseCurrentPlayer();
        if (!player) return;

        this.playerWrapper.unbindFromPlayer();
        this.currentPlayer = player;
        this.playerWrapper = this.playerFactory.getWrapper(player, this);

        if (this.isSyncPlayEnabled()) {
            this.playerWrapper.bindToPlayer();
        }

        Events.trigger(this, 'playerchange', [this.currentPlayer]);
    }

    releaseCurrentPlayer() {
        this.currentPlayer = null;
        if (this.playerWrapper) this.playerWrapper.unbindFromPlayer();

        this.playerWrapper = this.playerFactory.getDefaultWrapper(this);
        if (this.isSyncPlayEnabled()) {
            this.playerWrapper.bindToPlayer();
        }

        Events.trigger(this, 'playerchange', [this.currentPlayer]);
    }

    processGroupUpdate(cmd: any, apiClient: any) {
        switch (cmd.Type) {
            case 'PlayQueue':
                this.queueCore.updatePlayQueue(apiClient, cmd.Data);
                break;
            case 'UserJoined':
                toast(globalize.translate('MessageSyncPlayUserJoined', cmd.Data));
                if (this.groupInfo) {
                    if (!this.groupInfo.Participants) this.groupInfo.Participants = [cmd.Data];
                    else this.groupInfo.Participants.push(cmd.Data);
                    this.updateStoreGroupInfo();
                }
                break;
            case 'UserLeft':
                toast(globalize.translate('MessageSyncPlayUserLeft', cmd.Data));
                if (this.groupInfo && this.groupInfo.Participants) {
                    this.groupInfo.Participants = this.groupInfo.Participants.filter(
                        (user: string) => user !== cmd.Data
                    );
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
                break;
            default:
                break;
        }
    }

    private updateStoreGroupInfo() {
        if (this.groupInfo) {
            useSyncPlayStore.getState().setGroupInfo({
                groupId: this.groupInfo.GroupId,
                groupName: this.groupInfo.GroupName,
                participants: this.groupInfo.Participants || [],
                lastUpdatedAt: new Date(this.groupInfo.LastUpdatedAt).getTime()
            });
        } else {
            useSyncPlayStore.getState().setGroupInfo(null);
        }
    }

    processCommand(cmd: any) {
        if (cmd === null) return;

        if (typeof cmd.When === 'string') {
            cmd.When = new Date(cmd.When);
            cmd.EmittedAt = new Date(cmd.EmittedAt);
            cmd.PositionTicks = cmd.PositionTicks ? parseInt(cmd.PositionTicks, 10) : null;
        }

        if (!this.isSyncPlayEnabled()) return;

        if (this.syncPlayEnabledAt && cmd.EmittedAt.getTime() < this.syncPlayEnabledAt.getTime()) return;

        if (!this.syncPlayReady) {
            this.queuedCommand = cmd;
            return;
        }

        this.lastPlaybackCommand = cmd;
        useSyncPlayStore.getState().processCommand(cmd);

        if (!this.isPlaybackActive()) return;

        const playlistItemId = this.queueCore.getCurrentPlaylistItemId();
        if (cmd.PlaylistItemId !== playlistItemId && cmd.Command !== 'Stop') return;

        this.playbackCore.applyCommand(cmd);
    }

    enableSyncPlay(apiClient: any, groupInfo: any, showMessage = false) {
        if (this.isSyncPlayEnabled()) {
            this.disableSyncPlay(false);
            showMessage = false;
        }

        this.groupInfo = groupInfo;
        this.syncPlayEnabledAt = groupInfo.LastUpdatedAt;

        this.updateStoreGroupInfo();
        useSyncPlayStore.getState().setEnabled(true);

        this.playerWrapper.bindToPlayer();

        Events.trigger(this, 'enabled', [true]);

        Helper.waitForEventOnce(this.timeSyncCore, 'time-sync-server-update').then(() => {
            this.syncPlayReady = true;
            useSyncPlayStore.getState().setReady(true);
            this.processCommand(this.queuedCommand);
            this.queuedCommand = null;
        });

        this.syncPlayReady = false;
        this.followingGroupPlayback = true;
        useSyncPlayStore.getState().setFollowing(true);

        this.timeSyncCore.forceUpdate();

        if (showMessage) toast(globalize.translate('MessageSyncPlayEnabled'));
    }

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
        if (this.playerWrapper) this.playerWrapper.unbindFromPlayer();

        if (showMessage) toast(globalize.translate('MessageSyncPlayDisabled'));
    }

    isSyncPlayEnabled() {
        return this.syncPlayEnabledAt !== null;
    }

    showSyncIcon(syncMethod: SyncPlayState['syncMethod']) {
        this.syncMethod = syncMethod;
        useSyncPlayStore.getState().setSyncMethod(syncMethod);
        Events.trigger(this, 'syncing', [true, this.syncMethod]);
    }

    clearSyncIcon() {
        this.syncMethod = 'None';
        useSyncPlayStore.getState().setSyncMethod('None');
        Events.trigger(this, 'syncing', [false, this.syncMethod]);
    }

    isPlaybackActive() {
        return this.playerWrapper && this.playerWrapper.isPlaybackActive();
    }
    isPlaying() {
        return this.playerWrapper && this.playerWrapper.isPlaying();
    }
    isRemote() {
        return this.playerWrapper && this.playerWrapper.isRemote();
    }
    haltGroupPlayback(apiClient: any) {
        apiClient.requestSyncPlayStop();
    }
    resumeGroupPlayback(apiClient: any) {
        const item = this.queueCore.getPlaylist()[this.queueCore.getCurrentPlaylistIndex()];
        if (item) {
            this.controller.play({ items: [item] });
        }
    }
}

export default Manager;
