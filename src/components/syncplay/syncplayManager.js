/* eslint-disable indent */

/**
 * Module that manages the Syncplay feature.
 * @module components/syncplay/syncplayManager
 */

import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
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
const SpeedUpToSyncTime = 1000; // milliseconds, duration in which the playback is sped up

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

        this.lastPlaybackWaiting = null; // used to determine if player's buffering
        this.minBufferingThresholdMillis = 1000;

        this.currentPlayer = null;

        this.syncplayEnabledAt = null; // Server time of when Syncplay has been enabled
        this.syncplayReady = false; // Syncplay is ready after first ping to server

        this.lastCommand = null;
        this.queuedCommand = null;

        this.scheduledCommand = null;
        this.syncTimeout = null;

        this.pingStop = true;
        this.pingIntervalTimeout = PingIntervalTimeoutGreedy;
        this.pingInterval = null;
        this.initTimeDiff = 0; // number of pings
        this.timeDiff = 0; // local time minus server time
        this.roundTripDuration = 0;
        this.notifySyncplayReady = false;
        
        events.on(playbackManager, "playerchange", () => {
            this.onPlayerChange();
        });
        this.bindToPlayer(playbackManager.getCurrentPlayer());
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
        events.trigger(this, "TimeUpdate", [e]);

        if (this.lastCommand && this.lastCommand.Command === 'Play' && !this.isBuffering()) {
            var currentTime = new Date();
            var playAtTime = this.lastCommand.When;

            var state = playbackManager.getPlayerState().PlayState;
            // Estimate PositionTicks on server
            var ServerPositionTicks = this.lastCommand.PositionTicks + ((currentTime - playAtTime) - this.timeDiff) * 10000;
            // Measure delay that needs to be recovered
            // diff might be caused by the player internally starting the playback
            var diff = ServerPositionTicks - state.PositionTicks;
            var diffMillis = diff / 10000;

            this.playbackDiffMillis = diffMillis;

            // console.debug("Syncplay onTimeUpdate", diffMillis, state.PositionTicks, ServerPositionTicks);

            if (this.syncEnabled) {
                var absDiffMillis = Math.abs(diffMillis);
                // TODO: SpeedToSync sounds bad on songs
                if (this.playbackRateSupported && absDiffMillis > MaxAcceptedDelaySpeedToSync && absDiffMillis < SyncMethodThreshold) {
                    // SpeedToSync method
                    var speed = 1 + diffMillis / SpeedUpToSyncTime;

                    this.currentPlayer.setPlaybackRate(speed);
                    this.syncEnabled = false;
                    this.showSyncIcon("SpeedToSync (x" + speed + ")");

                    this.syncTimeout = setTimeout(() => {
                        this.currentPlayer.setPlaybackRate(1);
                        this.syncEnabled = true;
                        this.clearSyncIcon();
                    }, SpeedUpToSyncTime);
                } else if (absDiffMillis > MaxAcceptedDelaySkipToSync) {
                    // SkipToSync method
                    playbackManager.syncplay_seek(ServerPositionTicks);
                    this.syncEnabled = false;
                    this.showSyncIcon("SkipToSync");

                    this.syncTimeout = setTimeout(() => {
                        this.syncEnabled = true;
                        this.clearSyncIcon();
                    }, this.syncMethodThreshold / 2);
                }
            }
        }
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
                var serverId = apiClient.serverInfo().Id;
                playbackManager.play({
                    ids: cmd.Data.ItemIds,
                    startPositionTicks: cmd.Data.StartPositionTicks,
                    mediaSourceId: cmd.Data.MediaSourceId,
                    audioStreamIndex: cmd.Data.AudioStreamIndex,
                    subtitleStreamIndex: cmd.Data.SubtitleStreamIndex,
                    startIndex: cmd.Data.StartIndex,
                    serverId: serverId
                }).then(() => {
                    waitForEvent(this, "PlayerChange").then(() => {
                        playbackManager.pause();
                        var sessionId = getActivePlayerId();
                        if (!sessionId) {
                            console.error("Missing sessionId!");
                            toast({
                                text: "Failed to enable Syncplay!"
                            });
                            return;
                        }
                        // Sometimes JoinGroup fails, maybe because server hasn't been updated yet
                        setTimeout(() => {
                            apiClient.sendSyncplayCommand(sessionId, "JoinGroup", {
                                GroupId: cmd.GroupId
                            });
                        }, 500);
                    });
                });
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
                toast({
                    text: globalize.translate('MessageSyncplayEnabled')
                });
                // Enable Syncplay
                this.syncplayEnabledAt = new Date(cmd.Data);
                this.syncplayReady = false;
                events.trigger(this, "SyncplayEnabled", [true]);
                waitForEvent(this, "SyncplayReady").then(() => {
                    this.processCommand(this.queuedCommand, apiClient);
                    this.queuedCommand = null;
                });
                this.injectPlaybackManager();
                this.startPing();
                break;
            case 'NotInGroup':
            case 'GroupLeft':
                toast({
                    text: globalize.translate('MessageSyncplayDisabled')
                });
                // Disable Syncplay
                this.syncplayEnabledAt = null;
                this.syncplayReady = false;
                events.trigger(this, "SyncplayEnabled", [false]);
                this.restorePlaybackManager();
                this.stopPing();
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

        if (cmd.When < this.syncplayEnabledAt) {
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
     * Schedules a resume playback on the player at the specified clock time.
     * @param {Date} playAtTime The server's UTC time at which to resume playback.
     * @param {number} positionTicks The PositionTicks from where to resume.
     */
    schedulePlay (playAtTime, positionTicks) {
        this.clearScheduledCommand();
        var currentTime = new Date();
        var playAtTimeLocal = this.serverDateToLocal(playAtTime);

        if (playAtTimeLocal > currentTime) {
            var playTimeout = playAtTimeLocal - currentTime;
            playbackManager.syncplay_seek(positionTicks);

            this.scheduledCommand = setTimeout(() => {
                playbackManager.syncplay_unpause();

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true
                }, this.syncMethodThreshold / 2);

            }, playTimeout);

            // console.debug("Syncplay schedulePlay:", playTimeout);
        } else {
            // Group playback already started
            var serverPositionTicks = positionTicks + (currentTime - playAtTimeLocal) * 10000;
            playbackManager.syncplay_unpause();
            playbackManager.syncplay_seek(serverPositionTicks);

            this.syncTimeout = setTimeout(() => {
                this.syncEnabled = true
            }, this.syncMethodThreshold / 2);
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
        var pauseAtTimeLocal = this.serverDateToLocal(pauseAtTime);

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
     * Computes time difference between this client's time and server's time.
     * @param {Date} pingStartTime Local time when ping request started.
     * @param {Date} pingEndTime Local time when ping request ended.
     * @param {Date} serverTime Server UTC time at ping request.
     */
    updateTimeDiff (pingStartTime, pingEndTime, serverTime) {
        this.roundTripDuration = (pingEndTime - pingStartTime);
        // The faster the response, the closer we are to the real timeDiff value
        // localTime = pingStartTime + roundTripDuration / 2
        // newTimeDiff = localTime - serverTime
        var newTimeDiff = (pingStartTime - serverTime) + (this.roundTripDuration / 2);

        // Initial setup
        if (this.initTimeDiff === 0) {
            this.timeDiff = newTimeDiff;
            this.initTimeDiff++
            return;
        }

        // As response time gets better, absolute value should decrease
        var distanceFromZero = Math.abs(newTimeDiff);
        var oldDistanceFromZero = Math.abs(this.timeDiff);
        if (distanceFromZero < oldDistanceFromZero) {
            this.timeDiff = newTimeDiff;
        }

        // Avoid overloading server
        if (this.initTimeDiff >= GreedyPingCount) {
            this.pingIntervalTimeout = PingIntervalTimeoutLowProfile;
        } else {
            this.initTimeDiff++;
        }

        // console.debug("Syncplay updateTimeDiff:", serverTime, this.timeDiff, this.roundTripDuration, newTimeDiff);
    }

    /**
     * Schedules a ping request to the server. Used to compute time difference between client and server.
     */
    requestPing () {
        if (this.pingInterval === null && !this.pingStop) {
            this.pingInterval = setTimeout(() => {
                this.pingInterval = null;

                var apiClient = connectionManager.currentApiClient();
                var sessionId = getActivePlayerId();

                var pingStartTime = new Date();
                apiClient.sendSyncplayCommand(sessionId, "GetUtcTime").then((response) => {
                    var pingEndTime = new Date();
                    response.text().then((utcTime) => {
                        var serverTime = new Date(utcTime);
                        this.updateTimeDiff(pingStartTime, pingEndTime, serverTime);

                        // Alert user that ping is high
                        if (Math.abs(this.roundTripDuration) >= 1000) {
                            events.trigger(this, "SyncplayError", [true]);
                        } else {
                            events.trigger(this, "SyncplayError", [false]);
                        }

                        // Notify server of ping
                        apiClient.sendSyncplayCommand(sessionId, "KeepAlive", {
                            Ping: this.roundTripDuration / 2
                        });

                        if (this.notifySyncplayReady) {
                            this.syncplayReady = true;
                            events.trigger(this, "SyncplayReady");
                            this.notifySyncplayReady = false;
                        }

                        this.requestPing();
                    });
                });

            }, this.pingIntervalTimeout);
        }
    }

    /**
     * Starts the keep alive poller.
     */
    startPing () {
        this.notifySyncplayReady = true;
        this.pingStop = false;
        this.initTimeDiff = this.initTimeDiff > this.greedyPingCount ? 1 : this.initTimeDiff;
        this.pingIntervalTimeout = this.pingIntervalTimeoutGreedy;

        this.requestPing();
    }

    /**
     * Stops the keep alive poller.
     */
    stopPing () {
        this.pingStop = true;
        if (this.pingInterval !== null) {
            clearTimeout(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Converts server time to local time.
     * @param {Date} server The time to convert.
     * @returns {Date} Local time.
     */
    serverDateToLocal (server) {
        // local - server = diff
        return new Date(server.getTime() + this.timeDiff);
    }

    /**
     * Converts local time to server time.
     * @param {Date} local The time to convert.
     * @returns {Date} Server time.
     */
    localDateToServer (local) {
        // local - server = diff
        return new Date(local.getTime() - this.timeDiff);
    }

    /**
     * Gets Syncplay status.
     * @returns {boolean} _true_ if user joined a group, _false_ otherwise.
     */
    isSyncplayEnabled () {
        return this.syncplayEnabledAt !== null ? true : false;
    }

    /**
     * Gets Syncplay stats.
     * @returns {Object} The Syncplay stats.
     */
    getStats () {
        return {
            TimeDiff: this.timeDiff,
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
}

/** SyncplayManager singleton. */
export default new SyncplayManager();
