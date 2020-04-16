/* eslint-disable indent */

/**
 * Module that manages the Syncplay feature.
 * @module components/syncplay/syncplayManager
 */

import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
import timeSyncManager from 'timeSyncManager';
import toast from 'toast';
import globalize from 'globalize';

/**
 * Waits for an event to be triggered on an object.
 * @param {Object} emitter Object on which to listen for events.
 * @param {string} eventType Event name to listen for.
 * @returns {Promise} A promise that resolves when the event is triggered.
 */
function waitForEvent(emitter, eventType) {
    return new Promise((resolve) => {
        var callback = () => {
            events.off(emitter, eventType, callback);
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
 * Time estimation
 */
const PingIntervalTimeoutGreedy = 1000; // milliseconds
const PingIntervalTimeoutLowProfile = 60000; // milliseconds
const GreedyPingCount = 3;

/**
 * Class that manages the Syncplay feature.
 */
class SyncplayManager {
    constructor() {
        this.playbackRateSupported = false;
        this.syncEnabled = false;
        this.playbackDiffMillis = 0; // used for stats
        this.syncMethod = "None"; // used for stats
        this.syncAttempts = 0;
        this.lastSyncTime = new Date();
        this.syncWatcherTimeout = null; // interval that watches playback time and syncs it

        this.lastPlaybackWaiting = null; // used to determine if player's buffering
        this.minBufferingThresholdMillis = 1000;

        this.currentPlayer = null;

        this.syncplayEnabledAt = null; // Server time of when Syncplay has been enabled
        this.syncplayReady = false; // Syncplay is ready after first ping to server

        this.lastCommand = null;
        this.queuedCommand = null;

        this.scheduledCommand = null;
        this.syncTimeout = null;

        this.timeOffsetWithServer = 0; // server time minus local time
        this.roundTripDuration = 0;
        this.notifySyncplayReady = false;
        
        events.on(playbackManager, "playerchange", () => {
            this.onPlayerChange();
        });

        events.on(playbackManager, "playbackstart", (player, state) => {
            events.trigger(this, 'PlaybackStart', [player, state]);
        });

        this.bindToPlayer(playbackManager.getCurrentPlayer());

        events.on(this, "TimeUpdate", (event) => {
            this.syncPlaybackTime();
        });

        events.on(timeSyncManager, "Update", (event, timeOffset, ping) => {            
            this.timeOffsetWithServer = timeOffset;
            this.roundTripDuration = ping * 2;

            if (this.notifySyncplayReady) {
                this.syncplayReady = true;
                events.trigger(this, "SyncplayReady");
                this.notifySyncplayReady = false;
            }
        });
    }

    /**
     * Called when the player changes.
     */
    onPlayerChange () {
        this.bindToPlayer(playbackManager.getCurrentPlayer());
        events.trigger(this, "PlayerChange", [this.currentPlayer]);
    }

    /**
     * Called on playback state changes.
     * @param {Object} e The playback state change event.
     */
    onPlayPauseStateChanged (e) {
        events.trigger(this, "PlayPauseStateChange", [this.currentPlayer]);
    }

    /**
     * Called on playback progress.
     * @param {Object} e The time update event.
     */
    onTimeUpdate (e) {
        // NOTICE: this event is unreliable, at least in Safari
        // which just stops firing the event after a while.
        events.trigger(this, "TimeUpdate", [e]);
    }

    /**
     * Called when playback is resumed.
     */
    onPlaying () {
        // TODO: implement group wait
        this.lastPlaybackWaiting = null;
        events.trigger(this, "PlayerPlaying");
    }

    /**
     * Called when playback is buffering.
     */
    onWaiting () {
        // TODO: implement group wait
        if (!this.lastPlaybackWaiting) {
            this.lastPlaybackWaiting = new Date();
        }
        events.trigger(this, "PlayerWaiting");
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
        
        // TODO: remove this extra functions
        const self = this;
        this._onPlayPauseStateChanged = () => {
            self.onPlayPauseStateChanged();
        };

        this._onPlayPauseStateChanged = (e) => {
            self.onPlayPauseStateChanged(e);
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

        events.on(player, "pause", this._onPlayPauseStateChanged);
        events.on(player, "unpause", this._onPlayPauseStateChanged);
        events.on(player, "timeupdate", this._onTimeUpdate);
        events.on(player, "playing", this._onPlaying);
        events.on(player, "waiting", this._onWaiting);
        this.playbackRateSupported = player.supports("PlaybackRate");
    }

    /**
     * Removes the bindings to the current player's events.
     */
    releaseCurrentPlayer () {
        var player = this.currentPlayer;
        if (player) {
            events.off(player, "pause", this._onPlayPauseStateChanged);
            events.off(player, "unpause", this._onPlayPauseStateChanged);
            events.off(player, "timeupdate", this._onTimeUpdate);
            events.off(player, "playing", this._onPlaying);
            events.off(player, "waiting", this._onWaiting);
            if (this.playbackRateSupported) {
                player.setPlaybackRate(1);
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
                    text: globalize.translate('MessageSyncplayUserJoined', cmd.Data)
                });
                break;
            case 'UserLeft':
                toast({
                    text: globalize.translate('MessageSyncplayUserLeft', cmd.Data)
                });
                break;
            case 'GroupJoined':
                const enabledAt = new Date(cmd.Data);
                this.enableSyncplay(apiClient, enabledAt, true);
                break;
            case 'NotInGroup':
            case 'GroupLeft':
                this.disableSyncplay(true);
                break;
            case 'GroupWait':
                toast({
                    text: globalize.translate('MessageSyncplayGroupWait', cmd.Data)
                });
                break;
            case 'KeepAlive':
                break;
            default:
                console.error('processSyncplayGroupUpdate does not recognize: ' + cmd.Type);
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

        if (!this.isSyncplayEnabled()) {
            console.debug("Syncplay processCommand: ignoring command", cmd);
            return;
        }

        if (!this.syncplayReady) {
            console.debug("Syncplay processCommand: queued command", cmd);
            this.queuedCommand = cmd;
            return;
        }

        cmd.When = new Date(cmd.When);
        cmd.EmittedAt = new Date(cmd.EmitttedAt);

        if (cmd.EmitttedAt < this.syncplayEnabledAt) {
            console.debug("Syncplay processCommand: ignoring old command", cmd);
            return;
        }

        // Check if new command differs from last one
        if (this.lastCommand &&
            this.lastCommand.When === cmd.When &&
            this.lastCommand.PositionTicks === cmd.PositionTicks &&
            this.Command === cmd.Command
        ) {
            console.debug("Syncplay processCommand: ignoring duplicate command", cmd);
            return;
        }

        this.lastCommand = cmd;
        console.log("Syncplay will", cmd.Command, "at", cmd.When, "PositionTicks", cmd.PositionTicks);

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
                console.error('processSyncplayCommand does not recognize: ' + cmd.Type);
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
        var serverId = apiClient.serverInfo().Id;
        playbackManager.play({
            ids: sessionData.ItemIds,
            startPositionTicks: sessionData.StartPositionTicks,
            mediaSourceId: sessionData.MediaSourceId,
            audioStreamIndex: sessionData.AudioStreamIndex,
            subtitleStreamIndex: sessionData.SubtitleStreamIndex,
            startIndex: sessionData.StartIndex,
            serverId: serverId
        }).then(() => {
            // TODO: switch to PlaybackStart maybe?
            waitForEvent(this, "PlayerChange").then(() => {
                playbackManager.pause();
                var sessionId = getActivePlayerId();
                if (!sessionId) {
                    console.error("Missing sessionId!");
                    toast({
                        // TODO: translate
                        text: "Failed to enable Syncplay! Missing session id."
                    });
                    return;
                }
                // Get playing item id
                let playingItemId;
                try {
                    const playState = playbackManager.getPlayerState();
                    playingItemId = playState.NowPlayingItem.Id;
                } catch (error) {
                    playingItemId = "";
                }
                // Sometimes JoinGroup fails, maybe because server hasn't been updated yet
                setTimeout(() => {
                    apiClient.sendSyncplayCommand(sessionId, "JoinGroup", {
                        GroupId: groupId,
                        PlayingItemId: playingItemId
                    });
                }, 500);
            });
        }).catch((error) => {
            console.error(error);
            toast({
                // TODO: translate
                text: "Failed to enable Syncplay! Media error."
            });
        });
    }

    /**
     * Enables Syncplay.
     * @param {Object} apiClient The ApiClient.
     * @param {Date} enabledAt When Syncplay has been enabled. Server side date.
     * @param {boolean} showMessage Display message.
     */
    enableSyncplay (apiClient, enabledAt, showMessage = false) {
        this.syncplayEnabledAt = enabledAt;
        this.injectPlaybackManager();
        events.trigger(this, "SyncplayEnabled", [true]);

        waitForEvent(this, "SyncplayReady").then(() => {
            this.processCommand(this.queuedCommand, apiClient);
            this.queuedCommand = null;
        });
        this.syncplayReady = false;
        this.notifySyncplayReady = true;

        timeSyncManager.forceUpdate();

        if (showMessage) {
            toast({
                text: globalize.translate('MessageSyncplayEnabled')
            });
        }
    }

    /**
     * Disables Syncplay.
     * @param {boolean} showMessage Display message.
     */
    disableSyncplay (showMessage = false) {
        this.syncplayEnabledAt = null;
        this.syncplayReady = false;
        this.lastCommand = null;
        this.queuedCommand = null;
        this.syncEnabled = false;
        events.trigger(this, "SyncplayEnabled", [false]);
        this.restorePlaybackManager();
        this.stopSyncWatcher();

        if (showMessage) {
            toast({
                text: globalize.translate('MessageSyncplayDisabled')
            });
        }
    }

    /**
     * Gets Syncplay status.
     * @returns {boolean} _true_ if user joined a group, _false_ otherwise.
     */
    isSyncplayEnabled () {
        return this.syncplayEnabledAt !== null ? true : false;
    }

    /**
     * Schedules a resume playback on the player at the specified clock time.
     * @param {Date} playAtTime The server's UTC time at which to resume playback.
     * @param {number} positionTicks The PositionTicks from where to resume.
     */
    schedulePlay (playAtTime, positionTicks) {
        this.clearScheduledCommand();
        var currentTime = new Date();
        var playAtTimeLocal = timeSyncManager.serverDateToLocal(playAtTime);

        if (playAtTimeLocal > currentTime) {
            var playTimeout = playAtTimeLocal - currentTime;
            playbackManager.syncplay_seek(positionTicks);

            this.scheduledCommand = setTimeout(() => {
                playbackManager.syncplay_unpause();

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                    this.startSyncWatcher();
                }, SyncMethodThreshold / 2);

            }, playTimeout);

            // console.debug("Syncplay schedulePlay:", playTimeout);
        } else {
            // Group playback already started
            var serverPositionTicks = positionTicks + (currentTime - playAtTimeLocal) * 10000;
            playbackManager.syncplay_unpause();
            playbackManager.syncplay_seek(serverPositionTicks);

            this.syncTimeout = setTimeout(() => {
                this.syncEnabled = true;
                this.startSyncWatcher();
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
        var currentTime = new Date();
        var pauseAtTimeLocal = timeSyncManager.serverDateToLocal(pauseAtTime);

        if (pauseAtTimeLocal > currentTime) {
            var pauseTimeout = pauseAtTimeLocal - currentTime;

            this.scheduledCommand = setTimeout(() => {
                playbackManager.syncplay_pause();
                setTimeout(() => {
                    playbackManager.syncplay_seek(positionTicks);
                }, 800);

            }, pauseTimeout);
        } else {
            playbackManager.syncplay_pause();
            setTimeout(() => {
                playbackManager.syncplay_seek(positionTicks);
            }, 800);
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
        this.stopSyncWatcher();
        if (this.currentPlayer) {
            this.currentPlayer.setPlaybackRate(1);
        }
        this.clearSyncIcon();
    }

    /**
     * Overrides some PlaybackManager's methods to intercept playback commands.
     */
    injectPlaybackManager () {
        if (!this.isSyncplayEnabled()) return;
        if (playbackManager.syncplayEnabled) return;

        // TODO: make this less hacky 
        playbackManager.syncplay_unpause = playbackManager.unpause;
        playbackManager.syncplay_pause = playbackManager.pause;
        playbackManager.syncplay_seek = playbackManager.seek;

        playbackManager.unpause = this.playRequest;
        playbackManager.pause = this.pauseRequest;
        playbackManager.seek = this.seekRequest;
        playbackManager.syncplayEnabled = true;
    }

    /**
     * Restores original PlaybackManager's methods.
     */
    restorePlaybackManager () {
        if (this.isSyncplayEnabled()) return;
        if (!playbackManager.syncplayEnabled) return;

        playbackManager.unpause = playbackManager.syncplay_unpause;
        playbackManager.pause = playbackManager.syncplay_pause;
        playbackManager.seek = playbackManager.syncplay_seek;
        playbackManager.syncplayEnabled = false;
    }

    /**
     * Overrides PlaybackManager's unpause method.
     */
    playRequest (player) {
        var apiClient = connectionManager.currentApiClient();
        var sessionId = getActivePlayerId();
        apiClient.sendSyncplayCommand(sessionId, "PlayRequest");
    }

    /**
     * Overrides PlaybackManager's pause method.
     */
    pauseRequest (player) {
        var apiClient = connectionManager.currentApiClient();
        var sessionId = getActivePlayerId();
        apiClient.sendSyncplayCommand(sessionId, "PauseRequest");
        // Pause locally as well, to give the user some little control
        playbackManager.syncplay_pause();
    }

    /**
     * Overrides PlaybackManager's seek method.
     */
    seekRequest (PositionTicks, player) {
        var apiClient = connectionManager.currentApiClient();
        var sessionId = getActivePlayerId();
        apiClient.sendSyncplayCommand(sessionId, "SeekRequest", {
            PositionTicks: PositionTicks
        });
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
        this.notifySyncWatcher();

        const playAtTime = this.lastCommand.When;

        const CurrentPositionTicks = playbackManager.currentTime();
        // Estimate PositionTicks on server
        const ServerPositionTicks = this.lastCommand.PositionTicks + ((currentTime - playAtTime) + this.timeOffsetWithServer) * 10000;
        // Measure delay that needs to be recovered
        // diff might be caused by the player internally starting the playback
        const diff = ServerPositionTicks - CurrentPositionTicks;
        const diffMillis = diff / 10000;

        this.playbackDiffMillis = diffMillis;

        // console.debug("Syncplay onTimeUpdate", diffMillis, CurrentPositionTicks, ServerPositionTicks);

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
                this.showSyncIcon("SpeedToSync (x" + speed + ")");

                this.syncTimeout = setTimeout(() => {
                    this.currentPlayer.setPlaybackRate(1);
                    this.syncEnabled = true;
                    this.clearSyncIcon();
                }, SpeedToSyncTime);
            } else if (absDiffMillis > MaxAcceptedDelaySkipToSync) {
                // Disable SkipToSync if it keeps failing
                if (this.syncAttempts > MaxAttemptsSync) {
                    this.syncEnabled = false;
                    this.showSyncIcon("Sync disabled (too many attempts)");
                }
                // SkipToSync method
                playbackManager.syncplay_seek(ServerPositionTicks);
                this.syncEnabled = false;
                this.syncAttempts++;
                this.showSyncIcon("SkipToSync (" + this.syncAttempts + ")");

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                    this.clearSyncIcon();
                }, SyncMethodThreshold / 2);
            } else {
                // Playback is synced
                if (this.syncAttempts > 0) {
                    // console.debug("Playback has been synced after", this.syncAttempts, "attempts.");
                }
                this.syncAttempts = 0;
            }
        }
    }

    /**
     * Signals the worker to start watching sync. Also creates the worker if needed.
     * 
     * This additional fail-safe has been added because on Safari the timeupdate event fails after a while.
     */
    startSyncWatcher () {
        // SPOILER ALERT: this idea fails too on Safari... Keeping it here for future investigations
        return;
        if (window.Worker) {
            // Start worker if needed
            if (!this.worker) {
                this.worker = new Worker("workers/syncplay/syncplay.worker.js");
                this.worker.onmessage = (event) => {
                    const message = event.data;
                    switch (message.type) {
                        case "TriggerSync":
                            // TODO: player state might not reflect the real playback position,
                            // thus calling syncPlaybackTime outside a timeupdate event might not really sync to the right point
                            this.syncPlaybackTime();
                            break;
                        default:
                            console.error("Syncplay: unknown message from worker:", message.type);
                            break;
                    }
                };
                this.worker.onerror = (event) => {
                    console.error("Syncplay: worker error", event);
                };
                this.worker.onmessageerror = (event) => {
                    console.error("Syncplay: worker message error", event);
                };
            }
            // Start watcher
            this.worker.postMessage({
                type: "StartSyncWatcher",
                data: {
                    interval: SyncMethodThreshold / 2,
                    threshold: SyncMethodThreshold
                }
            });
        } else {
            console.debug("Syncplay: workers not supported.");
        }
    }

    /**
     * Signals the worker to stop watching sync.
     */
    stopSyncWatcher () {
        if (this.worker) {
            this.worker.postMessage({
                type: "StopSyncWatcher"
            });
        }
    }

    /**
     * Signals new state to worker.
     */
    notifySyncWatcher () {
        if (this.worker) {
            this.worker.postMessage({
                type: "UpdateLastSyncTime",
                data: this.lastSyncTime
            });
        }
    }

    /**
     * Gets Syncplay stats.
     * @returns {Object} The Syncplay stats.
     */
    getStats () {
        return {
            TimeOffset: this.timeOffsetWithServer,
            PlaybackDiff: this.playbackDiffMillis,
            SyncMethod: this.syncMethod
        }
    }

    /**
     * Emits an event to update the Syncplay status icon.
     */
    showSyncIcon (syncMethod) {
        this.syncMethod = syncMethod;
        events.trigger(this, "SyncplayError", [true]);
    }

    /**
     * Emits an event to clear the Syncplay status icon.
     */
    clearSyncIcon () {
        this.syncMethod = "None";
        events.trigger(this, "SyncplayError", [false]);
    }

    /**
     * Signals an error state, which disables and resets Syncplay for a new session.
     */
    signalError () {
        this.disableSyncplay();
    }
}

/** SyncplayManager singleton. */
export default new SyncplayManager();
