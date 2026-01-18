import { PlaybackErrorCode } from '@jellyfin/sdk/lib/generated-client/models/playback-error-code.js';
import { merge } from '../../utils/lodashUtils';
import Screenfull from 'screenfull';
import Events from '../../utils/events';
import datetime from '../../scripts/datetime';
import appSettings from '../../scripts/settings/appSettings';
import itemHelper from '../itemHelper';
import { pluginManager } from '../pluginManager';
import PlayQueueManager from './playqueuemanager';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from 'lib/globalize';
import loading from '../loading/loading';
import { safeAppHost } from '../apphost';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import alert from '../alert';
import { PluginType } from '../../types/plugin';
import { includesAny } from '../../utils/container';
import { getItems } from '../../utils/jellyfin-apiclient/getItems';
import { getItemBackdropImageUrl } from '../../utils/jellyfin-apiclient/backdropImage';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { MediaError } from 'types/mediaError';
import { getMediaError } from 'utils/mediaError';
import { destroyWaveSurferInstance } from 'components/visualizer/lazyWaveSurfer';
import { hijackMediaElementForCrossfade, timeRunningOut, xDuration, getCrossfadeDuration, cancelCrossfadeTimeouts } from 'components/audioEngine/crossfader.logic';
import { PlayerEvent } from 'apps/stable/features/playback/constants/playerEvent';
import { bindMediaSegmentManager } from 'apps/stable/features/playback/utils/mediaSegmentManager';
import { bindMediaSessionSubscriber } from 'apps/stable/features/playback/utils/mediaSessionSubscriber';
import { bindSkipSegment } from './skipsegment';

const UNLIMITED_ITEMS = -1;

const supportsAppFeature = (feature) => {
    if (safeAppHost && typeof safeAppHost.supports === 'function') {
        return safeAppHost.supports(feature);
    }

    return false;
};

function enableLocalPlaylistManagement(player) {
    if (player.getPlaylist) {
        return false;
    }

    return player.isLocalPlayer;
}

function bindToFullscreenChange(player) {
    if (Screenfull.isEnabled) {
        Screenfull.on('change', function () {
            Events.trigger(player, 'fullscreenchange');
        });
    } else {
        // iOS Safari
        document.addEventListener('webkitfullscreenchange', function () {
            Events.trigger(player, 'fullscreenchange');
        }, false);
    }
}

function triggerPlayerChange(playbackManagerInstance, newPlayer, newTarget, previousPlayer, previousTargetInfo) {
    if (!newPlayer && !previousPlayer) {
        return;
    }

    if (newTarget && previousTargetInfo && newTarget.id === previousTargetInfo.id) {
        return;
    }

    Events.trigger(playbackManagerInstance, 'playerchange', [newPlayer, newTarget, previousPlayer]);
}

function reportPlayback(playbackManagerInstance, state, player, reportPlaylist, serverId, method, progressEventName) {
    if (!serverId) {
        // Not a server item
        // We can expand on this later and possibly report them
        Events.trigger(playbackManagerInstance, 'reportplayback', [false]);
        return;
    }

    const info = Object.assign({}, state.PlayState);
    info.ItemId = state.NowPlayingItem.Id;

    if (progressEventName) {
        info.EventName = progressEventName;
    }

    if (reportPlaylist) {
        addPlaylistToPlaybackReport(playbackManagerInstance, info, player, serverId);
    }

    const apiClient = ServerConnections.getApiClient(serverId);
    const endpoint = method === 'reportPlaybackProgress' ?
        'Sessions/Playing/Progress' :
        (method === 'reportPlaybackStopped' ? 'Sessions/Playing/Stopped' : 'Sessions/Playing');
    const reportPlaybackPromise = apiClient[method](info);
    reportPlaybackPromise.then(() => {
        Events.trigger(playbackManagerInstance, 'reportplayback', [true]);
    }).catch(() => {
        Events.trigger(playbackManagerInstance, 'reportplayback', [false]);
    });
}

function getPlaylistSync(playbackManagerInstance, player) {
    player = player || playbackManagerInstance._currentPlayer;
    if (player && !enableLocalPlaylistManagement(player)) {
        return player.getPlaylistSync();
    }

    return playbackManagerInstance._playQueueManager.getPlaylist();
}

function addPlaylistToPlaybackReport(playbackManagerInstance, info, player, serverId) {
    info.NowPlayingQueue = getPlaylistSync(playbackManagerInstance, player).map(function (i) {
        const itemInfo = {
            Id: i.Id,
            PlaylistItemId: i.PlaylistItemId
        };

        if (i.ServerId !== serverId) {
            itemInfo.ServerId = i.ServerId;
        }

        return itemInfo;
    });
}

function normalizeName(t) {
    return t.toLowerCase().replace(' ', '');
}

function getItemsForPlayback(serverId, query) {
    const apiClient = ServerConnections.getApiClient(serverId);

    if (query.Ids && query.Ids.split(',').length === 1) {
        const itemId = query.Ids.split(',');

        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
            return {
                Items: [item],
                TotalRecordCount: 1
            };
        });
    } else {
        if (query.Limit === UNLIMITED_ITEMS) {
            delete query.Limit;
        } else {
            query.Limit = query.Limit || 300;
        }
        query.Fields = ['Chapters', 'Trickplay'];
        query.ExcludeLocationTypes = 'Virtual';
        query.EnableTotalRecordCount = false;
        query.CollapseBoxSetItems = false;

        return getItems(apiClient, apiClient.getCurrentUserId(), query);
    }
}

function createStreamInfoFromUrlItem(item) {
    // Check item.Path for games
    return {
        url: item.Url || item.Path,
        playMethod: 'DirectPlay',
        item: item,
        textTracks: [],
        mediaType: item.MediaType
    };
}

function mergePlaybackQueries(obj1, obj2) {
    const query = merge({}, obj1, obj2);

    const filters = query.Filters ? query.Filters.split(',') : [];
    if (filters.indexOf('IsNotFolder') === -1) {
        filters.push('IsNotFolder');
    }
    query.Filters = filters.join(',');
    return query;
}

function getMimeType(type, container) {
    container = (container || '').toLowerCase();

    if (type === 'audio') {
        if (container === 'opus') {
            return 'audio/ogg';
        }
        if (container === 'webma') {
            return 'audio/webm';
        }
        if (container === 'm4a') {
            return 'audio/mp4';
        }
    } else if (type === 'video') {
        if (container === 'mkv') {
            return 'video/x-matroska';
        }
        if (container === 'm4v') {
            return 'video/mp4';
        }
        if (container === 'mov') {
            return 'video/quicktime';
        }
        if (container === 'mpg') {
            return 'video/mpeg';
        }
        if (container === 'flv') {
            return 'video/x-flv';
        }
    }

    return type + '/' + container;
}

function getParam(name, url) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regexS = '[\\?&]' + name + '=([^&#]*)';
    const regex = new RegExp(regexS, 'i');

    const results = regex.exec(url);
    if (results === null) {
        return '';
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}

function isAutomaticPlayer(player) {
    return player.isLocalPlayer;
}

function getAutomaticPlayers(instance, forceLocalPlayer) {
    if (!forceLocalPlayer) {
        const player = instance._currentPlayer;
        if (player && !isAutomaticPlayer(player)) {
            return [player];
        }
    }

    return instance.getPlayers().filter(isAutomaticPlayer);
}

function isServerItem(item) {
    return !!item.Id;
}

function enableIntros(item) {
    if (item.MediaType !== 'Video') {
        return false;
    }
    if (item.Type === 'TvChannel') {
        return false;
    }
    // disable for in-progress recordings
    if (item.Status === 'InProgress') {
        return false;
    }

    return isServerItem(item);
}

function getIntros(firstItem, apiClient, options) {
    if (options.startPositionTicks || options.startIndex || options.fullscreen === false || !enableIntros(firstItem) || !userSettings.enableCinemaMode()) {
        return Promise.resolve({
            Items: []
        });
    }

    return apiClient.getIntros(firstItem.Id).then(function (result) {
        return result;
    }, function () {
        return Promise.resolve({
            Items: []
        });
    });
}

function getAudioMaxValues(deviceProfile) {
    // TODO - this could vary per codec and should be done on the server using the entire profile
    let maxAudioSampleRate = null;
    let maxAudioBitDepth = null;
    let maxAudioBitrate = null;

    deviceProfile.CodecProfiles.forEach(codecProfile => {
        if (codecProfile.Type === 'Audio') {
            (codecProfile.Conditions || []).forEach(condition => {
                if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioBitDepth') {
                    maxAudioBitDepth = condition.Value;
                } else if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioSampleRate') {
                    maxAudioSampleRate = condition.Value;
                } else if (condition.Condition === 'LessThanEqual' && condition.Property === 'AudioBitrate') {
                    maxAudioBitrate = condition.Value;
                }
            });
        }
    });

    return {
        maxAudioSampleRate: maxAudioSampleRate,
        maxAudioBitDepth: maxAudioBitDepth,
        maxAudioBitrate: maxAudioBitrate
    };
}

let startingPlaySession = new Date().getTime();
const isLocalhostDev = () => {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }

    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

function getAudioStreamUrl(item, transcodingProfile, directPlayContainers, apiClient, startPosition, maxValues) {
    const url = 'Audio/' + item.Id + '/universal';
    startingPlaySession++;
    const streamUrl = apiClient.getUrl(url, {
        UserId: apiClient.getCurrentUserId(),
        DeviceId: apiClient.deviceId(),
        MaxStreamingBitrate: maxValues.maxAudioBitrate || maxValues.maxBitrate,
        Container: directPlayContainers,
        TranscodingContainer: transcodingProfile.Container || null,
        TranscodingProtocol: transcodingProfile.Protocol || null,
        AudioCodec: transcodingProfile.AudioCodec,
        MaxAudioSampleRate: maxValues.maxAudioSampleRate,
        MaxAudioBitDepth: maxValues.maxAudioBitDepth,
        api_key: apiClient.accessToken(),
        PlaySessionId: startingPlaySession,
        StartTimeTicks: startPosition || 0,
        EnableRedirection: true,
        EnableRemoteMedia: supportsAppFeature('remoteaudio') || isLocalhostDev()
    });

    return streamUrl;
}

function isCrossOriginServer(apiClient) {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }
    try {
        const probeUrl = apiClient?.getUrl ? apiClient.getUrl('System/Info/Public') : null;
        if (probeUrl && probeUrl.indexOf('://') !== -1) {
            return new URL(probeUrl).origin !== window.location.origin;
        }
        const serverAddress = apiClient?.serverAddress ? apiClient.serverAddress() : null;
        if (!serverAddress) {
            return false;
        }
        return new URL(serverAddress, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return false;
    }
}

function isCrossOriginRequestUrl(url) {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }
    try {
        return new URL(url, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return false;
    }
}

function getAudioStreamUrlFromDeviceProfile(item, deviceProfile, maxBitrate, apiClient, startPosition) {
    const audioProfiles = deviceProfile.TranscodingProfiles.filter(function (p) {
        return p.Type === 'Audio' && p.Context === 'Streaming';
    });
    let transcodingProfile = audioProfiles[0];
    if (isCrossOriginServer(apiClient)) {
        const nonHlsProfile = audioProfiles.find(p => p.Protocol !== 'hls');
        if (nonHlsProfile) {
            transcodingProfile = nonHlsProfile;
        }
    }

    let directPlayContainers = '';

    deviceProfile.DirectPlayProfiles.forEach(p => {
        if (p.Type === 'Audio') {
            if (directPlayContainers) {
                directPlayContainers += ',' + p.Container;
            } else {
                directPlayContainers = p.Container;
            }

            if (p.AudioCodec) {
                directPlayContainers += '|' + p.AudioCodec;
            }
        }
    });

    const maxValues = getAudioMaxValues(deviceProfile);

    return getAudioStreamUrl(item, transcodingProfile, directPlayContainers, apiClient, startPosition, { maxBitrate, ...maxValues });
}

function getStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition) {
    const audioTranscodingProfile = deviceProfile.TranscodingProfiles.filter(function (p) {
        return p.Type === 'Audio' && p.Context === 'Streaming';
    })[0];

    let audioDirectPlayContainers = '';

    deviceProfile.DirectPlayProfiles.forEach(p => {
        if (p.Type === 'Audio') {
            if (audioDirectPlayContainers) {
                audioDirectPlayContainers += ',' + p.Container;
            } else {
                audioDirectPlayContainers = p.Container;
            }

            if (p.AudioCodec) {
                audioDirectPlayContainers += '|' + p.AudioCodec;
            }
        }
    });

    const maxValues = getAudioMaxValues(deviceProfile);

    const streamUrls = [];

    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];
        let streamUrl;

        if (item.MediaType === 'Audio' && !itemHelper.isLocalItem(item)) {
            streamUrl = getAudioStreamUrl(item, audioTranscodingProfile, audioDirectPlayContainers, apiClient, startPosition, { maxBitrate, ...maxValues });
        }

        streamUrls.push(streamUrl || '');

        if (i === 0) {
            startPosition = 0;
        }
    }

    return Promise.resolve(streamUrls);
}

function setStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition) {
    return getStreamUrls(items, deviceProfile, maxBitrate, apiClient, startPosition).then(function (streamUrls) {
        for (let i = 0, length = items.length; i < length; i++) {
            const item = items[i];
            const streamUrl = streamUrls[i];

            if (streamUrl) {
                item.PresetMediaSource = {
                    StreamUrl: streamUrl,
                    Id: item.Id,
                    MediaStreams: [],
                    RunTimeTicks: item.RunTimeTicks
                };
            }
        }
    });
}

function getPlaybackInfo(player, apiClient, item, deviceProfile, mediaSourceId, liveStreamId, options) {
    if (!itemHelper.isLocalItem(item) && item.MediaType === 'Audio' && !player.useServerPlaybackInfoForAudio) {
        return Promise.resolve({
            MediaSources: [
                {
                    StreamUrl: getAudioStreamUrlFromDeviceProfile(item, deviceProfile, options.maxBitrate, apiClient, options.startPosition),
                    Id: item.Id,
                    MediaStreams: [],
                    RunTimeTicks: item.RunTimeTicks
                }]
        });
    }

    if (item.PresetMediaSource) {
        return Promise.resolve({
            MediaSources: [item.PresetMediaSource]
        });
    }

    const itemId = item.Id;

    const query = {
        UserId: apiClient.getCurrentUserId(),
        StartTimeTicks: options.startPosition || 0
    };

    if (options.isPlayback) {
        query.IsPlayback = true;
        query.AutoOpenLiveStream = true;
    } else {
        query.IsPlayback = false;
        query.AutoOpenLiveStream = false;
    }

    if (options.audioStreamIndex !== null) {
        query.AudioStreamIndex = options.audioStreamIndex;
    }
    if (options.subtitleStreamIndex !== null) {
        query.SubtitleStreamIndex = options.subtitleStreamIndex;
    }
    if (options.secondarySubtitleStreamIndex !== null) {
        query.SecondarySubtitleStreamIndex = options.secondarySubtitleStreamIndex;
    }
    if (options.enableDirectPlay !== null) {
        query.EnableDirectPlay = options.enableDirectPlay;
    }
    if (options.enableDirectStream !== null) {
        query.EnableDirectStream = options.enableDirectStream;
    }
    if (options.allowVideoStreamCopy !== null) {
        query.AllowVideoStreamCopy = options.allowVideoStreamCopy;
    }
    if (options.allowAudioStreamCopy !== null) {
        query.AllowAudioStreamCopy = options.allowAudioStreamCopy;
    }
    if (mediaSourceId) {
        query.MediaSourceId = mediaSourceId;
    }
    if (liveStreamId) {
        query.LiveStreamId = liveStreamId;
    }
    if (options.maxBitrate) {
        query.MaxStreamingBitrate = options.maxBitrate;
    }
    if (player.enableMediaProbe && !player.enableMediaProbe(item)) {
        query.EnableMediaProbe = false;
    }

    // lastly, enforce player overrides for special situations
    if (query.EnableDirectStream !== false
        && player.supportsPlayMethod && !player.supportsPlayMethod('DirectStream', item)
    ) {
        query.EnableDirectStream = false;
    }

    if (player.getDirectPlayProtocols) {
        query.DirectPlayProtocols = player.getDirectPlayProtocols();
    }

    return apiClient.getPlaybackInfo(itemId, query, deviceProfile);
}

function getOptimalMediaSource(apiClient, item, versions) {
    const promises = versions.map(function (v) {
        return supportsDirectPlay(apiClient, item, v);
    });

    if (!promises.length) {
        return Promise.reject();
    }

    return Promise.all(promises).then(function (results) {
        for (let i = 0, length = versions.length; i < length; i++) {
            versions[i].enableDirectPlay = results[i] || false;
        }
        let optimalVersion = versions.filter(function (v) {
            return v.enableDirectPlay;
        })[0];

        if (!optimalVersion) {
            optimalVersion = versions.filter(function (v) {
                return v.SupportsDirectStream;
            })[0];
        }

        optimalVersion = optimalVersion || versions.filter(function (s) {
            return s.SupportsTranscoding;
        })[0];

        return optimalVersion || versions[0];
    });
}

function getLiveStream(player, apiClient, item, playSessionId, deviceProfile, mediaSource, options) {
    const postData = {
        DeviceProfile: deviceProfile,
        OpenToken: mediaSource.OpenToken
    };

    const query = {
        UserId: apiClient.getCurrentUserId(),
        StartTimeTicks: options.startPosition || 0,
        ItemId: item.Id,
        PlaySessionId: playSessionId
    };

    if (options.maxBitrate) {
        query.MaxStreamingBitrate = options.maxBitrate;
    }
    if (options.audioStreamIndex !== null) {
        query.AudioStreamIndex = options.audioStreamIndex;
    }
    if (options.subtitleStreamIndex !== null) {
        query.SubtitleStreamIndex = options.subtitleStreamIndex;
    }

    // lastly, enforce player overrides for special situations
    if (query.EnableDirectStream !== false
        && player.supportsPlayMethod && !player.supportsPlayMethod('DirectStream', item)
    ) {
        query.EnableDirectStream = false;
    }

    return apiClient.ajax({
        url: apiClient.getUrl('LiveStreams/Open', query),
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        dataType: 'json'

    });
}

function isHostReachable(mediaSource, apiClient) {
    if (mediaSource.IsRemote) {
        return Promise.resolve(true);
    }

    return apiClient.getEndpointInfo().then(function (endpointInfo) {
        if (endpointInfo.IsInNetwork) {
            if (!endpointInfo.IsLocal) {
                const path = (mediaSource.Path || '').toLowerCase();
                if (path.indexOf('localhost') !== -1 || path.indexOf('127.0.0.1') !== -1) {
                    // This will only work if the app is on the same machine as the server
                    return Promise.resolve(false);
                }
            }

            return Promise.resolve(true);
        }

        // media source is in network, but connection is out of network
        return Promise.resolve(false);
    });
}

function supportsDirectPlay(apiClient, item, mediaSource) {
    // folder rip hacks due to not yet being supported by the stream building engine
    const isFolderRip = mediaSource.VideoType === 'BluRay' || mediaSource.VideoType === 'Dvd' || mediaSource.VideoType === 'HdDvd';

    if (mediaSource.SupportsDirectPlay || isFolderRip) {
        if (mediaSource.IsRemote && !supportsAppFeature('remotevideo')) {
            return Promise.resolve(false);
        }

        if (mediaSource.Protocol === 'Http' && !mediaSource.RequiredHttpHeaders.length) {
            // If this is the only way it can be played, then allow it
            if (!mediaSource.SupportsDirectStream && !mediaSource.SupportsTranscoding) {
                return Promise.resolve(true);
            } else {
                return isHostReachable(mediaSource, apiClient);
            }
        }
    }

    return Promise.resolve(false);
}

/**
 * @param {PlaybackManager} instance
 * @param {import('@jellyfin/sdk/lib/generated-client/index.js').PlaybackInfoResponse} result
 * @returns {boolean}
 */
function validatePlaybackInfoResult(instance, result) {
    if (result.ErrorCode) {
        // NOTE: To avoid needing to retranslate the "NoCompatibleStream" message,
        // we need to keep the key in the same format.
        const errMessage = result.ErrorCode === PlaybackErrorCode.NoCompatibleStream ?
            'PlaybackErrorNoCompatibleStream' : `PlaybackError.${result.ErrorCode}`;
        showPlaybackInfoErrorMessage(instance, errMessage);
        return false;
    }

    return true;
}

function showPlaybackInfoErrorMessage(instance, errorCode) {
    alert({
        text: globalize.translate(errorCode),
        title: globalize.translate('HeaderPlaybackError')
    });
}

function normalizePlayOptions(playOptions) {
    playOptions.fullscreen = playOptions.fullscreen !== false;
}

function truncatePlayOptions(playOptions) {
    return {
        fullscreen: playOptions.fullscreen,
        mediaSourceId: playOptions.mediaSourceId,
        audioStreamIndex: playOptions.audioStreamIndex,
        subtitleStreamIndex: playOptions.subtitleStreamIndex,
        startPositionTicks: playOptions.startPositionTicks
    };
}

function getNowPlayingItemForReporting(player, item, mediaSource) {
    const nowPlayingItem = Object.assign({}, item);

    if (mediaSource) {
        nowPlayingItem.RunTimeTicks = mediaSource.RunTimeTicks;
        nowPlayingItem.MediaStreams = mediaSource.MediaStreams;

        // not needed
        nowPlayingItem.MediaSources = null;
    }

    nowPlayingItem.RunTimeTicks = nowPlayingItem.RunTimeTicks || player.duration() * 10000;

    return nowPlayingItem;
}

function displayPlayerIndividually(player) {
    return !player.isLocalPlayer;
}

function createTarget(instance, player) {
    return {
        name: player.name,
        id: player.id,
        playerName: player.name,
        playableMediaTypes: ['Audio', 'Video', 'Photo', 'Book'].map(player.canPlayMediaType),
        isLocalPlayer: player.isLocalPlayer,
        supportedCommands: instance.getSupportedCommands(player)
    };
}

function getPlayerTargets(player) {
    if (player.getTargets) {
        return player.getTargets();
    }

    return Promise.resolve([createTarget(player)]);
}

function sortPlayerTargets(a, b) {
    let aVal = a.isLocalPlayer ? 0 : 1;
    let bVal = b.isLocalPlayer ? 0 : 1;

    aVal = aVal.toString() + a.name;
    bVal = bVal.toString() + b.name;

    return aVal.localeCompare(bVal);
}

export class PlaybackManager {
    constructor() {
        const self = this;

        const players = [];
        let currentTargetInfo;
        let currentPairingId = null;

        this._playNextAfterEnded = true;
        const playerStates = {};

        this._playQueueManager = new PlayQueueManager();

        this.currentItem = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.currentItem) {
                return player.currentItem();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.item : null;
        };

        this.currentMediaSource = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.currentMediaSource) {
                return player.currentMediaSource();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.mediaSource : null;
        };

        this.playMethod = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.playMethod) {
                return player.playMethod();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.playMethod : null;
        };

        this.playSessionId = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.playSessionId) {
                return player.playSessionId();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.playSessionId : null;
        };

        this.getPlayerInfo = function () {
            const player = this._currentPlayer;

            if (!player) {
                return null;
            }

            const target = currentTargetInfo || {};

            return {
                name: player.name,
                isLocalPlayer: player.isLocalPlayer,
                id: target.id,
                deviceName: target.deviceName,
                playableMediaTypes: target.playableMediaTypes,
                supportedCommands: target.supportedCommands
            };
        };

        this.setActivePlayer = function (player, targetInfo) {
            if (player === 'localplayer' || player.name === 'localplayer') {
                if (this._currentPlayer?.isLocalPlayer) {
                    return;
                }
                setCurrentPlayerInternal(null, null);
                return;
            }

            if (typeof (player) === 'string') {
                player = players.filter(function (p) {
                    return p.name === player;
                })[0];
            }

            if (!player) {
                throw new Error('null player');
            }

            setCurrentPlayerInternal(player, targetInfo);
        };

        this.trySetActivePlayer = function (player, targetInfo) {
            if (player === 'localplayer' || player.name === 'localplayer') {
                if (this._currentPlayer?.isLocalPlayer) {
                    return;
                }
                return;
            }

            if (typeof (player) === 'string') {
                player = players.filter(function (p) {
                    return p.name === player;
                })[0];
            }

            if (!player) {
                throw new Error('null player');
            }

            if (currentPairingId === targetInfo.id) {
                return;
            }

            currentPairingId = targetInfo.id;

            const promise = player.tryPair ?
                player.tryPair(targetInfo) :
                Promise.resolve();

            Events.trigger(self, 'pairing');

            promise.then(function () {
                Events.trigger(self, 'paired');
                setCurrentPlayerInternal(player, targetInfo);
            }, function () {
                Events.trigger(self, 'pairerror');
                if (currentPairingId === targetInfo.id) {
                    currentPairingId = null;
                }
            });
        };

        this.getTargets = function () {
            const promises = players.filter(displayPlayerIndividually).map(getPlayerTargets);

            return Promise.all(promises).then(function (responses) {
                return ServerConnections.currentApiClient().getCurrentUser().then(function (user) {
                    const targets = [];

                    targets.push({
                        name: globalize.translate('HeaderMyDevice'),
                        id: 'localplayer',
                        playerName: 'localplayer',
                        playableMediaTypes: ['Audio', 'Video', 'Photo', 'Book'],
                        isLocalPlayer: true,
                        supportedCommands: this.getSupportedCommands({
                            isLocalPlayer: true
                        }),
                        user: user
                    });

                    for (const subTargets of responses) {
                        for (const subTarget of subTargets) {
                            targets.push(subTarget);
                        }
                    }

                    return targets.sort(sortPlayerTargets);
                });
            });
        };

        this.playerHasSecondarySubtitleSupport = function (player = this._currentPlayer) {
            if (!player) return false;
            return Boolean(player.supports('SecondarySubtitles'));
        };

        /**
         * Checks if:
         * - the track can be used directly as a secondary subtitle
         * - or if it can be paired with a secondary subtitle when used as a primary subtitle
         */
        this.trackHasSecondarySubtitleSupport = function (track, player = this._currentPlayer) {
            if (!player || !track) return false;
            const format = (track.Codec || '').toLowerCase();
            // Currently, only non-SSA/non-ASS external subtitles are supported.
            // Showing secondary subtitles does not work with any SSA/ASS subtitle combinations because
            // of the complexity of how they are rendered and the risk of the subtitles overlapping
            return format !== 'ssa' && format !== 'ass' && getDeliveryMethod(track) === 'External';
        };

        this.secondarySubtitleTracks = function (player = this._currentPlayer) {
            const streams = this.subtitleTracks(player);
            return streams.filter((stream) => this.trackHasSecondarySubtitleSupport(stream, player));
        };

        getCurrentSubtitleStream(player, isSecondaryStream) {
            if (isSecondaryStream === undefined) isSecondaryStream = false;
            if (!player) {
                throw new Error('player cannot be null');
            }

            const index = isSecondaryStream ? getPlayerData(player).secondarySubtitleStreamIndex : getPlayerData(player).subtitleStreamIndex;

            if (index === null || index === -1) {
                return null;
            }

            return this.getSubtitleStream(player, index);
        }

        this.getSubtitleStream = function (player, index) {
            return this.subtitleTracks(player).filter(function (s) {
                return s.Type === 'Subtitle' && s.Index === index;
            })[0];
        };

        this.getPlaylist = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                if (player.getPlaylistSync) {
                    return Promise.resolve(player.getPlaylistSync());
                }

                return player.getPlaylist();
            }

            return Promise.resolve(this._playQueueManager.getPlaylist());
        };

        removeCurrentPlayer(player) {
            const previousPlayer = this._currentPlayer;

            if (!previousPlayer || player.id === previousPlayer.id) {
                setCurrentPlayerInternal(null);
            }
        }

        setCurrentPlayerInternal(player, targetInfo) {
            const previousPlayer = this._currentPlayer;
            const previousTargetInfo = currentTargetInfo;

            if (player && !targetInfo && player.isLocalPlayer) {
                targetInfo = createTarget(self, player);
            }

            if (player && !targetInfo) {
                throw new Error('targetInfo cannot be null');
            }

            currentPairingId = null;
            this._currentPlayer = player;
            currentTargetInfo = targetInfo;

            if (targetInfo) {
                console.debug('Active player: ' + JSON.stringify(targetInfo));
            }

            if (previousPlayer) {
                this.endPlayerUpdates(previousPlayer);
            }

            if (player) {
                this.beginPlayerUpdates(player);
            }

            triggerPlayerChange(self, player, targetInfo, previousPlayer, previousTargetInfo);
        }

        this.isPlaying = function (player) {
            player = player || this._currentPlayer;

            if (player?.isPlaying) {
                return player.isPlaying();
            }

            return player?.currentSrc() !== null;
        };

        this.isPlayingMediaType = function (mediaType, player) {
            player = player || this._currentPlayer;

            if (player?.isPlaying) {
                return player.isPlaying(mediaType);
            }

            if (this.isPlaying(player)) {
                const playerData = getPlayerData(player);

                return playerData.streamInfo.mediaType === mediaType;
            }

            return false;
        };

        this.isPlayingLocally = function (mediaTypes, player) {
            player = player || this._currentPlayer;

            if (!player?.isLocalPlayer) {
                return false;
            }

            return mediaTypes.filter(function (mediaType) {
                return this.isPlayingMediaType(mediaType, player);
            }).length > 0;
        };

        this.isPlayingVideo = function (player) {
            return this.isPlayingMediaType('Video', player);
        };

        this.isPlayingAudio = function (player) {
            return this.isPlayingMediaType('Audio', player);
        };

        this.getPlayers = function () {
            return players;
        };

        getDefaultPlayOptions() {
            return {
                fullscreen: true
            };
        }

        this.canPlay = function (item) {
            const itemType = item.Type;

            if (itemType === 'PhotoAlbum' || itemType === 'MusicGenre' || itemType === 'Season' || itemType === 'Series' || itemType === 'BoxSet' || itemType === 'MusicAlbum' || itemType === 'MusicArtist' || itemType === 'Playlist') {
                return true;
            }

            if (item.LocationType === 'Virtual' && itemType !== 'Program') {
                return false;
            }

            if (itemType === 'Program') {
                if (!item.EndDate || !item.StartDate) {
                    return false;
                }

                if (new Date().getTime() > datetime.parseISO8601Date(item.EndDate).getTime() || new Date().getTime() < datetime.parseISO8601Date(item.StartDate).getTime()) {
                    return false;
                }
            }

            return getPlayer(item, getDefaultPlayOptions()) !== null;
        };

        this.toggleAspectRatio = function (player) {
            player = player || this._currentPlayer;

            if (player) {
                const current = this.getAspectRatio(player);

                const supported = this.getSupportedAspectRatios(player);

                let index = -1;
                for (let i = 0, length = supported.length; i < length; i++) {
                    if (supported[i].id === current) {
                        index = i;
                        break;
                    }
                }

                index++;
                if (index >= supported.length) {
                    index = 0;
                }

                this.setAspectRatio(supported[index].id, player);
            }
        };

        this.setAspectRatio = function (val, player) {
            player = player || this._currentPlayer;

            if (player?.setAspectRatio) {
                player.setAspectRatio(val);
            }
        };

        this.getSupportedAspectRatios = function (player) {
            player = player || this._currentPlayer;

            if (player?.getSupportedAspectRatios) {
                return player.getSupportedAspectRatios();
            }

            return [];
        };

        this.getAspectRatio = function (player) {
            player = player || this._currentPlayer;

            if (player?.getAspectRatio) {
                return player.getAspectRatio();
            }
        };

        this.increasePlaybackRate = function (player) {
            player = player || this._currentPlayer;
            if (player) {
                const current = this.getPlaybackRate(player);
                const supported = this.getSupportedPlaybackRates(player);

                let index = -1;
                for (let i = 0, length = supported.length; i < length; i++) {
                    if (supported[i].id === current) {
                        index = i;
                        break;
                    }
                }

                index = Math.min(index + 1, supported.length - 1);
                this.setPlaybackRate(supported[index].id, player);
            }
        };

        this.decreasePlaybackRate = function (player) {
            player = player || this._currentPlayer;
            if (player) {
                const current = this.getPlaybackRate(player);
                const supported = this.getSupportedPlaybackRates(player);

                let index = -1;
                for (let i = 0, length = supported.length; i < length; i++) {
                    if (supported[i].id === current) {
                        index = i;
                        break;
                    }
                }

                index = Math.max(index - 1, 0);
                this.setPlaybackRate(supported[index].id, player);
            }
        };

        this.getSupportedPlaybackRates = function (player) {
            player = player || this._currentPlayer;
            if (player?.getSupportedPlaybackRates) {
                return player.getSupportedPlaybackRates();
            }
            return [];
        };

        let brightnessOsdLoaded;
        this.setBrightness = function (val, player) {
            player = player || this._currentPlayer;

            if (player) {
                if (!brightnessOsdLoaded) {
                    brightnessOsdLoaded = true;
                    // TODO: Have this trigger an event instead to get the osd out of here
                    import('./brightnessosd').then();
                }
                player.setBrightness(val);
            }
        };

        this.getBrightness = function (player) {
            player = player || this._currentPlayer;

            if (player) {
                return player.getBrightness();
            }
        };

        this.setVolume = function (val, player) {
            player = player || this._currentPlayer;

            if (player) {
                player.setVolume(val);
            }
        };

        this.getVolume = function (player) {
            player = player || this._currentPlayer;

            if (player) {
                return player.getVolume();
            }
        };

        this.volumeUp = function (player) {
            player = player || this._currentPlayer;

            if (player) {
                player.volumeUp();
            }
        };

        this.volumeDown = function (player) {
            player = player || this._currentPlayer;

            if (player) {
                player.volumeDown();
            }
        };

        this.changeAudioStream = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.changeAudioStream();
            }

            if (!player) {
                return;
            }

            const currentMediaSource = this.currentMediaSource(player);
            const mediaStreams = [];
            for (let i = 0, length = currentMediaSource.MediaStreams.length; i < length; i++) {
                if (currentMediaSource.MediaStreams[i].Type === 'Audio') {
                    mediaStreams.push(currentMediaSource.MediaStreams[i]);
                }
            }

            // Nothing to change
            if (mediaStreams.length <= 1) {
                return;
            }

            const currentStreamIndex = this.getAudioStreamIndex(player);
            let indexInList = -1;
            for (let i = 0, length = mediaStreams.length; i < length; i++) {
                if (mediaStreams[i].Index === currentStreamIndex) {
                    indexInList = i;
                    break;
                }
            }

            let nextIndex = indexInList + 1;
            if (nextIndex >= mediaStreams.length) {
                nextIndex = 0;
            }

            nextIndex = nextIndex === -1 ? -1 : mediaStreams[nextIndex].Index;

            this.setAudioStreamIndex(nextIndex, player);
        };

        this.changeSubtitleStream = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.changeSubtitleStream();
            }

            if (!player) {
                return;
            }

            const currentMediaSource = this.currentMediaSource(player);
            const mediaStreams = [];
            for (let i = 0, length = currentMediaSource.MediaStreams.length; i < length; i++) {
                if (currentMediaSource.MediaStreams[i].Type === 'Subtitle') {
                    mediaStreams.push(currentMediaSource.MediaStreams[i]);
                }
            }

            // No known streams, nothing to change
            if (!mediaStreams.length) {
                return;
            }

            const currentStreamIndex = this.getSubtitleStreamIndex(player);
            let indexInList = -1;
            for (let i = 0, length = mediaStreams.length; i < length; i++) {
                if (mediaStreams[i].Index === currentStreamIndex) {
                    indexInList = i;
                    break;
                }
            }

            let nextIndex = indexInList + 1;
            if (nextIndex >= mediaStreams.length) {
                nextIndex = -1;
            }

            nextIndex = nextIndex === -1 ? -1 : mediaStreams[nextIndex].Index;

            this.setSubtitleStreamIndex(nextIndex, player);
        };

        this.getAudioStreamIndex = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getAudioStreamIndex();
            }

            return getPlayerData(player).audioStreamIndex;
        };

        isAudioStreamSupported(mediaSource, index, deviceProfile) {
            let mediaStream;
            const mediaStreams = mediaSource.MediaStreams;

            for (let i = 0, length = mediaStreams.length; i < length; i++) {
                if (mediaStreams[i].Type === 'Audio' && mediaStreams[i].Index === index) {
                    mediaStream = mediaStreams[i];
                    break;
                }
            }

            if (!mediaStream) {
                return false;
            }

            const container = mediaSource.Container.toLowerCase();
            const codec = (mediaStream.Codec || '').toLowerCase();

            if (!codec) {
                return false;
            }

            const profiles = deviceProfile.DirectPlayProfiles || [];

            return profiles.some(function (p) {
                return p.Type === 'Video'
                    && includesAny((p.Container || '').toLowerCase(), container)
                    && includesAny((p.AudioCodec || '').toLowerCase(), codec);
            });
        }

        this.setAudioStreamIndex = function (index, player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setAudioStreamIndex(index);
            }

            if (this.playMethod(player) === 'Transcode' || !player.canSetAudioStreamIndex()) {
                changeStream(player, getCurrentTicks(player), { AudioStreamIndex: index });
                getPlayerData(player).audioStreamIndex = index;
            } else {
                // See if the player supports the track without transcoding
                player.getDeviceProfile(this.currentItem(player)).then(function (profile) {
                    if (isAudioStreamSupported(this.currentMediaSource(player), index, profile)) {
                        player.setAudioStreamIndex(index);
                        getPlayerData(player).audioStreamIndex = index;
                    } else {
                        changeStream(player, getCurrentTicks(player), { AudioStreamIndex: index });
                        getPlayerData(player).audioStreamIndex = index;
                    }
                });
            }
        };

        getSavedMaxStreamingBitrate(apiClient, mediaType) {
            if (!apiClient) {
                // This should hopefully never happen
                apiClient = ServerConnections.currentApiClient();
            }

            const endpointInfo = apiClient.getSavedEndpointInfo() || {};

            return appSettings.maxStreamingBitrate(endpointInfo.IsInNetwork, mediaType);
        }

        this.getMaxStreamingBitrate = function (player) {
            player = player || this._currentPlayer;
            if (player?.getMaxStreamingBitrate) {
                return player.getMaxStreamingBitrate();
            }

            const playerData = getPlayerData(player);

            if (playerData.maxStreamingBitrate) {
                return playerData.maxStreamingBitrate;
            }

            const mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
            const currentItem = this.currentItem(player);

            const apiClient = currentItem ? ServerConnections.getApiClient(currentItem.ServerId) : ServerConnections.currentApiClient();
            return getSavedMaxStreamingBitrate(apiClient, mediaType);
        };

        this.enableAutomaticBitrateDetection = function (player) {
            player = player || this._currentPlayer;
            if (player?.enableAutomaticBitrateDetection) {
                return player.enableAutomaticBitrateDetection();
            }

            const playerData = getPlayerData(player);
            const mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
            const currentItem = this.currentItem(player);

            const apiClient = currentItem ? ServerConnections.getApiClient(currentItem.ServerId) : ServerConnections.currentApiClient();
            const endpointInfo = apiClient.getSavedEndpointInfo() || {};

            return appSettings.enableAutomaticBitrateDetection(endpointInfo.IsInNetwork, mediaType);
        };

        this.setMaxStreamingBitrate = function (options, player) {
            player = player || this._currentPlayer;
            if (player?.setMaxStreamingBitrate) {
                return player.setMaxStreamingBitrate(options);
            }

            const apiClient = ServerConnections.getApiClient(this.currentItem(player).ServerId);

            apiClient.getEndpointInfo().then(function (endpointInfo) {
                const playerData = getPlayerData(player);
                const mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;

                let promise;
                if (options.enableAutomaticBitrateDetection) {
                    appSettings.enableAutomaticBitrateDetection(endpointInfo.IsInNetwork, mediaType, true);
                    promise = apiClient.detectBitrate(true);
                } else {
                    appSettings.enableAutomaticBitrateDetection(endpointInfo.IsInNetwork, mediaType, false);
                    promise = Promise.resolve(options.maxBitrate);
                }

                promise.then(function (bitrate) {
                    appSettings.maxStreamingBitrate(endpointInfo.IsInNetwork, mediaType, bitrate);

                    changeStream(player, getCurrentTicks(player), {
                        MaxStreamingBitrate: bitrate
                    });
                });
            });
        };

        this.isFullscreen = function (player) {
            player = player || this._currentPlayer;
            if (!player.isLocalPlayer || player.isFullscreen) {
                return player.isFullscreen();
            }

            if (!Screenfull.isEnabled) {
                // iOS Safari
                return document.webkitIsFullScreen;
            }

            return Screenfull.isFullscreen;
        };

        this.toggleFullscreen = function (player) {
            player = player || this._currentPlayer;
            if (!player.isLocalPlayer || player.toggleFullscreen) {
                return player.toggleFullscreen();
            }

            if (Screenfull.isEnabled) {
                Screenfull.toggle();
            } else if (document.webkitIsFullScreen && document.webkitCancelFullscreen) {
                // iOS Safari
                document.webkitCancelFullscreen();
            } else {
                const elem = document.querySelector('video');
                if (elem?.webkitEnterFullscreen) {
                    elem.webkitEnterFullscreen();
                }
            }
        };

        this.togglePictureInPicture = function (player) {
            player = player || this._currentPlayer;
            return player.togglePictureInPicture();
        };

        this.toggleAirPlay = function (player) {
            player = player || this._currentPlayer;
            return player.toggleAirPlay();
        };

        this.getSubtitleStreamIndex = function (player) {
            player = player || this._currentPlayer;

            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getSubtitleStreamIndex();
            }

            if (!player) {
                throw new Error('player cannot be null');
            }

            return getPlayerData(player).subtitleStreamIndex;
        };

        this.getSecondarySubtitleStreamIndex = function (player) {
            player = player || this._currentPlayer;

            if (!player) {
                throw new Error('player cannot be null');
            }

            try {
                if (!enableLocalPlaylistManagement(player)) {
                    return player.getSecondarySubtitleStreamIndex();
                }
            } catch (e) {
                console.error('[playbackmanager] Failed to get secondary stream index:', e);
            }

            return getPlayerData(player).secondarySubtitleStreamIndex;
        };

        getDeliveryMethod(subtitleStream) {
            // This will be null for internal subs for local items
            if (subtitleStream.DeliveryMethod) {
                return subtitleStream.DeliveryMethod;
            }

            return subtitleStream.IsExternal ? 'External' : 'Embed';
        }

        this.setSubtitleStreamIndex = function (index, player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setSubtitleStreamIndex(index);
            }

            const currentStream = getCurrentSubtitleStream(player);

            const newStream = this.getSubtitleStream(player, index);

            if (!currentStream && !newStream) {
                return;
            }

            let selectedTrackElementIndex = -1;

            const currentPlayMethod = this.playMethod(player);

            if (currentStream && !newStream) {
                if (getDeliveryMethod(currentStream) === 'Encode' || (getDeliveryMethod(currentStream) === 'Embed' && currentPlayMethod === 'Transcode')) {
                    // Need to change the transcoded stream to remove subs
                    changeStream(player, getCurrentTicks(player), { SubtitleStreamIndex: -1 });
                }
            } else if (!currentStream && newStream) {
                if (getDeliveryMethod(newStream) === 'External') {
                    selectedTrackElementIndex = index;
                } else if (getDeliveryMethod(newStream) === 'Embed' && currentPlayMethod !== 'Transcode') {
                    selectedTrackElementIndex = index;
                } else {
                    // Need to change the transcoded stream to add subs
                    changeStream(player, getCurrentTicks(player), { SubtitleStreamIndex: index });
                }
            } else if (currentStream && newStream) {
                // Switching tracks
                // We can handle this clientside if the new track is external or the new track is embedded and we're not transcoding
                if (getDeliveryMethod(newStream) === 'External' || (getDeliveryMethod(newStream) === 'Embed' && currentPlayMethod !== 'Transcode')) {
                    selectedTrackElementIndex = index;

                    // But in order to handle this client side, if the previous track is being added via transcoding, we'll have to remove it
                    if (getDeliveryMethod(currentStream) !== 'External' && getDeliveryMethod(currentStream) !== 'Embed') {
                        changeStream(player, getCurrentTicks(player), { SubtitleStreamIndex: -1 });
                    }
                } else {
                    // Need to change the transcoded stream to add subs
                    changeStream(player, getCurrentTicks(player), { SubtitleStreamIndex: index });
                }
            }

            player.setSubtitleStreamIndex(selectedTrackElementIndex);

            // Also disable secondary subtitles when disabling the primary
            // subtitles, or if it doesn't support a secondary pair
            if (selectedTrackElementIndex === -1 || !this.trackHasSecondarySubtitleSupport(newStream)) {
                this.setSecondarySubtitleStreamIndex(-1);
            }

            getPlayerData(player).subtitleStreamIndex = index;
        };

        this.setSecondarySubtitleStreamIndex = function (index, player) {
            player = player || this._currentPlayer;
            if (!this.playerHasSecondarySubtitleSupport(player)) return;
            if (player && !enableLocalPlaylistManagement(player)) {
                try {
                    return player.setSecondarySubtitleStreamIndex(index);
                } catch (e) {
                    console.error('[playbackmanager] AutoSet - Failed to set secondary track:', e);
                }
            }

            const currentStream = getCurrentSubtitleStream(player, true);

            const newStream = this.getSubtitleStream(player, index);

            if (!currentStream && !newStream) {
                return;
            }

            // Secondary subtitles are currently only handled client side
            // Changes to the server code are required before we can handle other delivery methods
            if (newStream && !this.trackHasSecondarySubtitleSupport(newStream, player)) {
                return;
            }

            try {
                player.setSecondarySubtitleStreamIndex(index);
                getPlayerData(player).secondarySubtitleStreamIndex = index;
            } catch (e) {
                console.error('[playbackmanager] AutoSet - Failed to set secondary track:', e);
            }
        };

        this.supportSubtitleOffset = function (player) {
            player = player || this._currentPlayer;
            return player && 'setSubtitleOffset' in player;
        };

        this.enableShowingSubtitleOffset = function (player) {
            player = player || this._currentPlayer;
            player.enableShowingSubtitleOffset();
        };

        this.disableShowingSubtitleOffset = function (player) {
            player = player || this._currentPlayer;
            if (player.disableShowingSubtitleOffset) {
                player.disableShowingSubtitleOffset();
            }
        };

        this.isShowingSubtitleOffsetEnabled = function (player) {
            player = player || this._currentPlayer;
            return player.isShowingSubtitleOffsetEnabled();
        };

        this.isSubtitleStreamExternal = function (index, player) {
            const stream = this.getSubtitleStream(player, index);
            return stream ? getDeliveryMethod(stream) === 'External' : false;
        };

        this.setSubtitleOffset = function (value, player) {
            player = player || this._currentPlayer;
            if (player.setSubtitleOffset) {
                player.setSubtitleOffset(value);
            }
        };

        this.getPlayerSubtitleOffset = function (player) {
            player = player || this._currentPlayer;
            if (player.getSubtitleOffset) {
                return player.getSubtitleOffset();
            }
        };

        this.canHandleOffsetOnCurrentSubtitle = function (player) {
            const index = this.getSubtitleStreamIndex(player);
            return index !== -1 && this.isSubtitleStreamExternal(index, player);
        };

        /**
         * Seek to a specific position in the current media
         * @param {number} ticks - Position to seek to in ticks (10000 ticks = 1 second)
         * @param {Object} [player] - Player instance, defaults to current player
         * @returns {Promise} Promise that resolves when seek completes
         */
        this.seek = function (ticks, player) {
            if (typeof ticks !== 'number' || isNaN(ticks)) {
                return Promise.reject(new Error('Invalid seek position'));
            }

            ticks = Math.max(0, ticks);
            player = player || this._currentPlayer;

            validatePlayerOperation(player, 'seek');

            if (!enableLocalPlaylistManagement(player)) {
                return player.seek(ticks);
            }

            return changeStream(player, ticks);
        };

        this.seekRelative = function (offsetTicks, player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player) && player.seekRelative) {
                return player.seekRelative(ticks);
            }

            const ticks = getCurrentTicks(player) + offsetTicks;
            return this.seek(ticks, player);
        };

        /**
         * Returns true if the player can seek using native client-side seeking functions
         */
        canPlayerSeek(player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.seekable) {
                return player.seekable();
            }

            return false;
        }

            const playerData = getPlayerData(player);

            const currentSrc = (playerData.streamInfo.url || '').toLowerCase();

            if (currentSrc.indexOf('.m3u8') !== -1) {
                return true;
            }

            if (player.seekable) {
                return player.seekable();
            }

            const isPlayMethodTranscode = this.playMethod(player) === 'Transcode';

            if (isPlayMethodTranscode) {
                return false;
            }

            return player.duration();
        };

        this.canPlayerSeek = this.canPlayerSeek;

        changeStream(player, ticks, params) {
            if (this.canPlayerSeek(player) && params === null) {
                player.currentTime(parseInt(ticks / 10000, 10));
                return;
            }

            params = params || {};

            const liveStreamId = getPlayerData(player).streamInfo.liveStreamId;
            const lastMediaInfoQuery = getPlayerData(player).streamInfo.lastMediaInfoQuery;

            const playSessionId = this.playSessionId(player);

            const currentItem = this.currentItem(player);

            player.getDeviceProfile(currentItem, {
                isRetry: params.EnableDirectPlay === false
            }).then(function (deviceProfile) {
                const audioStreamIndex = params.AudioStreamIndex === null ? getPlayerData(player).audioStreamIndex : params.AudioStreamIndex;
                const subtitleStreamIndex = params.SubtitleStreamIndex === null ? getPlayerData(player).subtitleStreamIndex : params.SubtitleStreamIndex;
                const secondarySubtitleStreamIndex = params.SecondarySubtitleStreamIndex === null ? getPlayerData(player).secondarySubtitleStreamIndex : params.SecondarySubtitleStreamIndex;

                let currentMediaSource = this.currentMediaSource(player);
                const apiClient = ServerConnections.getApiClient(currentItem.ServerId);

                if (ticks) {
                    ticks = parseInt(ticks, 10);
                }

                const maxBitrate = params.MaxStreamingBitrate || this.getMaxStreamingBitrate(player);

                const currentPlayOptions = currentItem.playOptions || getDefaultPlayOptions();

                const options = {
                    maxBitrate,
                    startPosition: ticks,
                    isPlayback: true,
                    audioStreamIndex,
                    subtitleStreamIndex,
                    enableDirectPlay: params.EnableDirectPlay,
                    enableDirectStream: params.EnableDirectStream,
                    allowVideoStreamCopy: params.AllowVideoStreamCopy,
                    allowAudioStreamCopy: params.AllowAudioStreamCopy
                };

                getPlaybackInfo(player, apiClient, currentItem, deviceProfile, currentMediaSource.Id, liveStreamId, options).then(function (result) {
                    if (validatePlaybackInfoResult(self, result)) {
                        currentMediaSource = result.MediaSources[0];

                        const streamInfo = createStreamInfo(apiClient, currentItem.MediaType, currentItem, currentMediaSource, ticks, player);
                        streamInfo.fullscreen = currentPlayOptions.fullscreen;
                        streamInfo.lastMediaInfoQuery = lastMediaInfoQuery;
                        streamInfo.resetSubtitleOffset = false;

                        if (!streamInfo.url) {
                            cancelPlayback();
                            showPlaybackInfoErrorMessage(self, `PlaybackError.${MediaError.NO_MEDIA_ERROR}`);
                            return;
                        }

                        getPlayerData(player).subtitleStreamIndex = subtitleStreamIndex;
                        getPlayerData(player).secondarySubtitleStreamIndex = secondarySubtitleStreamIndex;
                        getPlayerData(player).audioStreamIndex = audioStreamIndex;
                        getPlayerData(player).maxStreamingBitrate = maxBitrate;

                        changeStreamToUrl(apiClient, player, playSessionId, streamInfo);
                    }
                });
            });
        }

        changeStreamToUrl(apiClient, player, playSessionId, streamInfo) {
            const playerData = getPlayerData(player);

            playerData.isChangingStream = true;

            if (playerData.streamInfo && playSessionId) {
                apiClient.stopActiveEncodings(playSessionId).then(function () {
                    // Stop the first transcoding afterwards because the player may still send requests to the original url
                    const afterSetSrc = function () {
                        apiClient.stopActiveEncodings(playSessionId);
                    };
                    setSrcIntoPlayer(apiClient, player, streamInfo).then(afterSetSrc, afterSetSrc);
                });
            } else {
                setSrcIntoPlayer(apiClient, player, streamInfo);
            }
        }

        setSrcIntoPlayer(apiClient, player, streamInfo) {
            const playerData = getPlayerData(player);

            playerData.streamInfo = streamInfo;

            return player.play(streamInfo).then(function () {
                playerData.isChangingStream = false;
                streamInfo.started = true;
                streamInfo.ended = false;

                sendProgressUpdate(player, 'timeupdate');
            }, function (e) {
                playerData.isChangingStream = false;

                onPlaybackError.call(player, e, {
                    type: getMediaError(e),
                    streamInfo
                });
            });
        }

        async translateItemsForPlayback(items, options) {
            const sortItemsIfNeeded = function (items, options) {
                if (items.length > 1 && options?.ids) {
                    // Use the original request id array for sorting the result in the proper order
                    items.sort(function (a, b) {
                        return options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id);
                    });
                }
            };

            const getPlaybackPromise = function (firstItem, serverId, options, queryOptions, items) {
                switch (firstItem.Type) {
                    case 'Program':
                        return getItemsForPlayback(serverId, {
                            Ids: firstItem.ChannelId
                        });
                    case 'Playlist':
                        return getItemsForPlayback(serverId, {
                            ParentId: firstItem.Id,
                            SortBy: options.shuffle ? 'Random' : null
                        });
                    case 'MusicArtist':
                        return getItemsForPlayback(serverId, mergePlaybackQueries({
                            ArtistIds: firstItem.Id,
                            Filters: 'IsNotFolder',
                            Recursive: true,
                            SortBy: options.shuffle ? 'Random' : 'SortName',
                            MediaTypes: 'Audio'
                        }, queryOptions));
                    case 'PhotoAlbum':
                        return getItemsForPlayback(serverId, mergePlaybackQueries({
                            ParentId: firstItem.Id,
                            Filters: 'IsNotFolder',
                            Recursive: true,
                            SortBy: options.shuffle ? 'Random' : 'SortName',
                            IncludeItemTypes: 'Photo'
                        }, queryOptions));
                    case 'MusicAlbum':
                        return getItemsForPlayback(serverId, mergePlaybackQueries({
                            ParentId: firstItem.Id,
                            Filters: 'IsNotFolder',
                            Recursive: true,
                            SortBy: options.shuffle ? 'Random' : 'SortName',
                            MediaTypes: 'Audio'
                        }, queryOptions));
                    case 'MusicGenre':
                        return getItemsForPlayback(serverId, mergePlaybackQueries({
                            GenreIds: firstItem.Id,
                            Filters: 'IsNotFolder',
                            Recursive: true,
                            SortBy: options.shuffle ? 'Random' : 'SortName',
                            MediaTypes: 'Audio'
                        }, queryOptions));
                    case 'Series':
                    case 'Season':
                        return getSeriesOrSeasonPlaybackPromise(firstItem, serverId, options, items);
                    default:
                        return null;
                }
            };

            if (!items.length) return [];

            sortItemsIfNeeded(items, options);

            const firstItem = items[0];
            const serverId = firstItem.ServerId;
            const queryOptions = options.queryOptions || {};

            const promise = getPlaybackPromise(firstItem, serverId, options, queryOptions, items);

            if (promise) {
                const result = await promise;
                return result ? result.Items : items;
            } else {
                return items;
            }
        }

        const sortItemsIfNeeded = function (items, options) {
            if (items.length > 1 && options?.ids) {
                // Use the original request id array for sorting the result in the proper order
                items.sort(function (a, b) {
                    return options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id);
                });
            }
        }

        const getPlaybackPromise = function (firstItem, serverId, options, queryOptions, items) {
            switch (firstItem.Type) {
                case 'Program':
                    return getItemsForPlayback(serverId, {
                        Ids: firstItem.ChannelId
                    });
                case 'Playlist':
                    return getItemsForPlayback(serverId, {
                        ParentId: firstItem.Id,
                        SortBy: options.shuffle ? 'Random' : null
                    });
                case 'MusicArtist':
                    return getItemsForPlayback(serverId, mergePlaybackQueries({
                        ArtistIds: firstItem.Id,
                        Filters: 'IsNotFolder',
                        Recursive: true,
                        SortBy: options.shuffle ? 'Random' : 'SortName',
                        MediaTypes: 'Audio'
                    }, queryOptions));
                case 'PhotoAlbum':
                    return getItemsForPlayback(serverId, mergePlaybackQueries({
                        ParentId: firstItem.Id,
                        Filters: 'IsNotFolder',
                        // Setting this to true may cause some incorrect sorting
                        Recursive: false,
                        SortBy: options.shuffle ? 'Random' : 'SortName',
                        // Only include Photos because we do not handle mixed queues currently
                        MediaTypes: 'Photo',
                        Limit: UNLIMITED_ITEMS
                    }, queryOptions));
                case 'MusicGenre':
                    return getItemsForPlayback(serverId, mergePlaybackQueries({
                        GenreIds: firstItem.Id,
                        Filters: 'IsNotFolder',
                        Recursive: true,
                        SortBy: options.shuffle ? 'Random' : 'SortName',
                        MediaTypes: 'Audio'
                    }, queryOptions));
                case 'Series':
                case 'Season':
                    return getSeriesOrSeasonPlaybackPromise(firstItem, options, items);
                case 'Episode':
                    return getEpisodePlaybackPromise(firstItem, options, items);
            }

            return getNonItemTypePromise(firstItem, serverId, options, queryOptions);
        }

        getNonItemTypePromise(firstItem, serverId, options, queryOptions) {
            if (firstItem.MediaType === 'Photo') {
                return getItemsForPlayback(serverId, mergePlaybackQueries({
                    ParentId: firstItem.ParentId,
                    Filters: 'IsNotFolder',
                    // Setting this to true may cause some incorrect sorting
                    Recursive: false,
                    SortBy: options.shuffle ? 'Random' : 'SortName',
                    MediaTypes: 'Photo,Video',
                    Limit: UNLIMITED_ITEMS
                }, queryOptions)).then(function (result) {
                    const playbackItems = result.Items;

                    let index = playbackItems.map(function (i) {
                        return i.Id;
                    }).indexOf(firstItem.Id);

                    if (index === -1) {
                        index = 0;
                    }

                    options.startIndex = index;

                    return Promise.resolve(result);
                });
            } else if (firstItem.IsFolder && firstItem.CollectionType === 'homevideos') {
                return getItemsForPlayback(serverId, mergePlaybackQueries({
                    ParentId: firstItem.Id,
                    Filters: 'IsNotFolder',
                    Recursive: true,
                    SortBy: options.shuffle ? 'Random' : 'SortName',
                    // Only include Photos because we do not handle mixed queues currently
                    MediaTypes: 'Photo',
                    Limit: UNLIMITED_ITEMS
                }, queryOptions));
            } else if (firstItem.IsFolder) {
                let sortBy = null;
                if (options.shuffle) {
                    sortBy = 'Random';
                } else if (firstItem.Type !== 'BoxSet') {
                    sortBy = 'SortName';
                }

                return getItemsForPlayback(serverId, mergePlaybackQueries({
                    ParentId: firstItem.Id,
                    Filters: 'IsNotFolder',
                    Recursive: true,
                    // These are pre-sorted
                    SortBy: sortBy,
                    MediaTypes: 'Audio,Video'
                }, queryOptions));
            }

            return null;
        }

        async getSeriesOrSeasonPlaybackPromise(firstItem, options, items) {
            const apiClient = ServerConnections.getApiClient(firstItem.ServerId);
            const startSeasonId = firstItem.Type === 'Season' ? items[options.startIndex || 0].Id : undefined;

            const episodesResult = await apiClient.getEpisodes(firstItem.SeriesId || firstItem.Id, {
                IsVirtualUnaired: false,
                IsMissing: false,
                SeasonId: (startSeasonId && items.length === 1) ? startSeasonId : undefined,
                SortBy: options.shuffle ? 'Random' : undefined,
                UserId: apiClient.getCurrentUserId(),
                Fields: ['Chapters', 'Trickplay']
            });

            if (options.shuffle) {
                episodesResult.StartIndex = 0;
            } else {
                episodesResult.StartIndex = undefined;
                let seasonStartIndex;
                for (const [index, e] of episodesResult.Items.entries()) {
                    if (startSeasonId) {
                        if (e.SeasonId === startSeasonId) {
                            if (seasonStartIndex === undefined) {
                                seasonStartIndex = index;
                            }
                        } else {
                            continue;
                        }
                    }
                    if (!e.UserData.Played) {
                        episodesResult.StartIndex = index;
                        break;
                    }
                }
                episodesResult.StartIndex = episodesResult.StartIndex || seasonStartIndex || 0;
            }

            // TODO: fix calling code to read episodesResult.StartIndex instead when set.
            options.startIndex = episodesResult.StartIndex;

            episodesResult.TotalRecordCount = episodesResult.Items.length;

            return episodesResult;
        }

        getEpisodePlaybackPromise(firstItem, options, items) {
            if (items.length === 1 && getPlayer(firstItem, options).supportsProgress !== false) {
                return getEpisodes(firstItem, options);
            } else {
                return null;
            }
        }

        getEpisodes(firstItem, options) {
            return new Promise(function (resolve, reject) {
                const apiClient = ServerConnections.getApiClient(firstItem.ServerId);

                if (!firstItem.SeriesId) {
                    resolve(null);
                    return;
                }

                apiClient.getEpisodes(firstItem.SeriesId, {
                    IsVirtualUnaired: false,
                    IsMissing: false,
                    UserId: apiClient.getCurrentUserId(),
                    Fields: ['Chapters', 'Trickplay']
                }).then(function (episodesResult) {
                    resolve(filterEpisodes(episodesResult, firstItem, options));
                }, reject);
            });
        }

        filterEpisodes(episodesResult, firstItem, options) {
            for (const [index, e] of episodesResult.Items.entries()) {
                if (e.Id === firstItem.Id) {
                    episodesResult.StartIndex = index;
                    break;
                }
            }

            // TODO: fix calling code to read episodesResult.StartIndex instead when set.
            options.startIndex = episodesResult.StartIndex;
            episodesResult.TotalRecordCount = episodesResult.Items.length;
            return episodesResult;
        }

        this.translateItemsForPlayback = translateItemsForPlayback;
        this.getItemsForPlayback = getItemsForPlayback;

        /**
         * Start playback with the given options
         * @param {Object} options - Playback options
         * @returns {Promise} Promise that resolves when playback starts
         */
        this.play = function (options) {
            if (!options || typeof options !== 'object') {
                return Promise.reject(new Error('Invalid play options'));
            }

            hijackMediaElementForCrossfade();

            normalizePlayOptions(options);

            if (this._currentPlayer) {
                if (options.enableRemotePlayers === false && !this._currentPlayer.isLocalPlayer) {
                    return Promise.reject(new Error('Remote players disabled'));
                }

                if (!this._currentPlayer.isLocalPlayer) {
                    return this._currentPlayer.play(options);
                }
            }

            if (options.fullscreen) {
                loading.show();
            }

            if (options.items) {
                return translateItemsForPlayback(options.items, options)
                    .then((items) => getAdditionalParts(items))
                    .then(function (allItems) {
                        const flattened = allItems.flatMap(i => i);
                        return playWithIntros(flattened, options);
                    });
            } else {
                if (!options.serverId) {
                    throw new Error('serverId required!');
                }

                return getItemsForPlayback(options.serverId, {
                    Ids: options.ids.join(',')
                }).then(function (result) {
                    return translateItemsForPlayback(result.Items, options)
                        .then((items) => getAdditionalParts(items))
                        .then(function (allItems) {
                            const flattened = allItems.flatMap(i => i);
                            return playWithIntros(flattened, options);
                        });
                });
            }
        };

        getPlayerData(player) {
            if (!player) {
                throw new Error('player cannot be null');
            }
            if (!player.name) {
                throw new Error('player name cannot be null');
            }
            let state = playerStates[player.name];

            if (!state) {
                playerStates[player.name] = {};
                state = playerStates[player.name];
            }

            return player;
        }

        this.getPlayerState = function (player, item, mediaSource) {
            player = player || this._currentPlayer;

            if (!player) {
                throw new Error('player cannot be null');
            }

            if (!enableLocalPlaylistManagement(player) && player.getPlayerState) {
                return player.getPlayerState();
            }

            item = item || this.currentItem(player);
            mediaSource = mediaSource || this.currentMediaSource(player);

            const state = {
                PlayState: {}
            };

            if (player) {
                state.PlayState.VolumeLevel = player.getVolume();
                state.PlayState.IsMuted = player.isMuted();
                state.PlayState.IsPaused = player.paused();
                state.PlayState.RepeatMode = this.getRepeatMode(player);
                state.PlayState.ShuffleMode = this.getQueueShuffleMode(player);
                state.PlayState.MaxStreamingBitrate = this.getMaxStreamingBitrate(player);

                state.PlayState.PositionTicks = getCurrentTicks(player);
                state.PlayState.PlaybackStartTimeTicks = this.playbackStartTime(player);
                state.PlayState.PlaybackRate = this.getPlaybackRate(player);

                state.PlayState.SubtitleStreamIndex = this.getSubtitleStreamIndex(player);
                state.PlayState.SecondarySubtitleStreamIndex = this.getSecondarySubtitleStreamIndex(player);
                state.PlayState.AudioStreamIndex = this.getAudioStreamIndex(player);
                state.PlayState.BufferedRanges = this.getBufferedRanges(player);

                state.PlayState.PlayMethod = this.playMethod(player);

                if (mediaSource) {
                    state.PlayState.LiveStreamId = mediaSource.LiveStreamId;
                }
                state.PlayState.PlaySessionId = this.playSessionId(player);
                state.PlayState.PlaylistItemId = this.getCurrentPlaylistItemId(player);
            }

            if (mediaSource) {
                state.PlayState.MediaSourceId = mediaSource.Id;

                state.NowPlayingItem = {
                    RunTimeTicks: mediaSource.RunTimeTicks
                };

                state.PlayState.CanSeek = (mediaSource.RunTimeTicks || 0) > 0 || canPlayerSeek(player);
            }

            if (item) {
                state.NowPlayingItem = getNowPlayingItemForReporting(player, item, mediaSource);
            }

            state.MediaSource = mediaSource;

            return state;
        };

        this.duration = function (player) {
            player = player || this._currentPlayer;

            if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
                return player.duration();
            }

            if (!player) {
                throw new Error('player cannot be null');
            }

            const mediaSource = this.currentMediaSource(player);

            if (mediaSource?.RunTimeTicks) {
                return mediaSource.RunTimeTicks;
            }

            let playerDuration = player.duration();

            if (playerDuration) {
                playerDuration *= 10000;
            }

            return playerDuration;
        };

        getCurrentTicks(player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            let playerTime = Math.floor(10000 * (player).currentTime());

            const streamInfo = getPlayerData(player).streamInfo;
            if (streamInfo) {
                playerTime += getPlayerData(player).streamInfo.transcodingOffsetTicks || 0;
            }

            return playerTime;
        }

        // Only used internally
        this.getCurrentTicks = getCurrentTicks;

        playOther(items, options) {
            const playStartIndex = options.startIndex || 0;
            const player = getPlayer(items[playStartIndex], options);

            loading.hide();

            options.items = items;

            return player.play(options);
        }

        const getAdditionalParts = async (items) => {
            const getOneAdditionalPart = async function (item) {
                let retVal = [item];
                if (item.PartCount && item.PartCount > 1 && (item.Type === 'Movie' || item.Type === 'Episode')) {
                    const client = ServerConnections.getApiClient(item.ServerId);
                    const user = await client.getCurrentUser();
                    const additionalParts = await client.getAdditionalVideoParts(user.Id, item.Id);
                    if (additionalParts.Items.length) {
                        retVal = [item, ...additionalParts.Items];
                    }
                }
                return retVal;
            };

            return Promise.all(items.flatMap(async (item) => getOneAdditionalPart(item)));
        };

        playWithIntros(items, options) {
            let playStartIndex = options.startIndex || 0;
            let firstItem = items[playStartIndex];

            // If index was bad, reset it
            if (!firstItem) {
                playStartIndex = 0;
                firstItem = items[playStartIndex];
            }

            // If it's still null then there's nothing to play
            if (!firstItem) {
                showPlaybackInfoErrorMessage(self, `PlaybackError.${MediaError.NO_MEDIA_ERROR}`);
                return Promise.reject();
            }

            if (firstItem.MediaType === 'Photo' || firstItem.MediaType === 'Book') {
                return playOther(items, options);
            }

            const apiClient = ServerConnections.getApiClient(firstItem.ServerId);

            return getIntros(firstItem, apiClient, options).then(function (introsResult) {
                const introItems = introsResult.Items;
                let introPlayOptions;

                firstItem.playOptions = truncatePlayOptions(options);

                if (introItems.length) {
                    introPlayOptions = {
                        fullscreen: firstItem.playOptions.fullscreen
                    };
                } else {
                    introPlayOptions = firstItem.playOptions;
                }

                items = introItems.concat(items);

                // Needed by players that manage their own playlist
                introPlayOptions.items = items;
                introPlayOptions.startIndex = playStartIndex;

                setTimeout(() => {
                    return playInternal(items[playStartIndex], introPlayOptions, function () {
                        this._playQueueManager.setPlaylist(items);

                        setPlaylistState(items[playStartIndex].PlaylistItemId, playStartIndex);
                        loading.hide();
                    }).catch(onPlaybackRejection);
                }, Math.max(xDuration.sustain * 1000), 1);
            });
        }

        // Set playlist state. Using a method allows for overloading in derived player implementations
        setPlaylistState(playlistItemId, index) {
            if (!isNaN(index)) {
                this._playQueueManager.setPlaylistState(playlistItemId, index);
            }
        }

        playInternal(item, playOptions, onPlaybackStartedFn, prevSource) {
            if (item.IsPlaceHolder) {
                loading.hide();
                showPlaybackInfoErrorMessage(self, 'PlaybackErrorPlaceHolder');
                return Promise.reject();
            }

            // Normalize defaults to simplfy checks throughout the process
            normalizePlayOptions(playOptions);

            if (playOptions.isFirstItem) {
                playOptions.isFirstItem = false;
            } else {
                playOptions.isFirstItem = true;
            }

            const apiClient = ServerConnections.getApiClient(item.ServerId);

            // TODO: This should be the media type requested, not the original media type
            const mediaType = item.MediaType;

            return runInterceptors(item, playOptions)
                .catch(onInterceptorRejection)
                .then(() => detectBitrate(apiClient, item, mediaType))
                .then((bitrate) => {
                    // For manual crossfade triggers, start immediately
                    // For automatic triggers, delay based on crossfade timing
                    const delay = xDuration.manualTrigger ? 1 :
                        Math.max(1, xDuration.sustain * 1000 - (performance.now() - xDuration.t0));

                    setTimeout(() => {
                        return playAfterBitrateDetect(bitrate, item, playOptions, onPlaybackStartedFn, prevSource)
                            .catch(onPlaybackRejection);
                    }, delay);
                })
                .catch(() => getSavedMaxStreamingBitrate(apiClient, mediaType))
                .then((bitrate) => {
                    return playAfterBitrateDetect(bitrate, item, playOptions, onPlaybackStartedFn, prevSource);
                })
                .catch(onInterceptorRejection)
                .finally(() => {
                    if (playOptions.fullscreen) {
                        loading.hide();
                    }
                });
        }

        cancelPlayback() {
            const player = this._currentPlayer;

            if (player) {
                destroyPlayer(player);
                removeCurrentPlayer(player);
            }

            Events.trigger(self, 'playbackcancelled');
        }

        onInterceptorRejection(e) {
            cancelPlayback();

            let displayErrorCode = 'ErrorDefault';

            if (e instanceof Response) {
                if (e.status >= 500) {
                    displayErrorCode = `PlaybackError.${MediaError.SERVER_ERROR}`;
                } else if (e.status >= 400) {
                    displayErrorCode = `PlaybackError.${MediaError.NO_MEDIA_ERROR}`;
                }
            }

            showPlaybackInfoErrorMessage(self, displayErrorCode);

            return Promise.reject();
        }

        onPlaybackRejection(e) {
            cancelPlayback();

            let displayErrorCode = 'ErrorDefault';

            if (e instanceof Response) {
                if (e.status >= 500) {
                    displayErrorCode = `PlaybackError.${MediaError.SERVER_ERROR}`;
                } else if (e.status >= 400) {
                    displayErrorCode = `PlaybackError.${MediaError.NO_MEDIA_ERROR}`;
                }
            }

            showPlaybackInfoErrorMessage(self, displayErrorCode);

            return Promise.reject();
        }

        destroyPlayer(player) {
            player.destroy();
        }

        runInterceptors(item, playOptions) {
            return new Promise(function (resolve, reject) {
                const interceptors = pluginManager.ofType(PluginType.PreplayIntercept);

                interceptors.sort(function (a, b) {
                    return (a.order || 0) - (b.order || 0);
                });

                if (!interceptors.length) {
                    resolve();
                    return;
                }

                loading.hide();

                const options = Object.assign({}, playOptions);

                options.mediaType = item.MediaType;
                options.item = item;

                runNextPrePlay(interceptors, 0, options, resolve, reject);
            });
        }

        runNextPrePlay(interceptors, index, options, resolve, reject) {
            if (index >= interceptors.length) {
                resolve();
                return;
            }

            const interceptor = interceptors[index];

            interceptor.intercept(options).then(function () {
                runNextPrePlay(interceptors, index + 1, options, resolve, reject);
            }, reject);
        }

        sendPlaybackListToPlayer(player, items, deviceProfile, apiClient, mediaSourceId, options) {
            return setStreamUrls(items, deviceProfile, options.maxBitrate, apiClient, options.startPosition).then(function () {
                loading.hide();

                return player.play({
                    items,
                    startPositionTicks: options.startPosition || 0,
                    mediaSourceId,
                    audioStreamIndex: options.audioStreamIndex,
                    subtitleStreamIndex: options.subtitleStreamIndex,
                    startIndex: options.startIndex
                });
            });
        }

        rankStreamType(prevIndex, prevSource, mediaSource, streamType, isSecondarySubtitle) {
            if (prevIndex === -1) {
                console.debug(`AutoSet ${streamType} - No Stream Set`);
                if (streamType === 'Subtitle') {
                    if (isSecondarySubtitle) {
                        mediaSource.DefaultSecondarySubtitleStreamIndex = -1;
                    } else {
                        mediaSource.DefaultSubtitleStreamIndex = -1;
                    }
                }
                return;
            }

            if (!prevSource.MediaStreams || !mediaSource.MediaStreams) {
                console.debug(`AutoSet ${streamType} - No MediaStreams`);
                return;
            }

            let bestStreamIndex = null;
            let bestStreamScore = 0;
            const prevStream = prevSource.MediaStreams[prevIndex];

            if (!prevStream) {
                console.debug(`AutoSet ${streamType} - No prevStream`);
                return;
            }

            console.debug(`AutoSet ${streamType} - Previous was ${prevStream.Index} - ${prevStream.DisplayTitle}`);

            let prevRelIndex = 0;
            for (const stream of prevSource.MediaStreams) {
                if (stream.Type !== streamType) continue;

                if (stream.Index === prevIndex) break;

                prevRelIndex += 1;
            }

            let newRelIndex = 0;
            for (const stream of mediaSource.MediaStreams) {
                if (stream.Type !== streamType) continue;

                let score = 0;

                if (prevStream.Codec === stream.Codec) score += 1;
                if (prevRelIndex === newRelIndex) score += 1;
                if (prevStream.DisplayTitle && prevStream.DisplayTitle === stream.DisplayTitle) score += 2;
                if (prevStream.Language && prevStream.Language !== 'und' && prevStream.Language === stream.Language) score += 2;

                console.debug(`AutoSet ${streamType} - Score ${score} for ${stream.Index} - ${stream.DisplayTitle}`);
                if (score > bestStreamScore && score >= 3) {
                    bestStreamScore = score;
                    bestStreamIndex = stream.Index;
                }

                newRelIndex += 1;
            }

            if (bestStreamIndex !== null) {
                console.debug(`AutoSet ${streamType} - Using ${bestStreamIndex} score ${bestStreamScore}.`);
                if (streamType === 'Subtitle') {
                    if (isSecondarySubtitle) {
                        mediaSource.DefaultSecondarySubtitleStreamIndex = bestStreamIndex;
                    } else {
                        mediaSource.DefaultSubtitleStreamIndex = bestStreamIndex;
                    }
                }
                if (streamType === 'Audio') {
                    mediaSource.DefaultAudioStreamIndex = bestStreamIndex;
                }
            } else {
                console.debug(`AutoSet ${streamType} - Threshold not met. Using default.`);
            }
        }

        autoSetNextTracks(prevSource, mediaSource, audio, subtitle) {
            try {
                if (!prevSource) return;

                if (!mediaSource) {
                    console.warn('AutoSet - No mediaSource');
                    return;
                }

                if (audio && typeof prevSource.DefaultAudioStreamIndex === 'number') {
                    rankStreamType(prevSource.DefaultAudioStreamIndex, prevSource, mediaSource, 'Audio');
                }

                if (subtitle && typeof prevSource.DefaultSubtitleStreamIndex === 'number') {
                    rankStreamType(prevSource.DefaultSubtitleStreamIndex, prevSource, mediaSource, 'Subtitle');
                }

                if (subtitle && typeof prevSource.DefaultSecondarySubtitleStreamIndex === 'number') {
                    rankStreamType(prevSource.DefaultSecondarySubtitleStreamIndex, prevSource, mediaSource, 'Subtitle', true);
                }
            } catch (e) {
                console.error(`AutoSet - Caught unexpected error: ${e}`);
            }
        }

        playAfterBitrateDetect(maxBitrate, item, playOptions, onPlaybackStartedFn, prevSource) {
            const startPosition = playOptions.startPositionTicks;

            const player = getPlayer(item, playOptions);
            const activePlayer = this._currentPlayer;

            let promise;

            if (activePlayer) {
                // TODO: if changing players within the same playlist, this will cause nextItem to be null
                this._playNextAfterEnded = false;
                promise = onPlaybackChanging(activePlayer, player, item);
            } else {
                promise = Promise.resolve();
            }

            if (!player) {
                return promise.then(() => {
                    cancelPlayback();
                    loading.hide();
                    console.error(`No player found for the requested media: ${item.Url}`);
                    showPlaybackInfoErrorMessage(self, 'ErrorPlayerNotFound');
                });
            }

            if (!isServerItem(item) || item.MediaType === 'Book') {
                return promise.then(function () {
                    const streamInfo = createStreamInfoFromUrlItem(item);
                    streamInfo.fullscreen = playOptions.fullscreen;
                    getPlayerData(player).isChangingStream = false;
                    return player.play(streamInfo).then(() => {
                        loading.hide();
                        onPlaybackStartedFn();
                        onPlaybackStarted(player, playOptions, streamInfo);
                    }).catch((errorCode) => {
                        this.stop(player);
                        loading.hide();
                        showPlaybackInfoErrorMessage(self, errorCode || 'ErrorDefault');
                    });
                });
            }

            return Promise.all([promise, player.getDeviceProfile(item)]).then(function (responses) {
                const deviceProfile = responses[1];

                const apiClient = ServerConnections.getApiClient(item.ServerId);

                const mediaSourceId = playOptions.mediaSourceId;
                const audioStreamIndex = playOptions.audioStreamIndex;
                const subtitleStreamIndex = playOptions.subtitleStreamIndex;
                const options = {
                    maxBitrate,
                    startPosition,
                    isPlayback: null,
                    audioStreamIndex,
                    subtitleStreamIndex,
                    startIndex: playOptions.startIndex,
                    enableDirectPlay: null,
                    enableDirectStream: null,
                    allowVideoStreamCopy: null,
                    allowAudioStreamCopy: null
                };

                if (player && !enableLocalPlaylistManagement(player)) {
                    return sendPlaybackListToPlayer(player, playOptions.items, deviceProfile, apiClient, mediaSourceId, options);
                }

                // this reference was only needed by sendPlaybackListToPlayer
                playOptions.items = null;

                return getPlaybackMediaSource(player, apiClient, deviceProfile, item, mediaSourceId, options).then(async (mediaSource) => {
                    const user = await apiClient.getCurrentUser();
                    autoSetNextTracks(prevSource, mediaSource, user.Configuration.RememberAudioSelections, user.Configuration.RememberSubtitleSelections);

                    if (mediaSource.DefaultSubtitleStreamIndex === null || mediaSource.DefaultSubtitleStreamIndex < 0) {
                        mediaSource.DefaultSubtitleStreamIndex = mediaSource.DefaultSecondarySubtitleStreamIndex;
                        mediaSource.DefaultSecondarySubtitleStreamIndex = -1;
                    }

                    const subtitleTrack1 = mediaSource.MediaStreams[mediaSource.DefaultSubtitleStreamIndex];
                    const subtitleTrack2 = mediaSource.MediaStreams[mediaSource.DefaultSecondarySubtitleStreamIndex];

                    if (!this.trackHasSecondarySubtitleSupport(subtitleTrack1, player)
                        || !this.trackHasSecondarySubtitleSupport(subtitleTrack2, player)) {
                        mediaSource.DefaultSecondarySubtitleStreamIndex = -1;
                    }

                    const streamInfo = createStreamInfo(apiClient, item.MediaType, item, mediaSource, startPosition, player);

                    streamInfo.fullscreen = playOptions.fullscreen;

                    const playerData = getPlayerData(player);

                    playerData.isChangingStream = false;
                    playerData.maxStreamingBitrate = maxBitrate;
                    playerData.streamInfo = streamInfo;

                    return player.play(streamInfo).then(function () {
                        loading.hide();
                        onPlaybackStartedFn();
                        onPlaybackStarted(player, playOptions, streamInfo, mediaSource);
                    }, function (err) {
                        // TODO: Improve this because it will report playback start on a failure
                        onPlaybackStartedFn();
                        onPlaybackStarted(player, playOptions, streamInfo, mediaSource);
                        setTimeout(function () {
                            onPlaybackError.call(player, err, {
                                type: getMediaError(err),
                                streamInfo
                            });
                        }, 100);
                    });
                });
            });
        }

        this.getPlaybackInfo = function (item, options) {
            options = options || {};
            const startPosition = options.startPositionTicks || 0;
            const mediaType = options.mediaType || item.MediaType;
            const player = getPlayer(item, options);
            const apiClient = ServerConnections.getApiClient(item.ServerId);

            // Call this just to ensure the value is recorded, it is needed with getSavedMaxStreamingBitrate
            return apiClient.getEndpointInfo().then(function () {
                const maxBitrate = getSavedMaxStreamingBitrate(ServerConnections.getApiClient(item.ServerId), mediaType);

                return player.getDeviceProfile(item).then(function (deviceProfile) {
                    const mediaOptions = {
                        maxBitrate,
                        startPosition,
                        isPlayback: null,
                        audioStreamIndex: options.audioStreamIndex,
                        subtitleStreamIndex: options.subtitleStreamIndex,
                        startIndex: null,
                        enableDirectPlay: null,
                        enableDirectStream: null,
                        allowVideoStreamCopy: null,
                        allowAudioStreamCopy: null
                    };

                    return getPlaybackMediaSource(player, apiClient, deviceProfile, item, options.mediaSourceId, mediaOptions).then(function (mediaSource) {
                        return createStreamInfo(apiClient, item.MediaType, item, mediaSource, startPosition, player);
                    });
                });
            });
        };

        this.getPlaybackMediaSources = function (item, options) {
            options = options || {};
            const startPosition = options.startPositionTicks || 0;
            const mediaType = options.mediaType || item.MediaType;
            // TODO: Remove the true forceLocalPlayer hack
            const player = getPlayer(item, options, true);
            const apiClient = ServerConnections.getApiClient(item.ServerId);

            // Call this just to ensure the value is recorded, it is needed with getSavedMaxStreamingBitrate
            return apiClient.getEndpointInfo().then(function () {
                const maxBitrate = getSavedMaxStreamingBitrate(ServerConnections.getApiClient(item.ServerId), mediaType);

                return player.getDeviceProfile(item).then(function (deviceProfile) {
                    const mediaOptions = {
                        maxBitrate,
                        startPosition,
                        isPlayback: true,
                        audioStreamIndex: null,
                        subtitleStreamIndex: null,
                        enableDirectPlay: null,
                        enableDirectStream: null,
                        allowVideoStreamCopy: null,
                        allowAudioStreamCopy: null
                    };

                    return getPlaybackInfo(player, apiClient, item, deviceProfile, null, null, mediaOptions).then(function (playbackInfoResult) {
                        return playbackInfoResult.MediaSources;
                    });
                });
            });
        };

        createStreamInfo(apiClient, type, item, mediaSource, startPosition, player) {
            let mediaUrl;
            let contentType;
            let transcodingOffsetTicks = 0;
            const playerStartPositionTicks = startPosition;
            const liveStreamId = mediaSource.LiveStreamId;

            let playMethod = 'Transcode';

            const mediaSourceContainer = (mediaSource.Container || '').toLowerCase();
            let directOptions;

            if (mediaSource.MediaStreams && player.useFullSubtitleUrls) {
                mediaSource.MediaStreams.forEach(stream => {
                    if (stream.DeliveryUrl?.startsWith('/')) {
                        stream.DeliveryUrl = apiClient.getUrl(stream.DeliveryUrl);
                    }
                });
            }

            if (type === 'Video' || type === 'Audio') {
                contentType = getMimeType(type.toLowerCase(), mediaSourceContainer);

                if (mediaSource.enableDirectPlay) {
                    mediaUrl = mediaSource.Path;

                    playMethod = 'DirectPlay';
                } else if (mediaSource.StreamUrl) {
                    // Only used for audio
                    mediaUrl = mediaSource.StreamUrl;
                    // Use the default playMethod value of Transcode
                } else if (mediaSource.SupportsDirectPlay || mediaSource.SupportsDirectStream) {
                    directOptions = {
                        Static: true,
                        mediaSourceId: mediaSource.Id,
                        deviceId: apiClient.deviceId(),
                        api_key: apiClient.accessToken()
                    };

                    if (mediaSource.ETag) {
                        directOptions.Tag = mediaSource.ETag;
                    }

                    if (mediaSource.LiveStreamId) {
                        directOptions.LiveStreamId = mediaSource.LiveStreamId;
                    }

                    const prefix = type === 'Video' ? 'Videos' : 'Audio';
                    mediaUrl = apiClient.getUrl(prefix + '/' + item.Id + '/stream.' + mediaSourceContainer, directOptions);

                    playMethod = mediaSource.SupportsDirectPlay ? 'DirectPlay' : 'DirectStream';
                } else if (mediaSource.SupportsTranscoding) {
                    mediaUrl = apiClient.getUrl(mediaSource.TranscodingUrl);

                    if (mediaSource.TranscodingSubProtocol === 'hls') {
                        contentType = 'application/x-mpegURL';
                    } else {
                        contentType = getMimeType(type.toLowerCase(), mediaSource.TranscodingContainer);

                        if (mediaUrl.toLowerCase().indexOf('copytimestamps=true') === -1) {
                            transcodingOffsetTicks = startPosition || 0;
                        }
                    }
                }
            } else {
                // All other media types
                mediaUrl = mediaSource.Path;
                playMethod = 'DirectPlay';
            }

            // Fallback (used for offline items)
            if (!mediaUrl && mediaSource.SupportsDirectPlay) {
                mediaUrl = mediaSource.Path;
                playMethod = 'DirectPlay';
            }

            const resultInfo = {
                url: mediaUrl,
                mimeType: contentType,
                transcodingOffsetTicks: transcodingOffsetTicks,
                playMethod: playMethod,
                playerStartPositionTicks: playerStartPositionTicks,
                item: item,
                mediaSource: mediaSource,
                textTracks: getTextTracks(apiClient, item, mediaSource),
                // TODO: Deprecate
                tracks: getTextTracks(apiClient, item, mediaSource),
                mediaType: type,
                liveStreamId: liveStreamId,
                playSessionId: getParam('playSessionId', mediaUrl),
                title: item.Name
            };

            // This inserts a header link to preload the next audio track in accordance with browser availability
            if (type === 'Audio') {
                let link = document.getElementById('next-audio-prefetch');

                if (!link) {
                    link = document.createElement('link');
                    link.id = 'next-audio-prefetch';
                    link.rel = 'prefetch';
                    link.as = 'audio';
                    document.head.appendChild(link);
                }

                // Update to point to the new upcoming track
                link.href = mediaUrl;
            }

            const backdropUrl = getItemBackdropImageUrl(apiClient, item, {}, true);
            if (backdropUrl) {
                resultInfo.backdropUrl = backdropUrl;
            }

            return resultInfo;
        }

        getTextTracks(apiClient, item, mediaSource) {
            const subtitleStreams = mediaSource.MediaStreams.filter(function (s) {
                return s.Type === 'Subtitle';
            });

            const textStreams = subtitleStreams.filter(function (s) {
                return s.DeliveryMethod === 'External';
            });

            const tracks = [];

            for (let i = 0, length = textStreams.length; i < length; i++) {
                const textStream = textStreams[i];
                let textStreamUrl;

                if (itemHelper.isLocalItem(item)) {
                    textStreamUrl = textStream.Path;
                } else {
                    textStreamUrl = !textStream.IsExternalUrl ? apiClient.getUrl(textStream.DeliveryUrl) : textStream.DeliveryUrl;
                }

                tracks.push({
                    url: textStreamUrl,
                    language: (textStream.Language || 'und'),
                    isDefault: textStream.Index === mediaSource.DefaultSubtitleStreamIndex,
                    index: textStream.Index,
                    format: textStream.Codec
                });
            }

            return tracks;
        }

        getPlaybackMediaSource(player, apiClient, deviceProfile, item, mediaSourceId, options) {
            options.isPlayback = true;

            return getPlaybackInfo(player, apiClient, item, deviceProfile, mediaSourceId, null, options).then(function (playbackInfoResult) {
                if (validatePlaybackInfoResult(self, playbackInfoResult)) {
                    return getOptimalMediaSource(apiClient, item, playbackInfoResult.MediaSources).then(function (mediaSource) {
                        if (mediaSource) {
                            if (mediaSource.RequiresOpening && !mediaSource.LiveStreamId) {
                                options.audioStreamIndex = null;
                                options.subtitleStreamIndex = null;

                                return getLiveStream(player, apiClient, item, playbackInfoResult.PlaySessionId, deviceProfile, mediaSource, options).then(function (openLiveStreamResult) {
                                    return supportsDirectPlay(apiClient, item, openLiveStreamResult.MediaSource).then(function (result) {
                                        openLiveStreamResult.MediaSource.enableDirectPlay = result;
                                        return openLiveStreamResult.MediaSource;
                                    });
                                });
                            } else {
                                if (item.AlbumId !== null) {
                                    return apiClient.getItem(apiClient.getCurrentUserId(), item.AlbumId).then(function(result) {
                                        mediaSource.albumNormalizationGain = result.NormalizationGain;
                                        return mediaSource;
                                    });
                                }
                                return mediaSource;
                            }
                        } else {
                            showPlaybackInfoErrorMessage(self, `PlaybackError.${MediaError.NO_MEDIA_ERROR}`);
                            return Promise.reject();
                        }
                    });
                } else {
                    return Promise.reject();
                }
            });
        }

        getPlayer(item, playOptions, forceLocalPlayers) {
            const serverItem = isServerItem(item);
            return getAutomaticPlayers(self, forceLocalPlayers).filter(function (p) {
                if (p.canPlayMediaType(item.MediaType)) {
                    if (serverItem) {
                        if (p.canPlayItem) {
                            return p.canPlayItem(item, playOptions);
                        }
                        return true;
                    } else if (item.Url && p.canPlayUrl) {
                        return p.canPlayUrl(item.Url);
                    }
                }

                return false;
            })[0];
        }

        this.getItemFromPlaylistItemId = function (playlistItemId) {
            let item;
            let itemIndex;
            const playlist = this._playQueueManager.getPlaylist();

            for (let i = 0, length = playlist.length; i < length; i++) {
                if (playlist[i].PlaylistItemId === playlistItemId) {
                    item = playlist[i];
                    itemIndex = i;
                    break;
                }
            }

            return {
                Item: item,
                Index: itemIndex
            };
        };

        this.setCurrentPlaylistItem = function (playlistItemId, player) {
            hijackMediaElementForCrossfade();

            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setCurrentPlaylistItem(playlistItemId);
            }

            const newItem = this.getItemFromPlaylistItemId(playlistItemId);

            if (newItem.Item) {
                const newItemPlayOptions = newItem.Item.playOptions || getDefaultPlayOptions();

                playInternal(newItem.Item, newItemPlayOptions, function () {
                    setPlaylistState(newItem.Item.PlaylistItemId, newItem.Index);
                });
            }
        };

        this.removeFromPlaylist = function (playlistItemIds, player) {
            if (!playlistItemIds) {
                throw new Error('Invalid playlistItemIds');
            }

            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.removeFromPlaylist(playlistItemIds);
            }

            const removeResult = this._playQueueManager.removeFromPlaylist(playlistItemIds);

            if (removeResult.result === 'empty') {
                return this.stop(player);
            }

            const isCurrentIndex = removeResult.isCurrentIndex;

            Events.trigger(player, 'playlistitemremove', [
                {
                    playlistItemIds: playlistItemIds
                }
            ]);

            if (isCurrentIndex) {
                return this.setCurrentPlaylistItem(this._playQueueManager.getPlaylist()[0].PlaylistItemId, player);
            }

            return Promise.resolve();
        };

        this.movePlaylistItem = function (playlistItemId, newIndex, player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.movePlaylistItem(playlistItemId, newIndex);
            }

            const moveResult = this._playQueueManager.movePlaylistItem(playlistItemId, newIndex);

            if (moveResult.result === 'noop') {
                return;
            }

            Events.trigger(player, 'playlistitemmove', [
                {
                    playlistItemId: moveResult.playlistItemId,
                    newIndex: moveResult.newIndex
                }
            ]);
        };

        this.getCurrentPlaylistIndex = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getCurrentPlaylistIndex();
            }

            return this._playQueueManager.getCurrentPlaylistIndex();
        };

        this.getCurrentPlaylistItemId = function (player) {
            player = player || this._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getCurrentPlaylistItemId();
            }

            return this._playQueueManager.getCurrentPlaylistItemId();
        };

        this.channelUp = function (player) {
            player = player || this._currentPlayer;
            return this.nextTrack(player);
        };

        this.channelDown = function (player) {
            player = player || this._currentPlayer;
            return this.previousTrack(player);
        };

        getPreviousSource(player) {
            const prevSource = this.currentMediaSource(player);
            const prevPlayerData = getPlayerData(player);
            return {
                ...prevSource,
                DefaultAudioStreamIndex: prevPlayerData.audioStreamIndex,
                DefaultSubtitleStreamIndex: prevPlayerData.subtitleStreamIndex,
                DefaultSecondarySubtitleStreamIndex: prevPlayerData.secondarySubtitleStreamIndex
            };
        }

        this.nextTrack = function (player) {
            player = player || this._currentPlayer;

            // Check if crossfading is enabled for manual track changes
            const crossfadeDuration = getCrossfadeDuration();
            const shouldCrossfade = crossfadeDuration > 0 && !xDuration.busy;

            if (shouldCrossfade) {
                console.debug('Manual next track with crossfading enabled');
                hijackMediaElementForCrossfade(true); // Mark as manual trigger

                // For manual skips, we want immediate crossfading
                xDuration.t0 = performance.now();

                // Set a flag to indicate we're doing a manual crossfade
                // This will prevent the normal playback stopping in onPlaybackChanging
                player._isManualCrossfading = true;
            }

            if (player && !enableLocalPlaylistManagement(player)) {
                return player.nextTrack();
            }

            const newItemInfo = this._playQueueManager.getNextItemInfo();

            if (newItemInfo) {
                console.debug('playing next track');

                const newItemPlayOptions = newItemInfo.item.playOptions || getDefaultPlayOptions();

                playInternal(newItemInfo.item, newItemPlayOptions, function () {
                    setPlaylistState(newItemInfo.item.PlaylistItemId, newItemInfo.index);
                    // Clear the manual crossfade flag after starting the new track
                    if (player) {
                        delete player._isManualCrossfading;
                    }
                }, getPreviousSource(player));
            }
        };

        this.previousTrack = function (player) {
            player = player || this._currentPlayer;

            // Check if crossfading is enabled for manual track changes
            const crossfadeDuration = getCrossfadeDuration();
            const shouldCrossfade = crossfadeDuration > 0 && !xDuration.busy;

            if (shouldCrossfade) {
                console.debug('Manual previous track with crossfading enabled');
                hijackMediaElementForCrossfade(true); // Mark as manual trigger

                // For manual skips, we want immediate crossfading
                xDuration.t0 = performance.now();

                // Set a flag to indicate we're doing a manual crossfade
                player._isManualCrossfading = true;
            }

            if (player && !enableLocalPlaylistManagement(player)) {
                return player.previousTrack();
            }

            const newItemInfo = this._playQueueManager.getPreviousItemInfo();

            if (newItemInfo) {
                console.debug('playing previous track');

                const newItemPlayOptions = newItemInfo.item.playOptions || getDefaultPlayOptions();

                playInternal(newItemInfo.item, newItemPlayOptions, function () {
                    setPlaylistState(newItemInfo.item.PlaylistItemId, newItemInfo.index);
                    // Clear the manual crossfade flag after starting the new track
                    if (player) {
                        delete player._isManualCrossfading;
                    }
                }, getPreviousSource(player));
            }
        };

        this.queue = function (options, player = this._currentPlayer) {
            return queue(options, '', player);
        };

        this.queueNext = function (options, player = this._currentPlayer) {
            return queue(options, 'next', player);
        };

        queue(options, mode, player) {
            player = player || this._currentPlayer;

            if (!player) {
                return this.play(options);
            }

            if (options.items) {
                return translateItemsForPlayback(options.items, options).then(function (items) {
                    // TODO: Handle options.startIndex for photos
                    return queueAll(items, mode, player);
                });
            } else {
                if (!options.serverId) {
                    throw new Error('serverId required!');
                }

                return getItemsForPlayback(options.serverId, {
                    Ids: options.ids.join(',')
                }).then(function (result) {
                    return translateItemsForPlayback(result.Items, options).then(function (items) {
                        // TODO: Handle options.startIndex for photos
                        return queueAll(items, mode, player);
                    });
                });
            }
        }

        queueAll(items, mode, player) {
            if (!items.length) {
                return Promise.resolve();
            }

            if (!player.isLocalPlayer) {
                if (mode === 'next') {
                    player.queueNext({
                        items: items
                    });
                } else {
                    player.queue({
                        items: items
                    });
                }
                return Promise.resolve();
            }

            const queueDirectToPlayer = player && !enableLocalPlaylistManagement(player);

            if (queueDirectToPlayer) {
                const apiClient = ServerConnections.getApiClient(items[0].ServerId);

                player.getDeviceProfile(items[0]).then(function (profile) {
                    setStreamUrls(items, profile, this.getMaxStreamingBitrate(player), apiClient, 0).then(function () {
                        if (mode === 'next') {
                            player.queueNext(items);
                        } else {
                            player.queue(items);
                        }
                    });
                });

                return Promise.resolve();
            }

            if (mode === 'next') {
                this._playQueueManager.queueNext(items);
            } else {
                this._playQueueManager.queue(items);
            }
            Events.trigger(player, 'playlistitemadd');
            return Promise.resolve();
        }

        onPlayerProgressInterval() {
            const player = this;
            sendProgressUpdate(player, 'timeupdate');
        }

        startPlaybackProgressTimer(player) {
            stopPlaybackProgressTimer(player);

            player._progressInterval = setInterval(onPlayerProgressInterval.bind(player), 10000);
        }

        stopPlaybackProgressTimer(player) {
            if (player._progressInterval) {
                clearInterval(player._progressInterval);
                player._progressInterval = null;
            }
        }

        onPlaybackStarted(player, playOptions, streamInfo, mediaSource) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            setCurrentPlayerInternal(player);

            const playerData = getPlayerData(player);

            playerData.streamInfo = streamInfo;

            streamInfo.playbackStartTimeTicks = new Date().getTime() * 10000;

            if (mediaSource) {
                playerData.audioStreamIndex = mediaSource.DefaultAudioStreamIndex;
                playerData.subtitleStreamIndex = mediaSource.DefaultSubtitleStreamIndex;
                playerData.secondarySubtitleStreamIndex = mediaSource.DefaultSecondarySubtitleStreamIndex;
            } else {
                playerData.audioStreamIndex = null;
                playerData.subtitleStreamIndex = null;
                playerData.secondarySubtitleStreamIndex = null;
            }

            this._playNextAfterEnded = true;
            const isFirstItem = playOptions.isFirstItem;
            const fullscreen = playOptions.fullscreen;

            const state = this.getPlayerState(player, streamInfo.item, streamInfo.mediaSource);

            reportPlayback(self, state, player, true, state.NowPlayingItem.ServerId, 'reportPlaybackStart');

            state.IsFirstItem = isFirstItem;
            state.IsFullscreen = fullscreen;
            Events.trigger(player, 'playbackstart', [state]);
            Events.trigger(self, 'playbackstart', [player, state]);

            // only used internally as a safeguard to avoid reporting other events to the server before playback start
            streamInfo.started = true;

            startPlaybackProgressTimer(player);
        }

        onPlaybackStartedFromSelfManagingPlayer(e, item, mediaSource) {
            const player = this;
            setCurrentPlayerInternal(player);

            const playOptions = item.playOptions || getDefaultPlayOptions();
            const isFirstItem = playOptions.isFirstItem;
            const fullscreen = playOptions.fullscreen;

            playOptions.isFirstItem = false;

            const playerData = getPlayerData(player);
            playerData.streamInfo = {};

            const streamInfo = playerData.streamInfo;
            streamInfo.playbackStartTimeTicks = new Date().getTime() * 10000;

            const state = this.getPlayerState(player, item, mediaSource);

            reportPlayback(self, state, player, true, state.NowPlayingItem.ServerId, 'reportPlaybackStart');

            state.IsFirstItem = isFirstItem;
            state.IsFullscreen = fullscreen;
            Events.trigger(player, 'playbackstart', [state]);
            Events.trigger(self, 'playbackstart', [player, state]);

            // only used internally as a safeguard to avoid reporting other events to the server before playback start
            streamInfo.started = true;

            startPlaybackProgressTimer(player);
        }

        onPlaybackStoppedFromSelfManagingPlayer(e, playerStopInfo) {
            const player = this;

            stopPlaybackProgressTimer(player);
            const state = this.getPlayerState(player, playerStopInfo.item, playerStopInfo.mediaSource);

            const nextItem = playerStopInfo.nextItem;
            const nextMediaType = playerStopInfo.nextMediaType;

            const playbackStopInfo = {
                player: player,
                state: state,
                nextItem: (nextItem ? nextItem.item : null),
                nextMediaType: nextMediaType
            };

            state.NextMediaType = nextMediaType;

            const streamInfo = getPlayerData(player).streamInfo;

            // only used internally as a safeguard to avoid reporting other events to the server after playback stopped
            streamInfo.ended = true;

            if (isServerItem(playerStopInfo.item)) {
                state.PlayState.PositionTicks = (playerStopInfo.positionMs || 0) * 10000;

                reportPlayback(self, state, player, true, playerStopInfo.item.ServerId, 'reportPlaybackStopped');
            }

            state.NextItem = playbackStopInfo.nextItem;

            Events.trigger(player, 'playbackstop', [state]);
            Events.trigger(self, 'playbackstop', [playbackStopInfo]);

            const nextItemPlayOptions = nextItem ? (nextItem.item.playOptions || getDefaultPlayOptions()) : getDefaultPlayOptions();
            const newPlayer = nextItem ? getPlayer(nextItem.item, nextItemPlayOptions) : null;

            if (newPlayer !== player) {
                destroyPlayer(player);
                removeCurrentPlayer(player);
            }
        }

        /**
         * @param {object} streamInfo
         * @param {MediaError} errorType
         * @param {boolean} currentlyPreventsVideoStreamCopy
         * @param {boolean} currentlyPreventsAudioStreamCopy
         * @returns {boolean} Returns true if the stream should be retried by transcoding.
         */
        enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy) {
            return streamInfo.mediaSource.SupportsTranscoding
                && (!currentlyPreventsVideoStreamCopy || !currentlyPreventsAudioStreamCopy);
        }

        /**
         * Playback error handler.
         * @param {Error} e
         * @param {object} error
         * @param {object} error.streamInfo
         * @param {MediaError} error.type
         */
        onPlaybackError(e, error) {
            destroyWaveSurferInstance().catch(console.error);
            const player = this;
            error = error || {};

            const errorType = error.type;

            console.warn('[playbackmanager] onPlaybackError:', e, error);

            const streamInfo = error.streamInfo || getPlayerData(player).streamInfo;

            if (streamInfo?.url) {
                const currentlyPreventsVideoStreamCopy = streamInfo.url.toLowerCase().indexOf('allowvideostreamcopy=false') !== -1;
                const currentlyPreventsAudioStreamCopy = streamInfo.url.toLowerCase().indexOf('allowaudiostreamcopy=false') !== -1;

                // Auto switch to transcoding
                if (enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy)) {
                    const startTime = getCurrentTicks(player) || streamInfo.playerStartPositionTicks;

                    changeStream(player, startTime, {
                        // force transcoding
                        EnableDirectPlay: false,
                        EnableDirectStream: false,
                        AllowVideoStreamCopy: false,
                        AllowAudioStreamCopy: currentlyPreventsAudioStreamCopy || currentlyPreventsVideoStreamCopy ? false : null
                    });

                    return;
                }
            }

            Events.trigger(self, 'playbackerror', [errorType]);

            onPlaybackStopped.call(player, e, `.${errorType}`);
        }

        onPlaybackStopped(e, displayErrorCode) {
            const player = this;

            if (getPlayerData(player).isChangingStream) {
                return;
            }

            stopPlaybackProgressTimer(player);

            // User clicked stop or content ended
            const state = this.getPlayerState(player);
            const data = getPlayerData(player);
            const streamInfo = data.streamInfo;

            const errorOccurred = displayErrorCode && typeof (displayErrorCode) === 'string';

            const nextItem = this._playNextAfterEnded && !errorOccurred ? this._playQueueManager.getNextItemInfo() : null;

            const nextMediaType = (nextItem ? nextItem.item.MediaType : null);

            const playbackStopInfo = {
                player: player,
                state: state,
                nextItem: (nextItem ? nextItem.item : null),
                nextMediaType: nextMediaType
            };

            state.NextMediaType = nextMediaType;

            if (streamInfo && isServerItem(streamInfo.item)) {
                if (player.supportsProgress === false && state.PlayState && !state.PlayState.PositionTicks) {
                    state.PlayState.PositionTicks = streamInfo.item.RunTimeTicks;
                }

                // only used internally as a safeguard to avoid reporting other events to the server after playback stopped
                streamInfo.ended = true;

                reportPlayback(self, state, player, true, streamInfo.item.ServerId, 'reportPlaybackStopped');
            }

            state.NextItem = playbackStopInfo.nextItem;

            if (!nextItem) {
                this._playQueueManager.reset();
            }

            Events.trigger(player, 'playbackstop', [state]);
            Events.trigger(self, 'playbackstop', [playbackStopInfo]);

            const nextItemPlayOptions = nextItem ? (nextItem.item.playOptions || getDefaultPlayOptions()) : getDefaultPlayOptions();
            const newPlayer = nextItem ? getPlayer(nextItem.item, nextItemPlayOptions) : null;

            if (newPlayer !== player) {
                data.streamInfo = null;
                destroyPlayer(player);
                removeCurrentPlayer(player);
            }

            if (errorOccurred) {
                showPlaybackInfoErrorMessage(self, 'PlaybackError' + displayErrorCode);
            } else if (nextItem) {
                if (nextMediaType !== MediaType.Video) {
                    this.nextTrack();
                } else {
                    const apiClient = ServerConnections.getApiClient(nextItem.item.ServerId);

                    apiClient.getCurrentUser().then(function (user) {
                        if (user.Configuration.EnableNextEpisodeAutoPlay) {
                            this.nextTrack();
                        }
                    });
                }
            }
        }

        onPlaybackChanging(activePlayer, newPlayer, newItem) {
            const state = this.getPlayerState(activePlayer);

            const serverId = this.currentItem(activePlayer).ServerId;

            // User started playing something new while existing content is playing
            let promise;

            stopPlaybackProgressTimer(activePlayer);
            unbindStopped(activePlayer);

            // If this is a manual crossfade, don't stop the current player
            // Let the crossfade complete naturally
            if (activePlayer._isManualCrossfading) {
                console.debug('Manual crossfade in progress, skipping player stop');
                promise = Promise.resolve();
            } else if (activePlayer === newPlayer) {
                // If we're staying with the same player, stop it
                promise = activePlayer.stop(false);
            } else {
                // If we're switching players, tear down the current one
                promise = activePlayer.stop(true);
            }

            return promise.then(function () {
                // Clear the data since we were not listening 'stopped'
                getPlayerData(activePlayer).streamInfo = null;

                bindStopped(activePlayer);

                if (enableLocalPlaylistManagement(activePlayer)) {
                    reportPlayback(self, state, activePlayer, true, serverId, 'reportPlaybackStopped');
                }

                Events.trigger(self, 'playbackstop', [{
                    player: activePlayer,
                    state: state,
                    nextItem: newItem,
                    nextMediaType: newItem.MediaType
                }]);
            });
        }

        bindStopped(player) {
            if (enableLocalPlaylistManagement(player)) {
                Events.off(player, 'stopped', onPlaybackStopped);
                Events.on(player, 'stopped', onPlaybackStopped);
            }
        }

        onPlaybackTimeUpdate() {
            const player = this;
            if (timeRunningOut(player)) {
                // Crossfade is triggering the next track, so prevent onPlaybackStopped
                // from auto-advancing again when the old track ends
                this._playNextAfterEnded = false;
                this.nextTrack();
            }

            sendProgressUpdate(player, 'timeupdate');
        }

        onPlaybackPause() {
            const player = this;
            sendProgressUpdate(player, 'pause');
        }

        onPlaybackUnpause() {
            const player = this;
            sendProgressUpdate(player, 'unpause');
        }

        validatePlayerOperation(player, operation) {
            if (!player) {
                throw new Error(`Cannot ${operation}: No active player`);
            }
            if (!player.isLocalPlayer && !enableLocalPlaylistManagement(player)) {
                // For remote players, just log a warning but allow the operation
                console.warn(`[PlaybackManager] ${operation} on remote player may have limited functionality`);
            }
        }

        onPlaybackSeeked() {
            const player = this;
            // Immediately update progress after seeking to fix UI synchronization
            // Also ensures remote sync for multi-device scenarios
            sendProgressUpdate(player, 'seeked');
        }

        onPlaybackVolumeChange() {
            const player = this;
            sendProgressUpdate(player, 'volumechange');
        }

        onRepeatModeChange() {
            const player = this;
            sendProgressUpdate(player, 'repeatmodechange');
        }

        onShuffleQueueModeChange() {
            const player = this;
            sendProgressUpdate(player, 'shufflequeuemodechange');
        }

        onPlaylistItemMove() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemmove', true);
        }

        onPlaylistItemRemove() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemremove', true);
        }

        onPlaylistItemAdd() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemadd', true);
        }

        unbindStopped(player) {
            Events.off(player, 'stopped', onPlaybackStopped);
        }

        initLegacyVolumeMethods(player) {
            player.getVolume = function () {
                return player.volume();
            };
            player.setVolume = function (val) {
                return player.volume(val);
            };
        }

        initMediaPlayer(player) {
            players.push(player);
            players.sort(function (a, b) {
                return (a.priority || 0) - (b.priority || 0);
            });

            if (player.isLocalPlayer !== false) {
                player.isLocalPlayer = true;
            }

            player.currentState = {};

            if (!player.getVolume || !player.setVolume) {
                initLegacyVolumeMethods(player);
            }

            if (enableLocalPlaylistManagement(player)) {
                Events.on(player, 'error', onPlaybackError);
                Events.on(player, 'timeupdate', onPlaybackTimeUpdate);
                Events.on(player, 'seeked', onPlaybackSeeked);
                Events.on(player, 'pause', onPlaybackPause);
                Events.on(player, 'unpause', onPlaybackUnpause);
                Events.on(player, 'volumechange', onPlaybackVolumeChange);
                Events.on(player, 'repeatmodechange', onRepeatModeChange);
                Events.on(player, 'shufflequeuemodechange', onShuffleQueueModeChange);
                Events.on(player, 'playlistitemmove', onPlaylistItemMove);
                Events.on(player, 'playlistitemremove', onPlaylistItemRemove);
                Events.on(player, 'playlistitemadd', onPlaylistItemAdd);
            } else if (player.isLocalPlayer) {
                Events.on(player, 'itemstarted', onPlaybackStartedFromSelfManagingPlayer);
                Events.on(player, 'itemstopped', onPlaybackStoppedFromSelfManagingPlayer);
                Events.on(player, 'timeupdate', onPlaybackTimeUpdate);
                Events.on(player, 'seeked', onPlaybackSeeked);
                Events.on(player, 'pause', onPlaybackPause);
                Events.on(player, 'unpause', onPlaybackUnpause);
                Events.on(player, 'volumechange', onPlaybackVolumeChange);
                Events.on(player, 'repeatmodechange', onRepeatModeChange);
                Events.on(player, 'shufflequeuemodechange', onShuffleQueueModeChange);
                Events.on(player, 'playlistitemmove', onPlaylistItemMove);
                Events.on(player, 'playlistitemremove', onPlaylistItemRemove);
                Events.on(player, 'playlistitemadd', onPlaylistItemAdd);
            }

            if (player.isLocalPlayer) {
                bindToFullscreenChange(player);
            }
            bindStopped(player);
        }

        Events.on(pluginManager, 'registered', function (e, plugin) {
            if (plugin.type === PluginType.MediaPlayer) {
                initMediaPlayer(plugin);
            }
        });

        pluginManager.ofType(PluginType.MediaPlayer).forEach(initMediaPlayer);

        sendProgressUpdate(player, progressEventName, reportPlaylist) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            const state = this.getPlayerState(player);

            if (state.NowPlayingItem) {
                const serverId = state.NowPlayingItem.ServerId;

                const streamInfo = getPlayerData(player).streamInfo;

                if (streamInfo?.started && !streamInfo.ended) {
                    reportPlayback(self, state, player, reportPlaylist, serverId, 'reportPlaybackProgress', progressEventName);
                }

                if (streamInfo?.liveStreamId
                    && (new Date().getTime() - (streamInfo.lastMediaInfoQuery || 0) >= 600000)
                ) {
                    getLiveStreamMediaInfo(player, streamInfo, this.currentMediaSource(player), streamInfo.liveStreamId, serverId);
                }
            }
        }

        getLiveStreamMediaInfo(player, streamInfo, mediaSource, liveStreamId, serverId) {
            console.debug('getLiveStreamMediaInfo');

            streamInfo.lastMediaInfoQuery = new Date().getTime();

            ServerConnections.getApiClient(serverId).getLiveStreamMediaInfo(liveStreamId).then(function (info) {
                mediaSource.MediaStreams = info.MediaStreams;
                Events.trigger(player, 'mediastreamschange');
            }, function () {
                // Swallow errors
            });
        }

        this.onAppClose = function () {
            const player = this._currentPlayer;

            // Try to report playback stopped before the app closes
            if (player && this.isPlaying(player)) {
                this._playNextAfterEnded = false;
                onPlaybackStopped.call(player);
            }
        };

        this.playbackStartTime = function (player = this._currentPlayer) {
            if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
                return player.playbackStartTime();
            }

            const streamInfo = getPlayerData(player).streamInfo;
            return streamInfo ? streamInfo.playbackStartTimeTicks : null;
        };

        if (supportsAppFeature('remotecontrol')) {
            import('../../scripts/serverNotifications').then(({ default: serverNotifications }) => {
                Events.on(serverNotifications, 'ServerShuttingDown', this.setDefaultPlayerActive.bind(self));
                Events.on(serverNotifications, 'ServerRestarting', this.setDefaultPlayerActive.bind(self));
            });
        }

        bindMediaSegmentManager(self);
        bindMediaSessionSubscriber(self);
        this._skipSegment = bindSkipSegment(self);
    }

    getCurrentPlayer() {
        return this._currentPlayer;
    }

    currentTime(player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
            return player.currentTime();
        }

        return this.getCurrentTicks(player) / 10000;
    }

    getNextItem() {
        return this._playQueueManager.getNextItemInfo();
    }

    nextItem(player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.nextItem();
        }

        const nextItem = this._playQueueManager.getNextItemInfo();

        if (!nextItem?.item) {
            return Promise.reject();
        }

        const apiClient = ServerConnections.getApiClient(nextItem.item.ServerId);
        return apiClient.getItem(apiClient.getCurrentUserId(), nextItem.item.Id);
    }

    promptToSkip(mediaSegment, player = this._currentPlayer) {
        if (mediaSegment && this._skipSegment) {
            Events.trigger(player, PlayerEvent.PromptSkip, [mediaSegment]);
        }
    }

    canQueue(item) {
        if (item.Type === 'MusicAlbum' || item.Type === 'MusicArtist' || item.Type === 'MusicGenre') {
            return this.canQueueMediaType('Audio');
        }
        return this.canQueueMediaType(item.MediaType);
    }

    canQueueMediaType(mediaType) {
        if (this._currentPlayer) {
            return this._currentPlayer.canPlayMediaType(mediaType);
        }

        return false;
    }

    isMuted(player = this._currentPlayer) {
        if (player) {
            return player.isMuted();
        }

        return false;
    }

    setMute(mute, player = this._currentPlayer) {
        if (player) {
            player.setMute(mute);
        }
    }

    toggleMute(mute, player = this._currentPlayer) {
        if (player) {
            if (player.toggleMute) {
                player.toggleMute();
            } else {
                player.setMute(!player.isMuted());
            }
        }
    }

    toggleDisplayMirroring() {
        this.enableDisplayMirroring(!this.enableDisplayMirroring());
    }

    enableDisplayMirroring(enabled) {
        if (enabled !== null) {
            const val = enabled ? '1' : '0';
            appSettings.set('displaymirror', val);
            return;
        }

        return (appSettings.get('displaymirror') || '') !== '0';
    }

    nextChapter(player = this._currentPlayer) {
        const item = this.currentItem(player);

        const ticks = this.getCurrentTicks(player);

        const nextChapter = (item.Chapters || []).filter(function (i) {
            return i.StartPositionTicks > ticks;
        })[0];

        if (nextChapter) {
            this.seek(nextChapter.StartPositionTicks, player);
        } else {
            this.nextTrack(player);
        }
    }

    previousChapter(player = this._currentPlayer) {
        const item = this.currentItem(player);

        let ticks = this.getCurrentTicks(player);

        // Go back 10 seconds
        ticks -= 100000000;

        // If there's no previous track, then at least rewind to beginning
        if (this.getCurrentPlaylistIndex(player) === 0) {
            ticks = Math.max(ticks, 0);
        }

        const previousChapters = (item.Chapters || []).filter(function (i) {
            return i.StartPositionTicks <= ticks;
        });

        if (previousChapters.length) {
            this.seek(previousChapters[previousChapters.length - 1].StartPositionTicks, player);
        } else {
            this.previousTrack(player);
        }
    }

    fastForward(player = this._currentPlayer) {
        if (player.fastForward !== null) {
            player.fastForward(userSettings.skipForwardLength());
            return;
        }

        // Go back 15 seconds
        const offsetTicks = userSettings.skipForwardLength() * 10000;

        this.seekRelative(offsetTicks, player);
    }

    rewind(player = this._currentPlayer) {
        if (player.rewind !== null) {
            player.rewind(userSettings.skipBackLength());
            return;
        }

        // Go back 15 seconds
        const offsetTicks = 0 - (userSettings.skipBackLength() * 10000);

        this.seekRelative(offsetTicks, player);
    }

    seekPercent(percent, player = this._currentPlayer) {
        let ticks = this.duration(player) || 0;

        percent /= 100;
        ticks *= percent;
        this.seek(parseInt(ticks, 10), player);
    }

    seekMs(ms, player = this._currentPlayer) {
        const ticks = ms * 10000;
        this.seek(ticks, player);
    }

    async playTrailers(item) {
        const player = this._currentPlayer;

        if (player?.playTrailers) {
            return player.playTrailers(item);
        }

        const apiClient = ServerConnections.getApiClient(item.ServerId);

        let items;

        if (item.LocalTrailerCount) {
            items = await apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id);
        }

        if (!items?.length) {
            items = (item.RemoteTrailers || []).map((t) => {
                return {
                    Name: t.Name || (item.Name + ' Trailer'),
                    Url: t.Url,
                    MediaType: 'Video',
                    Type: 'Trailer',
                    ServerId: apiClient.serverId()
                };
            });
        }

        if (items.length) {
            return this.play({
                items
            });
        }

        return Promise.reject();
    }

    getSubtitleUrl(textStream, serverId) {
        const apiClient = ServerConnections.getApiClient(serverId);

        return !textStream.IsExternalUrl ? apiClient.getUrl(textStream.DeliveryUrl) : textStream.DeliveryUrl;
    }

    stop(player) {
        player = player || this._currentPlayer;
        if (!player) {
            return Promise.resolve();
        }

        try {
            // Cancel any pending crossfade operations
            cancelCrossfadeTimeouts();

            if (enableLocalPlaylistManagement(player)) {
                this._playNextAfterEnded = false;
            }

            // TODO: remove second param
            return player.stop(true, true);
        } catch (error) {
            console.error('[PlaybackManager] Error stopping playback:', error);
            return Promise.reject(error);
        }
    }

    getBufferedRanges(player = this._currentPlayer) {
        if (player?.getBufferedRanges) {
            return player.getBufferedRanges();
        }

        return [];
    }

    playPause(player = this._currentPlayer) {
        if (player) {
            if (player.playPause) {
                return player.playPause();
            }

            if (player.paused()) {
                return this.unpause(player);
            } else {
                return this.pause(player);
            }
        }
    }

    paused(player = this._currentPlayer) {
        if (player) {
            return player.paused();
        }
    }

    pause(player = this._currentPlayer) {
        if (!player) {
            return Promise.resolve();
        }

        validatePlayerOperation(player, 'pause');

        try {
            return player.pause();
        } catch (error) {
            console.error('[PlaybackManager] Error pausing playback:', error);
            return Promise.reject(error);
        }
    }

    unpause(player = this._currentPlayer) {
        if (player) {
            player.unpause();
        }
    }

    setPlaybackRate(value, player = this._currentPlayer) {
        if (player?.setPlaybackRate) {
            player.setPlaybackRate(value);

            // Save the new playback rate in the browser session, to restore when playing a new video.
            sessionStorage.setItem('playbackRateSpeed', value);
        }
    }

    getPlaybackRate(player = this._currentPlayer) {
        if (player?.getPlaybackRate) {
            return player.getPlaybackRate();
        }

        return null;
    }

    instantMix(item, player = this._currentPlayer) {
        if (player?.instantMix) {
            return player.instantMix(item);
        }

        const apiClient = ServerConnections.getApiClient(item.ServerId);

        const options = {
            UserId: apiClient.getCurrentUserId(),
            Limit: 200
        };

        const instance = this;

        apiClient.getInstantMixFromItem(item.Id, options).then(function (result) {
            instance.play({
                items: result.Items
            });
        });
    }

    shuffle(shuffleItem, player = this._currentPlayer) {
        if (player?.shuffle) {
            return player.shuffle(shuffleItem);
        }

        return this.play({ items: [shuffleItem], shuffle: true });
    }

    audioTracks(player = this._currentPlayer) {
        if (player.audioTracks) {
            const result = player.audioTracks();
            if (result) {
                return result.sort(itemHelper.sortTracks);
            }
        }

        const mediaSource = this.currentMediaSource(player);

        const mediaStreams = mediaSource?.MediaStreams || [];
        return mediaStreams.filter(function (s) {
            return s.Type === 'Audio';
        }).sort(itemHelper.sortTracks);
    }

    subtitleTracks(player = this._currentPlayer) {
        if (player.subtitleTracks) {
            const result = player.subtitleTracks();
            if (result) {
                return result.sort(itemHelper.sortTracks);
            }
        }

        const mediaSource = this.currentMediaSource(player);

        const mediaStreams = mediaSource?.MediaStreams || [];
        return mediaStreams.filter(function (s) {
            return s.Type === 'Subtitle';
        }).sort(itemHelper.sortTracks);
    }

    getSupportedCommands(player) {
        player = player || this._currentPlayer || { isLocalPlayer: true };

        if (player.isLocalPlayer) {
            const list = [
                'GoHome',
                'GoToSettings',
                'VolumeUp',
                'VolumeDown',
                'Mute',
                'Unmute',
                'ToggleMute',
                'SetVolume',
                'SetAudioStreamIndex',
                'SetSubtitleStreamIndex',
                'SetMaxStreamingBitrate',
                'DisplayContent',
                'GoToSearch',
                'DisplayMessage',
                'SetRepeatMode',
                'SetShuffleQueue',
                'PlayMediaSource',
                'PlayTrailers'
            ];

            if (supportsAppFeature('fullscreenchange')) {
                list.push('ToggleFullscreen');
            }

            if (player.supports) {
                if (player.supports('PictureInPicture')) {
                    list.push('PictureInPicture');
                }
                if (player.supports('AirPlay')) {
                    list.push('AirPlay');
                }
                if (player.supports('SetBrightness')) {
                    list.push('SetBrightness');
                }
                if (player.supports('SetAspectRatio')) {
                    list.push('SetAspectRatio');
                }
                if (player.supports('PlaybackRate')) {
                    list.push('PlaybackRate');
                }
            }

            return list;
        }

        const info = this.getPlayerInfo();
        return info ? info.supportedCommands : [];
    }

    setRepeatMode(value, player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.setRepeatMode(value);
        }

        this._playQueueManager.setRepeatMode(value);
        Events.trigger(player, 'repeatmodechange');
    }

    getRepeatMode(player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.getRepeatMode();
        }

        return this._playQueueManager.getRepeatMode();
    }

    setQueueShuffleMode(value, player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.setQueueShuffleMode(value);
        }

        this._playQueueManager.setShuffleMode(value);
        Events.trigger(player, 'shufflequeuemodechange');
    }

    getQueueShuffleMode(player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.getQueueShuffleMode();
        }

        return this._playQueueManager.getShuffleMode();
    }

    toggleQueueShuffleMode(player = this._currentPlayer) {
        let currentvalue;
        if (player && !enableLocalPlaylistManagement(player)) {
            currentvalue = player.getQueueShuffleMode();
            switch (currentvalue) {
                case 'Shuffle':
                    player.setQueueShuffleMode('Sorted');
                    break;
                case 'Sorted':
                    player.setQueueShuffleMode('Shuffle');
                    break;
                default:
                    throw new TypeError('current value for shufflequeue is invalid');
            }
        } else {
            this._playQueueManager.toggleShuffleMode();
        }
        Events.trigger(player, 'shufflequeuemodechange');
    }

    clearQueue(clearCurrentItem = false, player = this._currentPlayer) {
        if (player && !enableLocalPlaylistManagement(player)) {
            return player.clearQueue(clearCurrentItem);
        }

        this._playQueueManager.clearPlaylist(clearCurrentItem);
        Events.trigger(player, 'playlistitemremove');
    }

    trySetActiveDeviceName(name) {
        name = normalizeName(name);

        const instance = this;
        instance.getTargets().then(function (result) {
            const target = result.filter(function (p) {
                return normalizeName(p.name) === name;
            })[0];

            if (target) {
                instance.trySetActivePlayer(target.playerName, target);
            }
        });
    }

    displayContent(options, player = this._currentPlayer) {
        if (player?.displayContent) {
            player.displayContent(options);
        }
    }

    beginPlayerUpdates(player) {
        if (player.beginPlayerUpdates) {
            player.beginPlayerUpdates();
        }
    }

    endPlayerUpdates(player) {
        if (player.endPlayerUpdates) {
            player.endPlayerUpdates();
        }
    }

    setDefaultPlayerActive() {
        this.setActivePlayer('localplayer');
    }

    removeActivePlayer(name) {
        const playerInfo = this.getPlayerInfo();
        if (playerInfo?.name === name) {
            this.setDefaultPlayerActive();
        }
    }

    removeActiveTarget(id) {
        const playerInfo = this.getPlayerInfo();
        if (playerInfo?.id === id) {
            this.setDefaultPlayerActive();
        }
    }

    sendCommand(cmd, player) {
        console.debug('MediaController received command: ' + cmd.Name);
        switch (cmd.Name) {
            case 'SetRepeatMode':
                this.setRepeatMode(cmd.Arguments.RepeatMode, player);
                break;
            case 'SetShuffleQueue':
                this.setQueueShuffleMode(cmd.Arguments.ShuffleMode, player);
                break;
            case 'VolumeUp':
                this.volumeUp(player);
                break;
            case 'VolumeDown':
                this.volumeDown(player);
                break;
            case 'Mute':
                this.setMute(true, player);
                break;
            case 'Unmute':
                this.setMute(false, player);
                break;
            case 'ToggleMute':
                this.toggleMute(player);
                break;
            case 'SetVolume':
                this.setVolume(cmd.Arguments.Volume, player);
                break;
            case 'SetAspectRatio':
                this.setAspectRatio(cmd.Arguments.AspectRatio, player);
                break;
            case 'PlaybackRate':
                this.setPlaybackRate(cmd.Arguments.PlaybackRate, player);
                break;
            case 'SetBrightness':
                this.setBrightness(cmd.Arguments.Brightness, player);
                break;
            case 'SetAudioStreamIndex':
                this.setAudioStreamIndex(parseInt(cmd.Arguments.Index, 10), player);
                break;
            case 'SetSubtitleStreamIndex':
                this.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index, 10), player);
                break;
            case 'SetMaxStreamingBitrate':
                this.setMaxStreamingBitrate(parseInt(cmd.Arguments.Bitrate, 10), player);
                break;
            case 'ToggleFullscreen':
                this.toggleFullscreen(player);
                break;
            default:
                if (player.sendCommand) {
                    player.sendCommand(cmd);
                }
                break;
        }
    }
}

export const playbackManager = new PlaybackManager();

window.addEventListener('beforeunload', function () {
    try {
        playbackManager.onAppClose();
    } catch (err) {
        console.error('error in onAppClose: ' + err);
    }
});
