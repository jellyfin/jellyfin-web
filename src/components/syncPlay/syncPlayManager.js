/**
 * Module that manages the SyncPlay feature.
 * @module components/syncPlay/syncPlayManager
 */

import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
import timeSyncManager from 'timeSyncManager';
import toast from 'toast';
import globalize from 'globalize';

/**
 * Waits for an event to be triggered on an object. An optional timeout can specified after which the promise is rejected.
 * @param {Object} emitter Object on which to listen for events.
 * @param {string} eventType Event name to listen for.
 * @param {number} timeout Time in milliseconds before rejecting promise if event does not trigger.
 * @returns {Promise} A promise that resolves when the event is triggered.
 */
function waitForEventOnce(emitter, eventType, timeout) {
    return new Promise((resolve, reject) => {
        let rejectTimeout;
        if (timeout) {
            rejectTimeout = setTimeout(() => {
                reject('Timed out.');
            }, timeout);
        }
        const callback = () => {
            events.off(emitter, eventType, callback);
            if (rejectTimeout) {
                clearTimeout(rejectTimeout);
            }
            resolve(arguments);
        };
        events.on(emitter, eventType, callback);
    });
}

/**
 * Gets active player id.
 * @returns {string} The player's id.
 */
function getActivePlayerId() {
    var info = playbackManager.getPlayerInfo();
    return info ? info.id : null;
}

/**
 * Playback synchronization
 */
const MaxAcceptedDelaySpeedToSync = 50; // milliseconds, delay after which SpeedToSync is enabled
const MaxAcceptedDelaySkipToSync = 300; // milliseconds, delay after which SkipToSync is enabled
const SyncMethodThreshold = 2000; // milliseconds, switches between SpeedToSync or SkipToSync
const SpeedToSyncTime = 1000; // milliseconds, duration in which the playback is sped up
const MaxAttemptsSpeedToSync = 3; // attempts before disabling SpeedToSync
const MaxAttemptsSync = 5; // attempts before disabling syncing at all

/**
 * Other constants
 */
const WaitForEventDefaultTimeout = 30000; // milliseconds
const WaitForPlayerEventTimeout = 500; // milliseconds

/**
 * Class that manages the SyncPlay feature.
 */
class SyncPlayManager {
    constructor() {
        this.playbackRateSupported = false;
        this.syncEnabled = false;
        this.playbackDiffMillis = 0; // used for stats
        this.syncMethod = 'None'; // used for stats
        this.syncAttempts = 0;
        this.lastSyncTime = new Date();
        this.syncWatcherTimeout = null; // interval that watches playback time and syncs it

        this.lastPlaybackWaiting = null; // used to determine if player's buffering
        this.minBufferingThresholdMillis = 1000;

        this.currentPlayer = null;
        this.localPlayerPlaybackRate = 1.0; // used to restore user PlaybackRate

        this.syncPlayEnabledAt = null; // Server time of when SyncPlay has been enabled
        this.syncPlayReady = false; // SyncPlay is ready after first ping to server

        this.lastCommand = null;
        this.queuedCommand = null;

        this.scheduledCommand = null;
        this.syncTimeout = null;

        this.timeOffsetWithServer = 0; // server time minus local time
        this.roundTripDuration = 0;
        this.notifySyncPlayReady = false;

        events.on(playbackManager, 'playbackstart', (player, state) => {
            this.onPlaybackStart(player, state);
        });

        events.on(playbackManager, 'playbackstop', (stopInfo) => {
            this.onPlaybackStop(stopInfo);
        });

        events.on(playbackManager, 'playerchange', () => {
            this.onPlayerChange();
        });

        this.bindToPlayer(playbackManager.getCurrentPlayer());

        events.on(this, 'timeupdate', (event) => {
            this.syncPlaybackTime();
        });

        events.on(timeSyncManager, 'update', (event, error, timeOffset, ping) => {
            if (error) {
                console.debug('SyncPlay, time update issue', error);
                return;
            }

            this.timeOffsetWithServer = timeOffset;
            this.roundTripDuration = ping * 2;

            if (this.notifySyncPlayReady) {
                this.syncPlayReady = true;
                events.trigger(this, 'ready');
                this.notifySyncPlayReady = false;
            }

            // Report ping
            if (this.syncEnabled) {
                const apiClient = connectionManager.currentApiClient();
                const sessionId = getActivePlayerId();

                if (!sessionId) {
                    this.signalError();
                    toast({
                        text: globalize.translate('MessageSyncPlayErrorMissingSession')
                    });
                    return;
                }

                apiClient.sendSyncPlayPing({
                    Ping: ping
                });
            }
        });
    }

    /**
     * Called when playback starts.
     */
    onPlaybackStart (player, state) {
        events.trigger(this, 'playbackstart', [player, state]);
    }

    /**
     * Called when playback stops.
     */
    onPlaybackStop (stopInfo) {
        events.trigger(this, 'playbackstop', [stopInfo]);
        if (this.isSyncPlayEnabled()) {
            this.disableSyncPlay(false);
        }
    }

    /**
     * Called when the player changes.
     */
    onPlayerChange () {
        this.bindToPlayer(playbackManager.getCurrentPlayer());
        events.trigger(this, 'playerchange', [this.currentPlayer]);
    }

    /**
     * Called when playback unpauses.
     */
    onPlayerUnpause () {
        events.trigger(this, 'unpause', [this.currentPlayer]);
    }

    /**
     * Called when playback pauses.
     */
    onPlayerPause() {
        events.trigger(this, 'pause', [this.currentPlayer]);
    }

    /**
     * Called on playback progress.
     * @param {Object} e The time update event.
     */
    onTimeUpdate (e) {
        // NOTICE: this event is unreliable, at least in Safari
        // which just stops firing the event after a while.
        events.trigger(this, 'timeupdate', [e]);
    }

    /**
     * Called when playback is resumed.
     */
    onPlaying () {
        // TODO: implement group wait
        this.lastPlaybackWaiting = null;
        events.trigger(this, 'playing');
    }

    /**
     * Called when playback is buffering.
     */
    onWaiting () {
        // TODO: implement group wait
        if (!this.lastPlaybackWaiting) {
            this.lastPlaybackWaiting = new Date();
        }

        events.trigger(this, 'waiting');
    }

    /**
     * Gets playback buffering status.
     * @returns {boolean} _true_ if player is buffering, _false_ otherwise.
     */
    isBuffering () {
        if (this.lastPlaybackWaiting === null) return false;
        return (new Date() - this.lastPlaybackWaiting) > this.minBufferingThresholdMillis;
    }

    /**
     * Binds to the player's events.
     * @param {Object} player The player.
     */
    bindToPlayer (player) {
        if (player !== this.currentPlayer) {
            this.releaseCurrentPlayer();
            this.currentPlayer = player;
            if (!player) return;
        }

        // FIXME: the following are needed because the 'events' module
        // is changing the scope when executing the callbacks.
        // For instance, calling 'onPlayerUnpause' from the wrong scope breaks things because 'this'
        // points to 'player' (the event emitter) instead of pointing to the SyncPlayManager singleton.
        const self = this;
        this._onPlayerUnpause = () => {
            self.onPlayerUnpause();
        };

        this._onPlayerPause = () => {
            self.onPlayerPause();
        };

        this._onTimeUpdate = (e) => {
            self.onTimeUpdate(e);
        };

        this._onPlaying = () => {
            self.onPlaying();
        };

        this._onWaiting = () => {
            self.onWaiting();
        };

        events.on(player, 'unpause', this._onPlayerUnpause);
        events.on(player, 'pause', this._onPlayerPause);
        events.on(player, 'timeupdate', this._onTimeUpdate);
        events.on(player, 'playing', this._onPlaying);
        events.on(player, 'waiting', this._onWaiting);

        // Save player current PlaybackRate value
        if (player.supports && player.supports('PlaybackRate')) {
            this.localPlayerPlaybackRate = player.getPlaybackRate();
        }
    }

    /**
     * Removes the bindings to the current player's events.
     */
    releaseCurrentPlayer () {
        var player = this.currentPlayer;
        if (player) {
            events.off(player, 'unpause', this._onPlayerUnpause);
            events.off(player, 'pause', this._onPlayerPause);
            events.off(player, 'timeupdate', this._onTimeUpdate);
            events.off(player, 'playing', this._onPlaying);
            events.off(player, 'waiting', this._onWaiting);
            // Restore player original PlaybackRate value
            if (this.playbackRateSupported) {
                player.setPlaybackRate(this.localPlayerPlaybackRate);
                this.localPlayerPlaybackRate = 1.0;
            }

            this.currentPlayer = null;
            this.playbackRateSupported = false;
        }
    }

    /**
     * Handles a group update from the server.
     * @param {Object} cmd The group update.
     * @param {Object} apiClient The ApiClient.
     */
    processGroupUpdate (cmd, apiClient) {
        switch (cmd.Type) {
            case 'PrepareSession':
                this.prepareSession(apiClient, cmd.GroupId, cmd.Data);
                break;
            case 'UserJoined':
                toast({
                    text: globalize.translate('MessageSyncPlayUserJoined', cmd.Data)
                });
                break;
            case 'UserLeft':
                toast({
                    text: globalize.translate('MessageSyncPlayUserLeft', cmd.Data)
                });
                break;
            case 'GroupJoined':
                this.enableSyncPlay(apiClient, new Date(cmd.Data), true);
                break;
            case 'NotInGroup':
            case 'GroupLeft':
                this.disableSyncPlay(true);
                break;
            case 'GroupWait':
                toast({
                    text: globalize.translate('MessageSyncPlayGroupWait', cmd.Data)
                });
                break;
            case 'GroupDoesNotExist':
                toast({
                    text: globalize.translate('MessageSyncPlayGroupDoesNotExist')
                });
                break;
            case 'CreateGroupDenied':
                toast({
                    text: globalize.translate('MessageSyncPlayCreateGroupDenied')
                });
                break;
            case 'JoinGroupDenied':
                toast({
                    text: globalize.translate('MessageSyncPlayJoinGroupDenied')
                });
                break;
            case 'LibraryAccessDenied':
                toast({
                    text: globalize.translate('MessageSyncPlayLibraryAccessDenied')
                });
                break;
            default:
                console.error('processSyncPlayGroupUpdate: command is not recognised: ' + cmd.Type);
                break;
        }
    }

    /**
     * Handles a playback command from the server.
     * @param {Object} cmd The playback command.
     * @param {Object} apiClient The ApiClient.
     */
    processCommand (cmd, apiClient) {
        if (cmd === null) return;

        if (!this.isSyncPlayEnabled()) {
            console.debug('SyncPlay processCommand: SyncPlay not enabled, ignoring command', cmd);
            return;
        }

        if (!this.syncPlayReady) {
            console.debug('SyncPlay processCommand: SyncPlay not ready, queued command', cmd);
            this.queuedCommand = cmd;
            return;
        }

        cmd.When = new Date(cmd.When);
        cmd.EmittedAt = new Date(cmd.EmitttedAt);

        if (cmd.EmitttedAt < this.syncPlayEnabledAt) {
            console.debug('SyncPlay processCommand: ignoring old command', cmd);
            return;
        }

        // Check if new command differs from last one
        if (this.lastCommand &&
            this.lastCommand.When === cmd.When &&
            this.lastCommand.PositionTicks === cmd.PositionTicks &&
            this.Command === cmd.Command
        ) {
            console.debug('SyncPlay processCommand: ignoring duplicate command', cmd);
            return;
        }

        this.lastCommand = cmd;
        console.log('SyncPlay will', cmd.Command, 'at', cmd.When, 'PositionTicks', cmd.PositionTicks);

        switch (cmd.Command) {
            case 'Play':
                this.schedulePlay(cmd.When, cmd.PositionTicks);
                break;
            case 'Pause':
                this.schedulePause(cmd.When, cmd.PositionTicks);
                break;
            case 'Seek':
                this.scheduleSeek(cmd.When, cmd.PositionTicks);
                break;
            default:
                console.error('processCommand: command is not recognised: ' + cmd.Type);
                break;
        }
    }

    /**
     * Prepares this client to join a group by loading the required content.
     * @param {Object} apiClient The ApiClient.
     * @param {string} groupId The group to join.
     * @param {Object} sessionData Info about the content to load.
     */
    prepareSession (apiClient, groupId, sessionData) {
        const serverId = apiClient.serverInfo().Id;
        playbackManager.play({
            ids: sessionData.ItemIds,
            startPositionTicks: sessionData.StartPositionTicks,
            mediaSourceId: sessionData.MediaSourceId,
            audioStreamIndex: sessionData.AudioStreamIndex,
            subtitleStreamIndex: sessionData.SubtitleStreamIndex,
            startIndex: sessionData.StartIndex,
            serverId: serverId
        }).then(() => {
            waitForEventOnce(this, 'playbackstart', WaitForEventDefaultTimeout).then(() => {
                var sessionId = getActivePlayerId();
                if (!sessionId) {
                    console.error('Missing sessionId!');
                    toast({
                        text: globalize.translate('MessageSyncPlayErrorMissingSession')
                    });
                    return;
                }

                // Get playing item id
                let playingItemId;
                try {
                    const playState = playbackManager.getPlayerState();
                    playingItemId = playState.NowPlayingItem.Id;
                } catch (error) {
                    playingItemId = '';
                }
                // Make sure the server has received the player state
                waitForEventOnce(playbackManager, 'reportplayback', WaitForEventDefaultTimeout).then((success) => {
                    this.localPause();
                    if (!success) {
                        console.warning('Error reporting playback state to server. Joining group will fail.');
                    }
                    apiClient.joinSyncPlayGroup({
                        GroupId: groupId,
                        PlayingItemId: playingItemId
                    });
                }).catch(() => {
                    console.error('Timed out while waiting for `reportplayback` event!');
                    toast({
                        text: globalize.translate('MessageSyncPlayErrorMedia')
                    });
                    return;
                });
            }).catch(() => {
                console.error('Timed out while waiting for `playbackstart` event!');
                if (!this.isSyncPlayEnabled()) {
                    toast({
                        text: globalize.translate('MessageSyncPlayErrorMedia')
                    });
                }
                return;
            });
        }).catch((error) => {
            console.error(error);
            toast({
                text: globalize.translate('MessageSyncPlayErrorMedia')
            });
        });
    }

    /**
     * Enables SyncPlay.
     * @param {Object} apiClient The ApiClient.
     * @param {Date} enabledAt When SyncPlay has been enabled. Server side date.
     * @param {boolean} showMessage Display message.
     */
    enableSyncPlay (apiClient, enabledAt, showMessage = false) {
        this.syncPlayEnabledAt = enabledAt;
        this.injectPlaybackManager();
        events.trigger(this, 'enabled', [true]);

        waitForEventOnce(this, 'ready').then(() => {
            this.processCommand(this.queuedCommand, apiClient);
            this.queuedCommand = null;
        });

        this.syncPlayReady = false;
        this.notifySyncPlayReady = true;

        timeSyncManager.forceUpdate();

        if (showMessage) {
            toast({
                text: globalize.translate('MessageSyncPlayEnabled')
            });
        }
    }

    /**
     * Disables SyncPlay.
     * @param {boolean} showMessage Display message.
     */
    disableSyncPlay (showMessage = false) {
        this.syncPlayEnabledAt = null;
        this.syncPlayReady = false;
        this.lastCommand = null;
        this.queuedCommand = null;
        this.syncEnabled = false;
        events.trigger(this, 'enabled', [false]);
        this.restorePlaybackManager();

        if (showMessage) {
            toast({
                text: globalize.translate('MessageSyncPlayDisabled')
            });
        }
    }

    /**
     * Gets SyncPlay status.
     * @returns {boolean} _true_ if user joined a group, _false_ otherwise.
     */
    isSyncPlayEnabled () {
        return this.syncPlayEnabledAt !== null;
    }

    /**
     * Schedules a resume playback on the player at the specified clock time.
     * @param {Date} playAtTime The server's UTC time at which to resume playback.
     * @param {number} positionTicks The PositionTicks from where to resume.
     */
    schedulePlay (playAtTime, positionTicks) {
        this.clearScheduledCommand();
        const currentTime = new Date();
        const playAtTimeLocal = timeSyncManager.serverDateToLocal(playAtTime);

        if (playAtTimeLocal > currentTime) {
            const playTimeout = playAtTimeLocal - currentTime;
            this.localSeek(positionTicks);

            this.scheduledCommand = setTimeout(() => {
                this.localUnpause();

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                }, SyncMethodThreshold / 2);

            }, playTimeout);

            console.debug('Scheduled play in', playTimeout / 1000.0, 'seconds.');
        } else {
            // Group playback already started
            const serverPositionTicks = positionTicks + (currentTime - playAtTimeLocal) * 10000;
            waitForEventOnce(this, 'unpause').then(() => {
                this.localSeek(serverPositionTicks);
            });
            this.localUnpause();

            this.syncTimeout = setTimeout(() => {
                this.syncEnabled = true;
            }, SyncMethodThreshold / 2);
        }
    }

    /**
     * Schedules a pause playback on the player at the specified clock time.
     * @param {Date} pauseAtTime The server's UTC time at which to pause playback.
     * @param {number} positionTicks The PositionTicks where player will be paused.
     */
    schedulePause (pauseAtTime, positionTicks) {
        this.clearScheduledCommand();
        const currentTime = new Date();
        const pauseAtTimeLocal = timeSyncManager.serverDateToLocal(pauseAtTime);

        const callback = () => {
            waitForEventOnce(this, 'pause', WaitForPlayerEventTimeout).then(() => {
                this.localSeek(positionTicks);
            }).catch(() => {
                // Player was already paused, seeking
                this.localSeek(positionTicks);
            });
            this.localPause();
        };

        if (pauseAtTimeLocal > currentTime) {
            const pauseTimeout = pauseAtTimeLocal - currentTime;
            this.scheduledCommand = setTimeout(callback, pauseTimeout);

            console.debug('Scheduled pause in', pauseTimeout / 1000.0, 'seconds.');
        } else {
            callback();
        }
    }

    /**
     * Schedules a seek playback on the player at the specified clock time.
     * @param {Date} pauseAtTime The server's UTC time at which to seek playback.
     * @param {number} positionTicks The PositionTicks where player will be seeked.
     */
    scheduleSeek (seekAtTime, positionTicks) {
        this.schedulePause(seekAtTime, positionTicks);
    }

    /**
     * Clears the current scheduled command.
     */
    clearScheduledCommand () {
        clearTimeout(this.scheduledCommand);
        clearTimeout(this.syncTimeout);

        this.syncEnabled = false;
        if (this.currentPlayer) {
            this.currentPlayer.setPlaybackRate(1);
        }

        this.clearSyncIcon();
    }

    /**
     * Overrides some PlaybackManager's methods to intercept playback commands.
     */
    injectPlaybackManager () {
        if (!this.isSyncPlayEnabled()) return;
        if (playbackManager.syncPlayEnabled) return;

        // TODO: make this less hacky
        playbackManager._localUnpause = playbackManager.unpause;
        playbackManager._localPause = playbackManager.pause;
        playbackManager._localSeek = playbackManager.seek;

        playbackManager.unpause = this.playRequest;
        playbackManager.pause = this.pauseRequest;
        playbackManager.seek = this.seekRequest;
        playbackManager.syncPlayEnabled = true;
    }

    /**
     * Restores original PlaybackManager's methods.
     */
    restorePlaybackManager () {
        if (this.isSyncPlayEnabled()) return;
        if (!playbackManager.syncPlayEnabled) return;

        playbackManager.unpause = playbackManager._localUnpause;
        playbackManager.pause = playbackManager._localPause;
        playbackManager.seek = playbackManager._localSeek;
        playbackManager.syncPlayEnabled = false;
    }

    /**
     * Overrides PlaybackManager's unpause method.
     */
    playRequest (player) {
        var apiClient = connectionManager.currentApiClient();
        apiClient.requestSyncPlayStart();
    }

    /**
     * Overrides PlaybackManager's pause method.
     */
    pauseRequest (player) {
        var apiClient = connectionManager.currentApiClient();
        apiClient.requestSyncPlayPause();
        // Pause locally as well, to give the user some little control
        playbackManager._localUnpause(player);
    }

    /**
     * Overrides PlaybackManager's seek method.
     */
    seekRequest (PositionTicks, player) {
        var apiClient = connectionManager.currentApiClient();
        apiClient.requestSyncPlaySeek({
            PositionTicks: PositionTicks
        });
    }

    /**
     * Calls original PlaybackManager's unpause method.
     */
    localUnpause(player) {
        if (playbackManager.syncPlayEnabled) {
            playbackManager._localUnpause(player);
        } else {
            playbackManager.unpause(player);
        }
    }

    /**
     * Calls original PlaybackManager's pause method.
     */
    localPause(player) {
        if (playbackManager.syncPlayEnabled) {
            playbackManager._localPause(player);
        } else {
            playbackManager.pause(player);
        }
    }

    /**
     * Calls original PlaybackManager's seek method.
     */
    localSeek(PositionTicks, player) {
        if (playbackManager.syncPlayEnabled) {
            playbackManager._localSeek(PositionTicks, player);
        } else {
            playbackManager.seek(PositionTicks, player);
        }
    }

    /**
     * Attempts to sync playback time with estimated server time.
     *
     * When sync is enabled, the following will be checked:
     *  - check if local playback time is close enough to the server playback time
     * If it is not, then a playback time sync will be attempted.
     * Two methods of syncing are available:
     * - SpeedToSync: speeds up the media for some time to catch up (default is one second)
     * - SkipToSync: seeks the media to the estimated correct time
     * SpeedToSync aims to reduce the delay as much as possible, whereas SkipToSync is less pretentious.
     */
    syncPlaybackTime () {
        // Attempt to sync only when media is playing.
        if (!this.lastCommand || this.lastCommand.Command !== 'Play' || this.isBuffering()) return;

        const currentTime = new Date();

        // Avoid overloading the browser
        const elapsed = currentTime - this.lastSyncTime;
        if (elapsed < SyncMethodThreshold / 2) return;
        this.lastSyncTime = currentTime;

        const playAtTime = this.lastCommand.When;

        const currentPositionTicks = playbackManager.currentTime();
        // Estimate PositionTicks on server
        const serverPositionTicks = this.lastCommand.PositionTicks + ((currentTime - playAtTime) + this.timeOffsetWithServer) * 10000;
        // Measure delay that needs to be recovered
        // diff might be caused by the player internally starting the playback
        const diffMillis = (serverPositionTicks - currentPositionTicks) / 10000.0;

        this.playbackDiffMillis = diffMillis;

        if (this.syncEnabled) {
            const absDiffMillis = Math.abs(diffMillis);
            // TODO: SpeedToSync sounds bad on songs
            // TODO: SpeedToSync is failing on Safari (Mojave); even if playbackRate is supported, some delay seems to exist
            if (this.playbackRateSupported && absDiffMillis > MaxAcceptedDelaySpeedToSync && absDiffMillis < SyncMethodThreshold) {
                // Disable SpeedToSync if it keeps failing
                if (this.syncAttempts > MaxAttemptsSpeedToSync) {
                    this.playbackRateSupported = false;
                }
                // SpeedToSync method
                const speed = 1 + diffMillis / SpeedToSyncTime;

                this.currentPlayer.setPlaybackRate(speed);
                this.syncEnabled = false;
                this.syncAttempts++;
                this.showSyncIcon('SpeedToSync (x' + speed + ')');

                this.syncTimeout = setTimeout(() => {
                    this.currentPlayer.setPlaybackRate(1);
                    this.syncEnabled = true;
                    this.clearSyncIcon();
                }, SpeedToSyncTime);
            } else if (absDiffMillis > MaxAcceptedDelaySkipToSync) {
                // Disable SkipToSync if it keeps failing
                if (this.syncAttempts > MaxAttemptsSync) {
                    this.syncEnabled = false;
                    this.showSyncIcon('Sync disabled (too many attempts)');
                }
                // SkipToSync method
                this.localSeek(serverPositionTicks);
                this.syncEnabled = false;
                this.syncAttempts++;
                this.showSyncIcon('SkipToSync (' + this.syncAttempts + ')');

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                    this.clearSyncIcon();
                }, SyncMethodThreshold / 2);
            } else {
                // Playback is synced
                if (this.syncAttempts > 0) {
                    console.debug('Playback has been synced after', this.syncAttempts, 'attempts.');
                }
                this.syncAttempts = 0;
            }
        }
    }

    /**
     * Gets SyncPlay stats.
     * @returns {Object} The SyncPlay stats.
     */
    getStats () {
        return {
            TimeOffset: this.timeOffsetWithServer,
            PlaybackDiff: this.playbackDiffMillis,
            SyncMethod: this.syncMethod
        };
    }

    /**
     * Emits an event to update the SyncPlay status icon.
     */
    showSyncIcon (syncMethod) {
        this.syncMethod = syncMethod;
        events.trigger(this, 'syncing', [true, this.syncMethod]);
    }

    /**
     * Emits an event to clear the SyncPlay status icon.
     */
    clearSyncIcon () {
        this.syncMethod = 'None';
        events.trigger(this, 'syncing', [false, this.syncMethod]);
    }

    /**
     * Signals an error state, which disables and resets SyncPlay for a new session.
     */
    signalError () {
        this.disableSyncPlay();
    }
}

/** SyncPlayManager singleton. */
export default new SyncPlayManager();
