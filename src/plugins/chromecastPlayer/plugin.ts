import appSettings from '../../scripts/settings/appSettings';
import * as userSettings from '../../scripts/settings/userSettings';
import { playbackManager } from '../../components/playback/playbackmanager';
import globalize from '../../lib/globalize';
import CastSenderApi from './castSenderApi';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { getItems } from '../../utils/jellyfin-apiclient/getItems';
import { logger } from '../../utils/logger';

const PlayerName = 'Google Cast';

let _currentResolve: (() => void) | null = null;
let _currentReject: (() => void) | null = null;

function sendConnectionResult(isOk: boolean) {
    const resolve = _currentResolve;
    const reject = _currentReject;

    _currentResolve = null;
    _currentReject = null;

    if (isOk) {
        resolve?.();
    } else if (reject) {
        reject();
    } else {
        playbackManager.setActivePlayer(null);
    }
}

const DEVICE_STATE = {
    IDLE: 0,
    ACTIVE: 1,
    WARNING: 2,
    ERROR: 3
};

const PLAYER_STATE = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    LOADED: 'LOADED',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED',
    SEEKING: 'SEEKING',
    ERROR: 'ERROR'
};

const messageNamespace = 'urn:x-cast:com.connectsdk';

class CastPlayer {
    deviceState: number = DEVICE_STATE.IDLE;
    currentMediaSession: any = null;
    session: any = null;
    castPlayerState: string = PLAYER_STATE.IDLE;
    hasReceivers: boolean = false;
    isInitialized: boolean = false;

    private mediaStatusUpdateHandler: (e: any) => void;
    private errorHandler: () => void;

    constructor() {
        this.errorHandler = this.onError.bind(this);
        this.mediaStatusUpdateHandler = this.onMediaStatusUpdate.bind(this);
        this.initializeCastPlayer();
    }

    initializeCastPlayer() {
        const chrome = window.chrome;
        if (!chrome) {
            logger.warn('Not initializing chromecast: chrome object is missing', { component: 'ChromecastPlayer' });
            return;
        }

        if (!chrome.cast?.isAvailable) {
            setTimeout(this.initializeCastPlayer.bind(this), 1000);
            return;
        }

        const apiClient = ServerConnections.currentApiClient();
        if (!apiClient) return;
        const userId = apiClient.getCurrentUserId();

        apiClient.getUser(userId).then((user: any) => {
            const applicationID = user.Configuration.CastReceiverId;
            if (!applicationID) {
                logger.warn(`Not initializing chromecast: CastReceiverId is ${applicationID}`, {
                    component: 'ChromecastPlayer'
                });
                return;
            }

            const sessionRequest = new chrome.cast.SessionRequest(applicationID);
            const apiConfig = new chrome.cast.ApiConfig(
                sessionRequest,
                this.sessionListener.bind(this),
                this.receiverListener.bind(this)
            );

            logger.debug('chromecast.initialize', { component: 'ChromecastPlayer', applicationId: applicationID });
            chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.errorHandler);
        });
    }

    onInitSuccess() {
        this.isInitialized = true;
        logger.debug('ChromecastPlayer init success', { component: 'ChromecastPlayer' });
    }

    onError() {
        logger.debug('ChromecastPlayer error', { component: 'ChromecastPlayer' });
    }

    sessionListener(e: any) {
        this.session = e;
        if (this.session) {
            if (this.session.media[0]) {
                this.onMediaDiscovered('activeSession', this.session.media[0]);
            }
            this.onSessionConnected(e);
        }
    }

    messageListener(_namespace: string, message: any) {
        if (typeof message === 'string') {
            message = JSON.parse(message);
        }

        if (message.type === 'playbackerror') {
            const errorCode = message.data;
            logger.error(`Chromecast playback error: ${errorCode}`, { component: 'ChromecastPlayer' });
        } else if (message.type === 'connectionerror') {
            logger.error(`Chromecast connection error`, { component: 'ChromecastPlayer' });
        } else if (message.type) {
            Events.trigger(this, message.type, [message.data]);
        }
    }

    receiverListener(e: string) {
        if (e === 'available') {
            logger.debug('ChromecastPlayer receiver found', { component: 'ChromecastPlayer' });
            this.hasReceivers = true;
        } else {
            logger.debug('ChromecastPlayer receiver list empty', { component: 'ChromecastPlayer' });
            this.hasReceivers = false;
        }
    }

    sessionUpdateListener(isAlive: boolean) {
        if (isAlive) {
            logger.debug('ChromecastPlayer sessionUpdateListener: already alive', { component: 'ChromecastPlayer' });
        } else {
            this.session = null;
            this.deviceState = DEVICE_STATE.IDLE;
            this.castPlayerState = PLAYER_STATE.IDLE;
            this.currentMediaSession = null;
            sendConnectionResult(false);
        }
    }

    launchApp() {
        logger.debug('ChromecastPlayer launching app', { component: 'ChromecastPlayer' });
        window.chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this));
    }

    onRequestSessionSuccess(e: any) {
        logger.debug('ChromecastPlayer session success', { component: 'ChromecastPlayer', sessionId: e.sessionId });
        this.onSessionConnected(e);
    }

    onSessionConnected(session: any) {
        this.session = session;
        this.deviceState = DEVICE_STATE.ACTIVE;

        this.session.addMessageListener(messageNamespace, this.messageListener.bind(this));
        this.session.addMediaListener(this.sessionMediaListener.bind(this));
        this.session.addUpdateListener(this.sessionUpdateListener.bind(this));

        Events.trigger(this, 'connect');
        this.sendMessage({
            options: {},
            command: 'Identify'
        });
    }

    sessionMediaListener(e: any) {
        this.currentMediaSession = e;
        this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
    }

    onLaunchError() {
        logger.debug('ChromecastPlayer launch error', { component: 'ChromecastPlayer' });
        this.deviceState = DEVICE_STATE.ERROR;
        sendConnectionResult(false);
    }

    stopApp() {
        if (this.session) {
            this.session.stop(this.onStopAppSuccess.bind(this, 'Session stopped'), this.errorHandler);
        }
    }

    onStopAppSuccess(message: string) {
        logger.debug(message, { component: 'ChromecastPlayer' });
        this.deviceState = DEVICE_STATE.IDLE;
        this.castPlayerState = PLAYER_STATE.IDLE;
        this.currentMediaSession = null;
    }

    loadMedia(options: any, command: string) {
        if (!this.session) {
            return Promise.reject(new Error('no session'));
        }

        options.items = options.items.map((i: any) => ({
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

    sendMessage(message: any): Promise<void> {
        let receiverName = null;
        if (this.session?.receiver?.friendlyName) {
            receiverName = this.session.receiver.friendlyName;
        }

        let apiClient;
        if (message.options?.ServerId) {
            apiClient = ServerConnections.getApiClient(message.options.ServerId);
        } else if (message.options?.items?.length) {
            apiClient = ServerConnections.getApiClient(message.options.items[0].ServerId);
        } else {
            apiClient = ServerConnections.currentApiClient();
        }

        const serverAddress = apiClient.serverAddress();
        const hostname = new URL(serverAddress).hostname;
        const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.') || hostname === '[::1]';
        const serverLocalAddress = isLocalhost ? (apiClient as any).serverInfo().LocalAddress : serverAddress;

        message = {
            ...message,
            userId: apiClient.getCurrentUserId(),
            deviceId: apiClient.deviceId(),
            accessToken: apiClient.accessToken(),
            serverAddress: serverLocalAddress,
            serverId: apiClient.serverId(),
            serverVersion: apiClient.serverVersion(),
            receiverName: receiverName
        };

        const bitrateSetting = appSettings.maxChromecastBitrate();
        if (bitrateSetting) {
            message.maxBitrate = bitrateSetting;
        }

        if (message.options?.items) {
            message.subtitleAppearance = userSettings.getSubtitleAppearanceSettings();
            message.subtitleBurnIn = appSettings.get('subtitleburnin') || '';
        }

        return this.sendMessageInternal(message);
    }

    sendMessageInternal(message: any): Promise<void> {
        const payload = JSON.stringify(message);
        this.session.sendMessage(messageNamespace, payload, this.onPlayCommandSuccess.bind(this), this.errorHandler);
        return Promise.resolve();
    }

    onPlayCommandSuccess() {
        logger.debug('Message was sent to receiver', { component: 'ChromecastPlayer' });
    }

    onMediaDiscovered(how: string, mediaSession: any) {
        logger.debug('ChromecastPlayer new media session', {
            component: 'ChromecastPlayer',
            mediaSessionId: mediaSession.mediaSessionId,
            how
        });
        this.currentMediaSession = mediaSession;

        if (how === 'loadMedia') {
            this.castPlayerState = PLAYER_STATE.PLAYING;
        }

        if (how === 'activeSession') {
            this.castPlayerState = mediaSession.playerState;
        }

        this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler);
    }

    onMediaStatusUpdate(e: boolean) {
        if (e === false) {
            this.castPlayerState = PLAYER_STATE.IDLE;
        }
    }

    setReceiverVolume(mute: boolean, vol?: number) {
        if (!this.session) return;

        if (!mute) {
            this.session.setReceiverVolumeLevel(
                vol || 1,
                this.mediaCommandSuccessCallback.bind(this),
                this.errorHandler
            );
        } else {
            this.session.setReceiverMuted(true, this.mediaCommandSuccessCallback.bind(this), this.errorHandler);
        }
    }

    mediaCommandSuccessCallback(info: any) {
        logger.debug('Media command success', { component: 'ChromecastPlayer', info });
    }
}

function normalizeImages(state: any) {
    if (state?.NowPlayingItem) {
        const item = state.NowPlayingItem;
        if (!item.ImageTags?.Primary && item.PrimaryImageTag) {
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

class ChromecastPlayer {
    name: string = PlayerName;
    type: any = PluginType.MediaPlayer;
    id: string = 'chromecast';
    isLocalPlayer: boolean = false;
    lastPlayerData: any = {};
    private _castPlayer: CastPlayer | null = null;
    private _playNextAfterEnded: boolean = false;

    constructor() {
        new CastSenderApi().load().then(() => {
            Events.on(ServerConnections, 'localusersignedin', () => {
                this.initializeChromecast();
            });

            if ((ServerConnections as any).currentUserId) {
                this.initializeChromecast();
            }
        });
    }

    private initializeChromecast() {
        this._castPlayer = new CastPlayer();

        Events.on(this._castPlayer, 'connect', () => {
            if (_currentResolve) {
                sendConnectionResult(true);
            } else {
                playbackManager.setActivePlayer(PlayerName, this.getCurrentTargetInfo());
            }
            this.lastPlayerData = null;
        });

        Events.on(this._castPlayer, 'playbackstart', (_e: any, data: any) => {
            this._castPlayer?.initializeCastPlayer();
            const state = this.getPlayerStateInternal(data);
            Events.trigger(this, 'playbackstart', [state]);
            this._playNextAfterEnded = true;
        });

        Events.on(this._castPlayer, 'playbackstop', (_e: any, data: any) => {
            let state = this.getPlayerStateInternal(data);
            if (!this._playNextAfterEnded) {
                state.nextItem = null;
                state.NextMediaType = null;
            }
            Events.trigger(this, 'playbackstop', [state]);
            this.lastPlayerData = {
                PlayState: {
                    VolumeLevel: this.lastPlayerData?.PlayState?.VolumeLevel || 0.5,
                    IsMuted: this.lastPlayerData?.PlayState?.IsMuted || false
                }
            };
        });

        Events.on(this._castPlayer, 'playbackprogress', (_e: any, data: any) => {
            const state = this.getPlayerStateInternal(data);
            Events.trigger(this, 'timeupdate', [state]);
        });
    }

    tryPair() {
        if (this._castPlayer?.deviceState !== DEVICE_STATE.ACTIVE && this._castPlayer?.isInitialized) {
            return new Promise<void>((resolve, reject) => {
                _currentResolve = resolve;
                _currentReject = reject;
                this._castPlayer?.launchApp();
            });
        }
        return Promise.reject(new Error('tryPair failed'));
    }

    getTargets() {
        const targets = [];
        if (this._castPlayer?.hasReceivers) {
            targets.push(this.getCurrentTargetInfo());
        }
        return Promise.resolve(targets);
    }

    getCurrentTargetInfo() {
        let appName = null;
        if (this._castPlayer?.session?.receiver?.friendlyName) {
            appName = this._castPlayer.session.receiver.friendlyName;
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

    getPlayerStateInternal(data: any) {
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

    seek(position: number) {
        this._castPlayer?.sendMessage({
            options: { position: position / 10000000 },
            command: 'Seek'
        });
    }

    volumeUp() {
        let vol = this._castPlayer?.session?.receiver?.volume?.level ?? 0.5;
        this._castPlayer?.session?.setReceiverVolumeLevel(Math.min(vol + 0.05, 1));
    }

    volumeDown() {
        let vol = this._castPlayer?.session?.receiver?.volume?.level ?? 0.5;
        this._castPlayer?.session?.setReceiverVolumeLevel(Math.max(vol - 0.05, 0));
    }

    setVolume(vol: number) {
        this._castPlayer?.session?.setReceiverVolumeLevel(Math.min(Math.max(vol, 0), 100) / 100);
    }

    pause() {
        this._castPlayer?.sendMessage({ options: {}, command: 'Pause' });
    }
    unpause() {
        this._castPlayer?.sendMessage({ options: {}, command: 'Unpause' });
    }
    stop() {
        this._playNextAfterEnded = false;
        return this._castPlayer?.sendMessage({ options: {}, command: 'Stop' });
    }

    canPlayMediaType(mediaType: string) {
        const type = (mediaType || '').toLowerCase();
        return type === 'audio' || type === 'video';
    }

    play(options: any) {
        if (options.items) {
            return this.playWithCommand(options, 'PlayNow');
        } else {
            const apiClient = ServerConnections.getApiClient(options.serverId);
            return getItems(apiClient, apiClient.getCurrentUserId(), { Ids: options.ids.join(',') }).then(
                (result: any) => {
                    options.items = result.Items;
                    return this.playWithCommand(options, 'PlayNow');
                }
            );
        }
    }

    private playWithCommand(options: any, command: string): Promise<void> {
        if (options.items.length > 1 && options.ids) {
            options.items.sort((a: any, b: any) => options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id));
        }
        return this._castPlayer?.loadMedia(options, command);
    }

    currentTime(val?: number) {
        if (val != null) return this.seek(val * 10000);
        return (this.getPlayerStateInternal(null)?.PlayState?.PositionTicks || 0) / 10000;
    }

    duration() {
        return this.getPlayerStateInternal(null)?.NowPlayingItem?.RunTimeTicks || 0;
    }
}

export default ChromecastPlayer;
