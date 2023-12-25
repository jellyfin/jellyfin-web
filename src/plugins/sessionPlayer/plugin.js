import { playbackManager } from '../../components/playback/playbackmanager';
import serverNotifications from '../../scripts/serverNotifications';
import ServerConnections from '../../components/ServerConnections';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';

function getActivePlayerId() {
    const info = playbackManager.getPlayerInfo();
    return info ? info.id : null;
}

function sendPlayCommand(apiClient, options, playType) {
    const sessionId = getActivePlayerId();

    const ids = options.ids || options.items.map(function (i) {
        return i.Id;
    });

    const remoteOptions = {
        ItemIds: ids.join(','),

        PlayCommand: playType
    };

    if (options.startPositionTicks) {
        remoteOptions.StartPositionTicks = options.startPositionTicks;
    }

    if (options.mediaSourceId) {
        remoteOptions.MediaSourceId = options.mediaSourceId;
    }

    if (options.audioStreamIndex != null) {
        remoteOptions.AudioStreamIndex = options.audioStreamIndex;
    }

    if (options.subtitleStreamIndex != null) {
        remoteOptions.SubtitleStreamIndex = options.subtitleStreamIndex;
    }

    if (options.startIndex != null) {
        remoteOptions.StartIndex = options.startIndex;
    }

    return apiClient.sendPlayCommand(sessionId, remoteOptions);
}

function sendPlayStateCommand(apiClient, command, options) {
    const sessionId = getActivePlayerId();

    apiClient.sendPlayStateCommand(sessionId, command, options);
}

function getCurrentApiClient(instance) {
    const currentServerId = instance.currentServerId;

    if (currentServerId) {
        return ServerConnections.getApiClient(currentServerId);
    }

    return ServerConnections.currentApiClient();
}

function sendCommandByName(instance, name, options) {
    const command = {
        Name: name
    };

    if (options) {
        command.Arguments = options;
    }

    instance.sendCommand(command);
}

function unsubscribeFromPlayerUpdates(instance) {
    instance.isUpdating = true;

    const apiClient = getCurrentApiClient(instance);
    apiClient.sendMessage('SessionsStop');
    if (instance.pollInterval) {
        clearInterval(instance.pollInterval);
        instance.pollInterval = null;
    }
}

function processUpdatedSessions(instance, sessions, apiClient) {
    const serverId = apiClient.serverId();

    sessions.forEach(s => {
        if (s.NowPlayingItem) {
            s.NowPlayingItem.ServerId = serverId;
        }
    });

    const currentTargetId = getActivePlayerId();

    const session = sessions.filter(function (s) {
        return s.Id === currentTargetId;
    })[0];

    if (session) {
        normalizeImages(session, apiClient);

        const eventNames = getChangedEvents(instance.lastPlayerData);
        instance.lastPlayerData = session;

        for (let i = 0, length = eventNames.length; i < length; i++) {
            Events.trigger(instance, eventNames[i], [session]);
        }
    } else {
        instance.lastPlayerData = session;

        playbackManager.setDefaultPlayerActive();
    }
}

function getChangedEvents(state1) {
    const names = [];

    if (!state1) {
        names.push('statechange');
        names.push('timeupdate');
        names.push('pause');

        return names;
    }

    // TODO: Trim these down to prevent the UI from over-refreshing
    names.push('statechange');
    names.push('timeupdate');
    names.push('pause');

    return names;
}

function onPollIntervalFired() {
    const instance = this;
    const apiClient = getCurrentApiClient(instance);
    if (!apiClient.isMessageChannelOpen()) {
        apiClient.getSessions().then(function (sessions) {
            processUpdatedSessions(instance, sessions, apiClient);
        });
    }
}

function subscribeToPlayerUpdates(instance) {
    instance.isUpdating = true;

    const apiClient = getCurrentApiClient(instance);
    apiClient.sendMessage('SessionsStart', '100,800');
    if (instance.pollInterval) {
        clearInterval(instance.pollInterval);
        instance.pollInterval = null;
    }
    instance.pollInterval = setInterval(onPollIntervalFired.bind(instance), 5000);
}

function normalizeImages(state, apiClient) {
    if (state?.NowPlayingItem) {
        const item = state.NowPlayingItem;

        if (!item.ImageTags || !item.ImageTags.Primary && item.PrimaryImageTag) {
            item.ImageTags = item.ImageTags || {};
            item.ImageTags.Primary = item.PrimaryImageTag;
        }
        if (item.BackdropImageTag && item.BackdropItemId === item.Id) {
            item.BackdropImageTags = [item.BackdropImageTag];
        }
        if (item.BackdropImageTag && item.BackdropItemId !== item.Id) {
            item.ParentBackdropImageTags = [item.BackdropImageTag];
            item.ParentBackdropItemId = item.BackdropItemId;
        }
        if (!item.ServerId) {
            item.ServerId = apiClient.serverId();
        }
    }
}

class SessionPlayer {
    constructor() {
        const self = this;

        this.name = 'Remote Control';
        this.type = PluginType.MediaPlayer;
        this.isLocalPlayer = false;
        this.id = 'remoteplayer';

        Events.on(serverNotifications, 'Sessions', function (e, apiClient, data) {
            processUpdatedSessions(self, data, apiClient);
        });
    }

    beginPlayerUpdates() {
        this.playerListenerCount = this.playerListenerCount || 0;

        if (this.playerListenerCount <= 0) {
            this.playerListenerCount = 0;

            subscribeToPlayerUpdates(this);
        }

        this.playerListenerCount++;
    }

    endPlayerUpdates() {
        this.playerListenerCount = this.playerListenerCount || 0;
        this.playerListenerCount--;

        if (this.playerListenerCount <= 0) {
            unsubscribeFromPlayerUpdates(this);
            this.playerListenerCount = 0;
        }
    }

    getPlayerState() {
        return this.lastPlayerData || {};
    }

    getTargets() {
        const apiClient = getCurrentApiClient(this);

        const sessionQuery = {
            ControllableByUserId: apiClient.getCurrentUserId()
        };

        if (apiClient) {
            const name = this.name;

            return apiClient.getSessions(sessionQuery).then(function (sessions) {
                return sessions.filter(function (s) {
                    return s.DeviceId !== apiClient.deviceId();
                }).map(function (s) {
                    return {
                        name: s.DeviceName,
                        deviceName: s.DeviceName,
                        deviceType: s.DeviceType,
                        id: s.Id,
                        playerName: name,
                        appName: s.Client,
                        playableMediaTypes: s.PlayableMediaTypes,
                        isLocalPlayer: false,
                        supportedCommands: s.Capabilities.SupportedCommands,
                        user: s.UserId ? {
                            Id: s.UserId,
                            Name: s.UserName,
                            PrimaryImageTag: s.UserPrimaryImageTag
                        } : null
                    };
                });
            });
        } else {
            return Promise.resolve([]);
        }
    }

    sendCommand(command) {
        const sessionId = getActivePlayerId();

        const apiClient = getCurrentApiClient(this);
        apiClient.sendCommand(sessionId, command);
    }

    play(options) {
        options = Object.assign({}, options);

        if (options.items) {
            options.ids = options.items.map(function (i) {
                return i.Id;
            });

            options.items = null;
        }

        return sendPlayCommand(getCurrentApiClient(this), options, 'PlayNow');
    }

    shuffle(item) {
        sendPlayCommand(getCurrentApiClient(this), { ids: [item.Id] }, 'PlayShuffle');
    }

    instantMix(item) {
        sendPlayCommand(getCurrentApiClient(this), { ids: [item.Id] }, 'PlayInstantMix');
    }

    queue(options) {
        sendPlayCommand(getCurrentApiClient(this), options, 'PlayLast');
    }

    queueNext(options) {
        sendPlayCommand(getCurrentApiClient(this), options, 'PlayNext');
    }

    canPlayMediaType(mediaType) {
        mediaType = (mediaType || '').toLowerCase();
        return mediaType === 'audio' || mediaType === 'video';
    }

    canQueueMediaType(mediaType) {
        return this.canPlayMediaType(mediaType);
    }

    stop() {
        sendPlayStateCommand(getCurrentApiClient(this), 'stop');
    }

    nextTrack() {
        sendPlayStateCommand(getCurrentApiClient(this), 'nextTrack');
    }

    previousTrack() {
        sendPlayStateCommand(getCurrentApiClient(this), 'previousTrack');
    }

    seek(positionTicks) {
        sendPlayStateCommand(getCurrentApiClient(this), 'seek',
            {
                SeekPositionTicks: positionTicks
            });
    }

    currentTime(val) {
        if (val != null) {
            return this.seek(val * 10000);
        }

        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.PositionTicks / 10000;
    }

    duration() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        return state.RunTimeTicks;
    }

    paused() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.IsPaused;
    }

    getVolume() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.VolumeLevel;
    }

    isMuted() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.IsMuted;
    }

    pause() {
        sendPlayStateCommand(getCurrentApiClient(this), 'Pause');
    }

    unpause() {
        sendPlayStateCommand(getCurrentApiClient(this), 'Unpause');
    }

    playPause() {
        sendPlayStateCommand(getCurrentApiClient(this), 'PlayPause');
    }

    setMute(isMuted) {
        if (isMuted) {
            sendCommandByName(this, 'Mute');
        } else {
            sendCommandByName(this, 'Unmute');
        }
    }

    toggleMute() {
        sendCommandByName(this, 'ToggleMute');
    }

    setVolume(vol) {
        sendCommandByName(this, 'SetVolume', {
            Volume: vol
        });
    }

    volumeUp() {
        sendCommandByName(this, 'VolumeUp');
    }

    volumeDown() {
        sendCommandByName(this, 'VolumeDown');
    }

    toggleFullscreen() {
        sendCommandByName(this, 'ToggleFullscreen');
    }

    audioTracks() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        const streams = state.MediaStreams || [];
        return streams.filter(function (s) {
            return s.Type === 'Audio';
        });
    }

    getAudioStreamIndex() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.AudioStreamIndex;
    }

    playTrailers(item) {
        sendCommandByName(this, 'PlayTrailers', {
            ItemId: item.Id
        });
    }

    setAudioStreamIndex(index) {
        sendCommandByName(this, 'SetAudioStreamIndex', {
            Index: index
        });
    }

    subtitleTracks() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        const streams = state.MediaStreams || [];
        return streams.filter(function (s) {
            return s.Type === 'Subtitle';
        });
    }

    getSubtitleStreamIndex() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.SubtitleStreamIndex;
    }

    setSubtitleStreamIndex(index) {
        sendCommandByName(this, 'SetSubtitleStreamIndex', {
            Index: index
        });
    }

    setRepeatMode(mode) {
        sendCommandByName(this, 'SetRepeatMode', {
            RepeatMode: mode
        });
    }

    getRepeatMode() {
        // not supported?
    }

    setQueueShuffleMode(mode) {
        sendCommandByName(this, 'SetShuffleQueue', {
            ShuffleMode: mode
        });
    }

    getQueueShuffleMode() {
        // not supported?
    }

    displayContent(options) {
        sendCommandByName(this, 'DisplayContent', options);
    }

    isPlaying(mediaType) {
        const state = this.lastPlayerData || {};
        return state.NowPlayingItem != null && (state.NowPlayingItem.MediaType === mediaType || !mediaType);
    }

    isPlayingVideo() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        return state.MediaType === 'Video';
    }

    isPlayingAudio() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        return state.MediaType === 'Audio';
    }

    getPlaylist() {
        return Promise.resolve([]);
    }

    getCurrentPlaylistItemId() {
        // not supported?
    }

    setCurrentPlaylistItem() {
        return Promise.resolve();
    }

    removeFromPlaylist() {
        return Promise.resolve();
    }

    tryPair() {
        return Promise.resolve();
    }
}

export default SessionPlayer;
