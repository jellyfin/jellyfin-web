import appSettings from '../../scripts/settings/appSettings';
import * as userSettings from '../../scripts/settings/userSettings';
import { playbackManager } from '../../components/playback/playbackmanager';
import globalize from '../../lib/globalize';
import CastSenderApi from './castSenderApi';
import alert from '../../components/alert';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';
import { getItems } from '../../utils/jellyfin-apiclient/getItems.ts';

// Based on https://github.com/googlecast/CastVideos-chrome/blob/master/CastVideos.js

const PlayerName = 'Google Cast';

/*
 * Some async CastSDK function are completed with callbacks.
 * sendConnectionResult turns this into completion as a promise.
 */
let _currentResolve = null;
let _currentReject = null;
function sendConnectionResult(isOk) {
    const resolve = _currentResolve;
    const reject = _currentReject;

    _currentResolve = null;
    _currentReject = null;

    if (isOk) {
        if (resolve) {
            resolve();
        }
    } else if (reject) {
        reject();
    } else {
        playbackManager.removeActivePlayer(PlayerName);
    }
}

/**
 * Constants of states for Chromecast device
 **/
const DEVICE_STATE = {
    'IDLE': 0,
    'ACTIVE': 1,
    'WARNING': 2,
    'ERROR': 3
};

/**
 * Constants of states for CastPlayer
 **/
const PLAYER_STATE = {
    'IDLE': 'IDLE',
    'LOADING': 'LOADING',
    'LOADED': 'LOADED',
    'PLAYING': 'PLAYING',
    'PAUSED': 'PAUSED',
    'STOPPED': 'STOPPED',
    'SEEKING': 'SEEKING',
    'ERROR': 'ERROR'
};

const messageNamespace = 'urn:x-cast:com.connectsdk';

class CastPlayer {
    constructor() {
        /* device variables */
        // @type {DEVICE_STATE} A state for device
        this.deviceState = DEVICE_STATE.IDLE;

        /* Cast player variables */
        // @type {Object} a chrome.cast.media.Media object
        this.currentMediaSession = null;

        // @type {string} a chrome.cast.Session object
        this.session = null;
        // @type {PLAYER_STATE} A state for Cast media player
        this.castPlayerState = PLAYER_STATE.IDLE;

        this.hasReceivers = false;

        // bind once - commit 2ebffc2271da0bc5e8b13821586aee2a2e3c7753
        this.errorHandler = this.onError.bind(this);
        this.mediaStatusUpdateHandler = this.onMediaStatusUpdate.bind(this);

        this.initializeCastPlayer();
    }

    /**
     * Initialize Cast media player
     * Initializes the API. Note that either successCallback and errorCallback will be
     * invoked once the API has finished initialization. The sessionListener and
     * receiverListener may be invoked at any time afterwards, and possibly more than once.
     */
    initializeCastPlayer() {
        const chrome = window.chrome;
        if (!chrome) {
            console.warn('Not initializing chromecast: chrome object is missing');
            return;
        }

        if (!chrome.cast?.isAvailable) {
            setTimeout(this.initializeCastPlayer.bind(this), 1000);
            return;
        }

        const apiClient = ServerConnections.currentApiClient();
        const userId = apiClient.getCurrentUserId();

        apiClient.getUser(userId).then(user => {
            const applicationID = user.Configuration.CastReceiverId;
            if (!applicationID) {
                console.warn(`Not initializing chromecast: CastReceiverId is ${applicationID}`);
                return;
            }

            // request session
            const sessionRequest = new chrome.cast.SessionRequest(applicationID);
            const apiConfig = new chrome.cast.ApiConfig(sessionRequest,
                this.sessionListener.bind(this),
                this.receiverListener.bind(this));

            console.debug(`chromecast.initialize (applicationId=${applicationID})`);
            chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.errorHandler);
        });
    }

    /**
     * Callback function for init success
     */
    onInitSuccess() {
        this.isInitialized = true;
        console.debug('[chromecastPlayer] init success');
    }

    /**
     * Generic error callback function
     */
    onError() {
        console.debug('[chromecastPlayer] error');
    }

    /**
     * @param {!Object} e A new session
     * This handles auto-join when a page is reloaded
     * When active session is detected, playback will automatically
     * join existing session and occur in Cast mode and media
     * status gets synced up with current media of the session
     */
    sessionListener(e) {
        this.session = e;
        if (this.session) {
            if (this.session.media[0]) {
                this.onMediaDiscovered('activeSession', this.session.media[0]);
            }

            this.onSessionConnected(e);
        }
    }

    // messageListener - receive callback messages from the Cast receiver
    messageListener(namespace, message) {
        if (typeof (message) === 'string') {
            message = JSON.parse(message);
        }

        if (message.type === 'playbackerror') {
            const errorCode = message.data;
            setTimeout(() => {
                alertText(globalize.translate('MessagePlaybackError' + errorCode), globalize.translate('HeaderPlaybackError'));
            }, 300);
        } else if (message.type === 'connectionerror') {
            setTimeout(() => {
                alertText(globalize.translate('MessageChromecastConnectionError'), globalize.translate('HeaderError'));
            }, 300);
        } else if (message.type) {
            Events.trigger(this, message.type, [message.data]);
        }
    }

    /**
     * @param {string} e Receiver availability
     * This indicates availability of receivers but
     * does not provide a list of device IDs
     */
    receiverListener(e) {
        if (e === 'available') {
            console.debug('[chromecastPlayer] receiver found');
            this.hasReceivers = true;
        } else {
            console.debug('[chromecastPlayer] receiver list empty');
            this.hasReceivers = false;
        }
    }

    /**
     * session update listener
     */
    sessionUpdateListener(isAlive) {
        if (isAlive) {
            console.debug('[chromecastPlayer] sessionUpdateListener: already alive');
        } else {
            this.session = null;
            this.deviceState = DEVICE_STATE.IDLE;
            this.castPlayerState = PLAYER_STATE.IDLE;
            document.removeEventListener('volumeupbutton', onVolumeUpKeyDown, false);
            document.removeEventListener('volumedownbutton', onVolumeDownKeyDown, false);

            console.debug('[chromecastPlayer] sessionUpdateListener: setting currentMediaSession to null');
            this.currentMediaSession = null;

            sendConnectionResult(false);
        }
    }

    /**
     * Requests that a receiver application session be created or joined. By default, the SessionRequest
     * passed to the API at initialization time is used; this may be overridden by passing a different
     * session request in opt_sessionRequest.
     */
    launchApp() {
        console.debug('[chromecastPlayer] launching app...');
        chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this));
    }

    /**
     * Callback function for request session success
     * @param {Object} e A chrome.cast.Session object
     */
    onRequestSessionSuccess(e) {
        console.debug('[chromecastPlayer] session success: ' + e.sessionId);
        this.onSessionConnected(e);
    }

    onSessionConnected(session) {
        this.session = session;
        this.deviceState = DEVICE_STATE.ACTIVE;

        this.session.addMessageListener(messageNamespace, this.messageListener.bind(this));
        this.session.addMediaListener(this.sessionMediaListener.bind(this));
        this.session.addUpdateListener(this.sessionUpdateListener.bind(this));

        document.addEventListener('volumeupbutton', onVolumeUpKeyDown, false);
        document.addEventListener('volumedownbutton', onVolumeDownKeyDown, false);

        Events.trigger(this, 'connect');
        this.sendMessage({
            options: {},
            command: 'Identify'
        });
    }

    /**
     * session update listener
     */
    sessionMediaListener(e) {
        this.currentMediaSession = e;
        this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
    }

    /**
     * Callback function for launch error
     */
    onLaunchError() {
        console.debug('[chromecastPlayer] launch error');
        this.deviceState = DEVICE_STATE.ERROR;
        sendConnectionResult(false);
    }

    /**
     * Stops the running receiver application associated with the session.
     */
    stopApp() {
        if (this.session) {
            this.session.stop(this.onStopAppSuccess.bind(this, 'Session stopped'), this.errorHandler);
        }
    }

    /**
     * Callback function for stop app success
     */
    onStopAppSuccess(message) {
        console.debug(message);

        this.deviceState = DEVICE_STATE.IDLE;
        this.castPlayerState = PLAYER_STATE.IDLE;
        document.removeEventListener('volumeupbutton', onVolumeUpKeyDown, false);
        document.removeEventListener('volumedownbutton', onVolumeDownKeyDown, false);

        this.currentMediaSession = null;
    }

    /**
     * Loads media into a running receiver application
     * @param {Number} mediaIndex - An index number to indicate current media content
     * @returns Promise
     */
    loadMedia(options, command) {
        if (!this.session) {
            console.debug('[chromecastPlayer] no session');
            return Promise.reject(new Error('no session'));
        }

        // convert items to smaller stubs to send minimal amount of information
        options.items = options.items.map((i) => ({
                Id: i.Id,
                ServerId: i.ServerId,
                Name: i.Name,
                Type: i.Type,
                MediaType: i.MediaType,
                IsFolder: i.IsFolder
            }));

        return this.sendMessage({
            options: options,
            command: command
        });
    }

    sendMessage(message) {
        const player = this;

        let receiverName = null;

        const session = player.session;

        if (session?.receiver?.friendlyName) {
            receiverName = session.receiver.friendlyName;
        }

        let apiClient;
        if (message.options?.ServerId) {
            apiClient = ServerConnections.getApiClient(message.options.ServerId);
        } else if (message.options?.items?.length) {
            apiClient = ServerConnections.getApiClient(message.options.items[0].ServerId);
        } else {
            apiClient = ServerConnections.currentApiClient();
        }

        /* If serverAddress is localhost,this address can not be used for the cast receiver device.
         * Use the local address (ULA, Unique Local Address) in that case.
	 */
        const serverAddress = apiClient.serverAddress();
        // eslint-disable-next-line compat/compat
        const hostname = (new URL(serverAddress)).hostname;
        const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.') || hostname === '[::1]';
        const serverLocalAddress = isLocalhost ? apiClient.serverInfo().LocalAddress : serverAddress;

        message = Object.assign(message, {
            userId: apiClient.getCurrentUserId(),
            deviceId: apiClient.deviceId(),
            accessToken: apiClient.accessToken(),
            serverAddress: serverLocalAddress,
            serverId: apiClient.serverId(),
            serverVersion: apiClient.serverVersion(),
            receiverName: receiverName
        });

        console.debug('[chromecastPlayer] message{' + message.command + '; ' + serverAddress + ' -> ' + serverLocalAddress + '}');

        const bitrateSetting = appSettings.maxChromecastBitrate();
        if (bitrateSetting) {
            message.maxBitrate = bitrateSetting;
        }

        if (message.options?.items) {
            message.subtitleAppearance = userSettings.getSubtitleAppearanceSettings();
            message.subtitleBurnIn = appSettings.get('subtitleburnin') || '';
        }

        return player.sendMessageInternal(message);
    }

    sendMessageInternal(message) {
        message = JSON.stringify(message);

        this.session.sendMessage(messageNamespace, message, this.onPlayCommandSuccess.bind(this), this.errorHandler);
        return Promise.resolve();
    }

    onPlayCommandSuccess() {
        console.debug('Message was sent to receiver ok.');
    }

    /**
     * Callback function for loadMedia success
     * @param {Object} mediaSession A new media object.
     */
    onMediaDiscovered(how, mediaSession) {
        console.debug('[chromecastPlayer] new media session ID:' + mediaSession.mediaSessionId + ' (' + how + ')');
        this.currentMediaSession = mediaSession;

        if (how === 'loadMedia') {
            this.castPlayerState = PLAYER_STATE.PLAYING;
        }

        if (how === 'activeSession') {
            this.castPlayerState = mediaSession.playerState;
        }

        this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
    }

    /**
     * Callback function for media status update from receiver
     * @param {!Boolean} e true/false
     */
    onMediaStatusUpdate(e) {
        console.debug('[chromecastPlayer] updating media: ' + e);
        if (e === false) {
            this.castPlayerState = PLAYER_STATE.IDLE;
        }
    }

    /**
     * Set media volume in Cast mode
     * @param {Boolean} mute A boolean
     */
    setReceiverVolume(mute, vol) {
        if (!this.currentMediaSession) {
            console.debug('this.currentMediaSession is null');
            return;
        }

        if (!mute) {
            this.session.setReceiverVolumeLevel((vol || 1),
                this.mediaCommandSuccessCallback.bind(this),
                this.errorHandler);
        } else {
            this.session.setReceiverMuted(true,
                this.mediaCommandSuccessCallback.bind(this),
                this.errorHandler);
        }
    }

    /**
     * Mute CC
     */
    mute() {
        this.setReceiverVolume(true);
    }

    /**
     * Callback function for media command success
     */
    mediaCommandSuccessCallback(info) {
        console.debug(info);
    }
}

function alertText(text, title) {
    alert({
        text,
        title
    });
}

function onVolumeUpKeyDown() {
    playbackManager.volumeUp();
}

function onVolumeDownKeyDown() {
    playbackManager.volumeDown();
}

function normalizeImages(state) {
    if (state?.NowPlayingItem) {
        const item = state.NowPlayingItem;

        if ((!item.ImageTags?.Primary) && item.PrimaryImageTag) {
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
    }
}

function getItemsForPlayback(apiClient, query) {
    const userId = apiClient.getCurrentUserId();

    if (query.Ids && query.Ids.split(',').length === 1) {
        return apiClient.getItem(userId, query.Ids.split(',')).then((item) => ({
                Items: [item],
                TotalRecordCount: 1
            }));
    } else {
        query.Limit = query.Limit || 100;
        query.ExcludeLocationTypes = 'Virtual';
        query.EnableTotalRecordCount = false;

        return getItems(apiClient, userId, query);
    }
}

/*
 * relay castPlayer events to ChromecastPlayer events and include state info
 */
function bindEventForRelay(instance, eventName) {
    Events.on(instance._castPlayer, eventName, (e, data) => {
        console.debug('[chromecastPlayer] ' + eventName);
        // skip events without data
        if (data?.ItemId) {
            const state = instance.getPlayerStateInternal(data);
            Events.trigger(instance, eventName, [state]);
        }
    });
}

function initializeChromecast() {
    const instance = this;
    instance._castPlayer = new CastPlayer();

    // To allow the native android app to override
    document.dispatchEvent(new CustomEvent('chromecastloaded', {
        detail: {
            player: instance
        }
    }));

    Events.on(instance._castPlayer, 'connect', () => {
        if (_currentResolve) {
            sendConnectionResult(true);
        } else {
            playbackManager.setActivePlayer(PlayerName, instance.getCurrentTargetInfo());
        }

        console.debug('[chromecastPlayer] connect');
        // Reset this so that statechange will fire
        instance.lastPlayerData = null;
    });

    Events.on(instance._castPlayer, 'playbackstart', (e, data) => {
        console.debug('[chromecastPlayer] playbackstart');

        instance._castPlayer.initializeCastPlayer();

        const state = instance.getPlayerStateInternal(data);
        Events.trigger(instance, 'playbackstart', [state]);

        // be prepared that after this media item a next one may follow. See playbackManager
        instance._playNextAfterEnded = true;
    });

    Events.on(instance._castPlayer, 'playbackstop', (e, data) => {
        console.debug('[chromecastPlayer] playbackstop');

        let state = instance.getPlayerStateInternal(data);

        if (!instance._playNextAfterEnded) {
            // mark that no next media items are to be processed.
            state.nextItem = null;
            state.NextMediaType = null;
        }
        Events.trigger(instance, 'playbackstop', [state]);

        state = instance.lastPlayerData.PlayState || {};
        const volume = state.VolumeLevel || 0.5;
        const mute = state.IsMuted || false;

        // Reset this so the next query doesn't make it appear like content is playing.
        instance.lastPlayerData = {
            PlayState: {
                VolumeLevel: volume,
                IsMuted: mute
            }
        };
    });

    Events.on(instance._castPlayer, 'playbackprogress', (e, data) => {
        console.debug('[chromecastPlayer] positionchange');
        const state = instance.getPlayerStateInternal(data);

        Events.trigger(instance, 'timeupdate', [state]);
    });

    bindEventForRelay(instance, 'timeupdate');
    bindEventForRelay(instance, 'pause');
    bindEventForRelay(instance, 'unpause');
    bindEventForRelay(instance, 'volumechange');
    bindEventForRelay(instance, 'repeatmodechange');
    bindEventForRelay(instance, 'shufflequeuemodechange');

    Events.on(instance._castPlayer, 'playstatechange', (e, data) => {
        console.debug('[chromecastPlayer] playstatechange');

        // Updates the player and nowPlayingBar state to the current 'pause' state.
        const state = instance.getPlayerStateInternal(data);
        Events.trigger(instance, 'pause', [state]);
    });
}

class ChromecastPlayer {
    constructor() {
        // playbackManager needs this
        this.name = PlayerName;
        this.type = PluginType.MediaPlayer;
        this.id = 'chromecast';
        this.isLocalPlayer = false;
        this.lastPlayerData = {};

        new CastSenderApi().load().then(() => {
            Events.on(ServerConnections, 'localusersignedin', () => {
                initializeChromecast.call(this);
            });

            if (ServerConnections.currentUserId) {
                initializeChromecast.call(this);
            }
        });
    }

    /*
     * Cast button handling: select and connect to chromecast receiver
     */
    tryPair() {
        const castPlayer = this._castPlayer;

        if (castPlayer.deviceState !== DEVICE_STATE.ACTIVE && castPlayer.isInitialized) {
            return new Promise((resolve, reject) => {
                _currentResolve = resolve;
                _currentReject = reject;
                castPlayer.launchApp();
            });
        } else {
            _currentResolve = null;
            _currentReject = null;
            return Promise.reject(new Error('tryPair failed'));
        }
    }

    getTargets() {
        const targets = [];

        if (this._castPlayer?.hasReceivers) {
            targets.push(this.getCurrentTargetInfo());
        }

        return Promise.resolve(targets);
    }

    // This is a privately used method
    getCurrentTargetInfo() {
        let appName = null;

        const castPlayer = this._castPlayer;

        if (castPlayer.session?.receiver?.friendlyName) {
            appName = castPlayer.session.receiver.friendlyName;
        }

        return {
            name: PlayerName,
            id: PlayerName,
            playerName: PlayerName,
            playableMediaTypes: ['Audio', 'Video'],
            isLocalPlayer: false,
            appName: PlayerName,
            deviceName: appName,
            deviceType: 'cast',
            supportedCommands: [
                'VolumeUp',
                'VolumeDown',
                'Mute',
                'Unmute',
                'ToggleMute',
                'SetVolume',
                'SetAudioStreamIndex',
                'SetSubtitleStreamIndex',
                'DisplayContent',
                'SetRepeatMode'
            ]
        };
    }

    getPlayerStateInternal(data) {
        let triggerStateChange = false;
        if (data && !this.lastPlayerData) {
            triggerStateChange = true;
        }

        data = data || this.lastPlayerData;
        this.lastPlayerData = data;

        normalizeImages(data);

        if (triggerStateChange) {
            Events.trigger(this, 'statechange', [data]);
        }

        return data;
    }

    playWithCommand(options, command) {
        if (!options.items) {
            const apiClient = ServerConnections.getApiClient(options.serverId);
            const instance = this;

            return apiClient.getItem(apiClient.getCurrentUserId(), options.ids[0]).then((item) => {
                options.items = [item];
                return instance.playWithCommand(options, command);
            });
        }

        if (options.items.length > 1 && options?.ids) {
            // Use the original request id array for sorting the result in the proper order
            options.items.sort((a, b) => options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id));
        }

        return this._castPlayer.loadMedia(options, command);
    }

    seek(position) {
        position = parseInt(position, 10);

        position = position / 10000000;

        this._castPlayer.sendMessage({
            options: {
                position: position
            },
            command: 'Seek'
        });
    }

    setAudioStreamIndex(index) {
        this._castPlayer.sendMessage({
            options: {
                index: index
            },
            command: 'SetAudioStreamIndex'
        });
    }

    setSubtitleStreamIndex(index) {
        this._castPlayer.sendMessage({
            options: {
                index: index
            },
            command: 'SetSubtitleStreamIndex'
        });
    }

    setMaxStreamingBitrate(options) {
        this._castPlayer.sendMessage({
            options: options,
            command: 'SetMaxStreamingBitrate'
        });
    }

    isFullscreen() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.IsFullscreen;
    }

    nextTrack() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'NextTrack'
        });
    }

    previousTrack() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'PreviousTrack'
        });
    }

    volumeDown() {
        let vol = this._castPlayer.session.receiver.volume.level;
        if (vol == null) {
            vol = 0.5;
        }
        vol -= 0.05;
        vol = Math.max(vol, 0);

        this._castPlayer.session.setReceiverVolumeLevel(vol);
    }

    endSession() {
        const instance = this;

        this.stop().then(() => {
            setTimeout(() => {
                instance._castPlayer.stopApp();
            }, 1000);
        });
    }

    volumeUp() {
        let vol = this._castPlayer.session.receiver.volume.level;
        if (vol == null) {
            vol = 0.5;
        }
        vol += 0.05;
        vol = Math.min(vol, 1);

        this._castPlayer.session.setReceiverVolumeLevel(vol);
    }

    setVolume(vol) {
        vol = Math.min(vol, 100);
        vol = Math.max(vol, 0);
        vol = vol / 100;

        this._castPlayer.session.setReceiverVolumeLevel(vol);
    }

    unpause() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'Unpause'
        });
    }

    playPause() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'PlayPause'
        });
    }

    pause() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'Pause'
        });
    }

    stop() {
        // suppress playing a next media item after this one. See playbackManager
        this._playNextAfterEnded = false;
        return this._castPlayer.sendMessage({
            options: {},
            command: 'Stop'
        });
    }

    displayContent(options) {
        this._castPlayer.sendMessage({
            options: options,
            command: 'DisplayContent'
        });
    }

    setMute(isMuted) {
        const castPlayer = this._castPlayer;

        if (isMuted) {
            castPlayer.sendMessage({
                options: {},
                command: 'Mute'
            });
        } else {
            castPlayer.sendMessage({
                options: {},
                command: 'Unmute'
            });
        }
    }

    getRepeatMode() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.RepeatMode;
    }

    getQueueShuffleMode() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.ShuffleMode;
    }

    playTrailers() {
        console.warn('[chromecastPlayer] Playing trailers is not supported.');
    }

    setRepeatMode(mode) {
        this._castPlayer.sendMessage({
            options: {
                RepeatMode: mode
            },
            command: 'SetRepeatMode'
        });
    }

    setQueueShuffleMode() {
        console.warn('[chromecastPlayer] Setting shuffle queue mode is not supported.');
    }

    toggleMute() {
        this._castPlayer.sendMessage({
            options: {},
            command: 'ToggleMute'
        });
    }

    audioTracks() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        const streams = state.MediaStreams || [];
        return streams.filter((s) => s.Type === 'Audio');
    }

    getAudioStreamIndex() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.AudioStreamIndex;
    }

    subtitleTracks() {
        let state = this.lastPlayerData || {};
        state = state.NowPlayingItem || {};
        const streams = state.MediaStreams || [];
        return streams.filter((s) => s.Type === 'Subtitle');
    }

    getSubtitleStreamIndex() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.SubtitleStreamIndex;
    }

    getMaxStreamingBitrate() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.MaxStreamingBitrate;
    }

    getVolume() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};

        return state.VolumeLevel == null ? 100 : state.VolumeLevel;
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

    getBufferedRanges() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};
        return state.BufferedRanges || [];
    }

    paused() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};

        return state.IsPaused;
    }

    isMuted() {
        let state = this.lastPlayerData || {};
        state = state.PlayState || {};

        return state.IsMuted;
    }

    shuffle(item) {
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        const userId = apiClient.getCurrentUserId();

        const instance = this;

        apiClient.getItem(userId, item.Id).then((fetchedItem) => {
            instance.playWithCommand({
                items: [fetchedItem]
            }, 'Shuffle');
        });
    }

    instantMix(item) {
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        const userId = apiClient.getCurrentUserId();

        const instance = this;

        apiClient.getItem(userId, item.Id).then((fetchedItem) => {
            instance.playWithCommand({
                items: [fetchedItem]
            }, 'InstantMix');
        });
    }

    canPlayMediaType(mediaType) {
        mediaType = (mediaType || '').toLowerCase();
        return mediaType === 'audio' || mediaType === 'video';
    }

    canQueueMediaType(mediaType) {
        return this.canPlayMediaType(mediaType);
    }

    queue(options) {
        this.playWithCommand(options, 'PlayLast');
    }

    queueNext(options) {
        this.playWithCommand(options, 'PlayNext');
    }

    /*
     * play
     * options.items[]: Id, IsFolder, MediaType, Name, ServerId, Type, ...
     */
    play(options) {
        if (options.items) {
            return this.playWithCommand(options, 'PlayNow');
        } else {
            if (!options.serverId) {
                throw new Error('serverId required!');
            }

            const instance = this;
            const apiClient = ServerConnections.getApiClient(options.serverId);

            return getItemsForPlayback(apiClient, {
                Ids: options.ids.join(',')
            }).then((result) => {
                options.items = result.Items;
                return instance.playWithCommand(options, 'PlayNow');
            });
        }
    }

    toggleFullscreen() {
        // not supported
    }

    beginPlayerUpdates() {
        // Setup polling here
    }

    endPlayerUpdates() {
        // Stop polling here
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

    getPlayerState() {
        return this.getPlayerStateInternal() || {};
    }

    getCurrentPlaylistIndex() {
        // tbd: update to support playlists and not only album with tracks
        return this.getPlayerStateInternal()?.NowPlayingItem?.IndexNumber;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clearQueue(currentTime) {
        // not supported yet
    }
}

export default ChromecastPlayer;
