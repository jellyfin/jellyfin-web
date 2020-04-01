define(['events', 'globalize', 'loading', 'connectionManager', 'playbackManager'], function (events, globalize, loading, connectionManager, playbackManager) {
    'use strict';

    function waitForEvent(emitter, eventType) {
        return new Promise(function (resolve) {
            var callback = function () {
                events.off(emitter, eventType, callback);
                resolve(arguments);
            };
            events.on(emitter, eventType, callback);
        });
    }

    function displaySyncplayUpdate(message) {
        require(['toast'], function (alert) {
            alert({
                title: message.Header,
                text: message.Text
            });
        });
    }

    function getActivePlayerId() {
        var info = playbackManager.getPlayerInfo();
        return info ? info.id : null;
    }

    function millisecondsToTicks(milliseconds) {
        return milliseconds * 10000;
    }

    function ticksToMilliseconds(ticks) {
        return ticks / 10000;
    }

    function SyncplayManager() {

        var self = this;

        function onPlayerChange() {
            bindToPlayer(playbackManager.getCurrentPlayer());
            events.trigger(self, "PlayerChange", [self.currentPlayer]);
        }

        function onPlayPauseStateChanged(e) {
            events.trigger(self, "PlayPauseStateChange", [self.currentPlayer]);
        }

        self.playbackRateSupported = false;
        self.syncEnabled = false;
        self.maxAcceptedDelaySpeedToSync = 50; // milliseconds
        self.maxAcceptedDelaySkipToSync = 300; // milliseconds
        self.syncMethodThreshold = 2000; // milliseconds
        self.speedUpToSyncTime = 1000; // milliseconds
        self.playbackDiffMillis = 0; // used for stats
        self.syncMethod = "None"; // used for stats

        function onTimeUpdate(e) {
            events.trigger(self, "TimeUpdate", [e]);

            if (self.lastCommand && self.lastCommand.Command === 'Play' && !self.isBuffering()) {
                var currentTime = new Date();
                var playAtTime = self.lastCommand.When;

                var state = playbackManager.getPlayerState().PlayState;
                // Estimate PositionTicks on server
                var ServerPositionTicks = self.lastCommand.PositionTicks + ((currentTime - playAtTime) - self.timeDiff) * 10000;
                // Measure delay that needs to be recovered
                // diff might be caused by the player internally starting the playback
                var diff = ServerPositionTicks - state.PositionTicks;
                var diffMillis = diff / 10000;

                self.playbackDiffMillis = diffMillis;

                // console.debug("Syncplay onTimeUpdate", diffMillis, state.PositionTicks, ServerPositionTicks);

                if (self.syncEnabled) {
                    var absDiffMillis = Math.abs(diffMillis);
                    // TODO: SpeedToSync sounds bad on songs
                    if (self.playbackRateSupported && absDiffMillis > self.maxAcceptedDelaySpeedToSync && absDiffMillis < self.syncMethodThreshold) {
                        // SpeedToSync method
                        var speed = 1 + diffMillis / self.speedUpToSyncTime;

                        self.currentPlayer.setPlaybackRate(speed);
                        self.syncEnabled = false;
                        self.showSyncIcon("SpeedToSync (x" + speed + ")");

                        self.syncTimeout = setTimeout(() => {
                            self.currentPlayer.setPlaybackRate(1);
                            self.syncEnabled = true;
                            self.clearSyncIcon();
                        }, self.speedUpToSyncTime);
                    } else if (absDiffMillis > self.maxAcceptedDelaySkipToSync) {
                        // SkipToSync method
                        playbackManager.syncplay_seek(ServerPositionTicks);
                        self.syncEnabled = false;
                        self.showSyncIcon("SkipToSync");

                        self.syncTimeout = setTimeout(() => {
                            self.syncEnabled = true;
                            self.clearSyncIcon();
                        }, self.syncMethodThreshold / 2);
                    }
                }
            }
        }

        self.lastPlaybackWaiting = null; // used to determine if player's buffering
        self.minBufferingThresholdMillis = 1000;

        // TODO: implement group wait
        function onPlaying() {
            self.lastPlaybackWaiting = null;
            events.trigger(self, "PlayerPlaying");
        }

        // TODO: implement group wait
        function onWaiting() {
            if (!self.lastPlaybackWaiting) {
                self.lastPlaybackWaiting = new Date();
            }
            events.trigger(self, "PlayerWaiting");
        }

        self.isBuffering = function () {
            if (self.lastPlaybackWaiting === null) return false;
            return (new Date() - self.lastPlaybackWaiting) > self.minBufferingThresholdMillis;
        };

        function bindToPlayer(player) {
            if (player !== self.currentPlayer) {
                releaseCurrentPlayer();
                self.currentPlayer = player;
                if (!player) return;
            }
            events.on(player, "pause", onPlayPauseStateChanged);
            events.on(player, "unpause", onPlayPauseStateChanged);
            events.on(player, "timeupdate", onTimeUpdate);
            events.on(player, "playing", onPlaying);
            events.on(player, "waiting", onWaiting);
            self.playbackRateSupported = player.supports("PlaybackRate");
        }

        function releaseCurrentPlayer() {
            var player = self.currentPlayer;
            if (player) {
                events.off(player, "pause", onPlayPauseStateChanged);
                events.off(player, "unpause", onPlayPauseStateChanged);
                events.off(player, "timeupdate", onTimeUpdate);
                events.off(player, "playing", onPlaying);
                events.off(player, "waiting", onWaiting);
                if (self.playbackRateSupported) {
                    player.setPlaybackRate(1);
                }
                self.currentPlayer = null;
                self.playbackRateSupported = false;
            }
        }

        self.currentPlayer = null;

        events.on(playbackManager, "playerchange", onPlayerChange);
        bindToPlayer(playbackManager.getCurrentPlayer());

        self.syncplayEnabledAt = null; // Server time of when Syncplay has been enabled
        self.syncplayReady = false; // Syncplay is ready after first ping to server

        self.processGroupUpdate = function (cmd, apiClient) {
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
                    }).then(function () {
                        waitForEvent(self, "PlayerChange").then(function () {
                            playbackManager.pause();
                            var sessionId = getActivePlayerId();
                            if (!sessionId) {
                                console.error("Missing sessionId!");
                                displaySyncplayUpdate({
                                    Text: "Failed to enable Syncplay!"
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
                    displaySyncplayUpdate({
                        Text: globalize.translate('MessageSyncplayUserJoined', cmd.Data)
                    });
                    break;
                case 'UserLeft':
                    displaySyncplayUpdate({
                        Text: globalize.translate('MessageSyncplayUserLeft', cmd.Data)
                    });
                    break;
                case 'GroupJoined':
                    displaySyncplayUpdate({
                        Text: globalize.translate('MessageSyncplayEnabled')
                    });
                    // Enable Syncplay
                    self.syncplayEnabledAt = new Date(cmd.Data);
                    self.syncplayReady = false;
                    events.trigger(self, "SyncplayEnabled", [true]);
                    waitForEvent(self, "SyncplayReady").then(function () {
                        self.processCommand(self.queuedCommand, apiClient);
                        self.queuedCommand = null;
                    });
                    self.injectPlaybackManager();
                    self.startPing();
                    break;
                case 'NotInGroup':
                case 'GroupLeft':
                    displaySyncplayUpdate({
                        Text: globalize.translate('MessageSyncplayDisabled')
                    });
                    // Disable Syncplay
                    self.syncplayEnabledAt = null;
                    self.syncplayReady = false;
                    events.trigger(self, "SyncplayEnabled", [false]);
                    self.restorePlaybackManager();
                    self.stopPing();
                    break;
                case 'GroupWait':
                    displaySyncplayUpdate({
                        Text: globalize.translate('MessageSyncplayGroupWait', cmd.Data)
                    });
                    break;
                case 'KeepAlive':
                    break;
                default:
                    console.error('processSyncplayGroupUpdate does not recognize: ' + cmd.Type);
                    break;
            }
        };

        self.lastCommand = null;
        self.queuedCommand = null;

        self.processCommand = function (cmd, apiClient) {
            if (cmd === null) return;

            if (!self.isSyncplayEnabled()) {
                console.debug("Syncplay processCommand: ignoring command", cmd);
                return;
            }

            if (!self.syncplayReady) {
                console.debug("Syncplay processCommand: queued command", cmd);
                self.queuedCommand = cmd;
                return;
            }

            cmd.When = new Date(cmd.When);

            if (cmd.When < self.syncplayEnabledAt) {
                console.debug("Syncplay processCommand: ignoring old command", cmd);
                return;
            }

            // Check if new command differs from last one
            if (self.lastCommand &&
                self.lastCommand.When === cmd.When &&
                self.lastCommand.PositionTicks === cmd.PositionTicks &&
                self.Command === cmd.Command
            ) {
                console.debug("Syncplay processCommand: ignoring duplicate command", cmd);
                return;
            }

            self.lastCommand = cmd;
            console.log("Syncplay will", cmd.Command, "at", cmd.When, "PositionTicks", cmd.PositionTicks);

            switch (cmd.Command) {
                case 'Play':
                    self.schedulePlay(cmd.When, cmd.PositionTicks);
                    break;
                case 'Pause':
                    self.schedulePause(cmd.When, cmd.PositionTicks);
                    break;
                case 'Seek':
                    self.scheduleSeek(cmd.When, cmd.PositionTicks);
                    break;
                default:
                    console.error('processSyncplayCommand does not recognize: ' + cmd.Type);
                    break;
            }
        };

        self.scheduledCommand = null;
        self.syncTimeout = null;

        self.schedulePlay = function (playAtTime, positionTicks) {
            self.clearScheduledCommand();
            var currentTime = new Date();
            var playAtTimeLocal = self.serverDateToLocal(playAtTime);

            if (playAtTimeLocal > currentTime) {
                var playTimeout = (playAtTimeLocal - currentTime) - self.playerDelay;
                playbackManager.syncplay_seek(positionTicks);

                self.scheduledCommand = setTimeout(() => {
                    playbackManager.syncplay_unpause();

                    self.syncTimeout = setTimeout(() => {
                        self.syncEnabled = true
                    }, self.syncMethodThreshold / 2);

                }, playTimeout);

                // console.debug("Syncplay schedulePlay:", playTimeout);
            } else {
                // Group playback already started
                var serverPositionTicks = positionTicks + (currentTime - playAtTimeLocal) * 10000;
                playbackManager.syncplay_unpause();
                playbackManager.syncplay_seek(serverPositionTicks);

                self.syncTimeout = setTimeout(() => {
                    self.syncEnabled = true
                }, self.syncMethodThreshold / 2);
            }
        };

        self.schedulePause = function (pauseAtTime, positionTicks) {
            self.clearScheduledCommand();
            var currentTime = new Date();
            var pauseAtTimeLocal = self.serverDateToLocal(pauseAtTime);

            if (pauseAtTimeLocal > currentTime) {
                var pauseTimeout = (pauseAtTimeLocal - currentTime) - self.playerDelay;

                self.scheduledCommand = setTimeout(() => {
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
        };

        self.scheduleSeek = function (seekAtTime, positionTicks) {
            self.schedulePause(seekAtTime, positionTicks);
        };

        self.clearScheduledCommand = function () {
            clearTimeout(self.scheduledCommand);
            clearTimeout(self.syncTimeout);

            self.syncEnabled = false;
            if (self.currentPlayer) {
                self.currentPlayer.setPlaybackRate(1);
            }
            self.clearSyncIcon();
        };

        self.injectPlaybackManager = function () {
            if (!self.isSyncplayEnabled()) return;
            if (playbackManager.syncplayEnabled) return;

            playbackManager.syncplay_unpause = playbackManager.unpause;
            playbackManager.syncplay_pause = playbackManager.pause;
            playbackManager.syncplay_seek = playbackManager.seek;

            playbackManager.unpause = self.playRequest;
            playbackManager.pause = self.pauseRequest;
            playbackManager.seek = self.seekRequest;
            playbackManager.syncplayEnabled = true;
        };

        self.restorePlaybackManager = function () {
            if (self.isSyncplayEnabled()) return;
            if (!playbackManager.syncplayEnabled) return;

            playbackManager.unpause = playbackManager.syncplay_unpause;
            playbackManager.pause = playbackManager.syncplay_pause;
            playbackManager.seek = playbackManager.syncplay_seek;
            playbackManager.syncplayEnabled = false;
        };

        self.playRequest = function (player) {
            var apiClient = connectionManager.currentApiClient();
            var sessionId = getActivePlayerId();
            apiClient.sendSyncplayCommand(sessionId, "PlayRequest");
        };

        self.pauseRequest = function (player) {
            var apiClient = connectionManager.currentApiClient();
            var sessionId = getActivePlayerId();
            apiClient.sendSyncplayCommand(sessionId, "PauseRequest");
            // Pause locally as well, to give the user some little control
            playbackManager.syncplay_pause();
        };

        self.seekRequest = function (PositionTicks, player) {
            var apiClient = connectionManager.currentApiClient();
            var sessionId = getActivePlayerId();
            apiClient.sendSyncplayCommand(sessionId, "SeekRequest", {
                PositionTicks: PositionTicks
            });
        };

        self.pingIntervalTimeoutGreedy = 1000;
        self.pingIntervalTimeoutLowProfile = 60000;
        self.greedyPingCount = 3;

        self.pingStop = true;
        self.pingIntervalTimeout = self.pingIntervalTimeoutGreedy;
        self.pingInterval = null;
        self.initTimeDiff = 0; // number of pings
        self.timeDiff = 0; // local time minus server time
        self.roundTripDuration = 0;
        self.notifySyncplayReady = false;

        self.updateTimeDiff = function (pingStartTime, pingEndTime, serverTime) {
            self.roundTripDuration = (pingEndTime - pingStartTime);
            // The faster the response, the closer we are to the real timeDiff value
            // localTime = pingStartTime + roundTripDuration / 2
            // newTimeDiff = localTime - serverTime
            var newTimeDiff = (pingStartTime - serverTime) + (self.roundTripDuration / 2);

            // Initial setup
            if (self.initTimeDiff === 0) {
                self.timeDiff = newTimeDiff;
                self.initTimeDiff++
                return;
            }

            // As response time gets better, absolute value should decrease
            var distanceFromZero = Math.abs(newTimeDiff);
            var oldDistanceFromZero = Math.abs(self.timeDiff);
            if (distanceFromZero < oldDistanceFromZero) {
                self.timeDiff = newTimeDiff;
            }

            // Avoid overloading server
            if (self.initTimeDiff >= self.greedyPingCount) {
                self.pingIntervalTimeout = self.pingIntervalTimeoutLowProfile;
            } else {
                self.initTimeDiff++;
            }

            // console.debug("Syncplay updateTimeDiff:", serverTime, self.timeDiff, self.roundTripDuration, newTimeDiff);
        };

        self.requestPing = function () {
            if (self.pingInterval === null && !self.pingStop) {
                self.pingInterval = setTimeout(() => {
                    self.pingInterval = null;

                    var apiClient = connectionManager.currentApiClient();
                    var sessionId = getActivePlayerId();

                    var pingStartTime = new Date();
                    apiClient.sendSyncplayCommand(sessionId, "GetUtcTime").then(function (response) {
                        var pingEndTime = new Date();
                        response.text().then(function (utcTime) {
                            var serverTime = new Date(utcTime);
                            self.updateTimeDiff(pingStartTime, pingEndTime, serverTime);

                            // Alert user that ping is high
                            if (Math.abs(self.roundTripDuration) >= 1000) {
                                events.trigger(self, "SyncplayError", [true]);
                            } else {
                                events.trigger(self, "SyncplayError", [false]);
                            }

                            // Notify server of ping
                            apiClient.sendSyncplayCommand(sessionId, "KeepAlive", {
                                Ping: (self.roundTripDuration / 2) + self.playerDelay
                            });

                            if (self.notifySyncplayReady) {
                                self.syncplayReady = true;
                                events.trigger(self, "SyncplayReady");
                                self.notifySyncplayReady = false;
                            }

                            self.requestPing();
                        });
                    });

                }, self.pingIntervalTimeout);
            }
        };

        self.startPing = function () {
            self.notifySyncplayReady = true;
            self.pingStop = false;
            self.initTimeDiff = self.initTimeDiff > self.greedyPingCount ? 1 : self.initTimeDiff;
            self.pingIntervalTimeout = self.pingIntervalTimeoutGreedy;

            self.requestPing();
        };

        self.stopPing = function () {
            self.pingStop = true;
            if (self.pingInterval !== null) {
                clearTimeout(self.pingInterval);
                self.pingInterval = null;
            }
        };

        self.serverDateToLocal = function (server) {
            // local - server = diff
            return new Date(server.getTime() + self.timeDiff);
        };

        self.localDateToServer = function (local) {
            // local - server = diff
            return new Date(local.getTime() - self.timeDiff);
        };

        // THIS FEATURE IS CURRENTLY DISABLED
        // Mainly because SpeedToSync seems to do the job
        // Also because the delay is unreliable and different every time
        self.playerDelay = 0;
        self.playerDelayMeasured = true; // disable this feature
        self.measurePlayerDelay = function (positionTicks) {
            if (self.playerDelayMeasured) {
                playbackManager.syncplay_seek(positionTicks);
            } else {
                // Measure playerDelay by issuing a play command
                // followed by a pause command after one second
                // PositionTicks should be at 1 second minus two times the player delay
                loading.show();
                self.currentPlayer.setPlaybackRate(1);
                playbackManager.syncplay_seek(0);
                // Wait for player to seek
                setTimeout(() => {
                    playbackManager.syncplay_unpause();
                    // Play one second of media
                    setTimeout(() => {
                        playbackManager.syncplay_pause();
                        // Wait for state to get update
                        setTimeout(() => {
                            var state = playbackManager.getPlayerState().PlayState;
                            var delayTicks = millisecondsToTicks(1000) - state.PositionTicks;
                            var delayMillis = ticksToMilliseconds(delayTicks);
                            self.playerDelay = delayMillis / 2;
                            // Make sure delay is not negative
                            self.playerDelay = self.playerDelay > 0 ? self.playerDelay : 0;
                            self.playerDelayMeasured = true;
                            // console.debug("Syncplay PlayerDelay:", self.playerDelay);
                            // Restore player
                            setTimeout(() => {
                                playbackManager.syncplay_seek(positionTicks);
                                loading.hide();
                            }, 800);
                        }, 1000);
                    }, 1000);
                }, 2000);
            }
        };

        // Stats
        self.isSyncplayEnabled = function () {
            return self.syncplayEnabledAt !== null ? true : false;
        };

        self.getStats = function () {
            return {
                TimeDiff: self.timeDiff,
                PlaybackDiff: self.playbackDiffMillis,
                SyncMethod: self.syncMethod
            }
        };

        // UI
        self.showSyncIcon = function (syncMethod) {
            self.syncMethod = syncMethod;
            events.trigger(self, "SyncplayError", [true]);
        };

        self.clearSyncIcon = function () {
            self.syncMethod = "None";
            events.trigger(self, "SyncplayError", [false]);
        };
    }

    return new SyncplayManager();
});
