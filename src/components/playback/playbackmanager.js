import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js';
import { PlaybackErrorCode } from '@jellyfin/sdk/lib/generated-client/models/playback-error-code.js';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import merge from 'lodash-es/merge';
import Screenfull from 'screenfull';
import Events from '../../utils/events.ts';
import datetime from '../../scripts/datetime';
import appSettings from '../../scripts/settings/appSettings';
import itemHelper from '../itemHelper';
import { pluginManager } from '../pluginManager';
import PlayQueueManager from './playqueuemanager';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from '../../lib/globalize';
import loading from '../loading/loading';
import { appHost } from '../apphost';
import alert from '../alert';
import { PluginType } from '../../types/plugin.ts';
import { includesAny } from '../../utils/container.ts';
import { getItems } from '../../utils/jellyfin-apiclient/getItems.ts';
import { getItemBackdropImageUrl } from '../../utils/jellyfin-apiclient/backdropImage';

import { PlayerEvent } from 'apps/stable/features/playback/constants/playerEvent';
import { bindMediaSegmentManager } from 'apps/stable/features/playback/utils/mediaSegmentManager';
import { bindMediaSessionSubscriber } from 'apps/stable/features/playback/utils/mediaSessionSubscriber';
import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { MediaError } from 'types/mediaError';
import { getMediaError } from 'utils/mediaError';
import { destroyWaveSurferInstance } from 'components/visualizer/WaveSurfer';
import { hijackMediaElementForCrossfade, timeRunningOut, xDuration } from 'components/audioEngine/crossfader.logic';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { bindSkipSegment } from './skipsegment.ts';

const UNLIMITED_ITEMS = -1;

function enableLocalPlaylistManagement(player) {
    if (player.getPlaylist) {
        return false;
    }

    return player.isLocalPlayer;
}

function supportsPhysicalVolumeControl(player) {
    return player.isLocalPlayer && appHost.supports(AppFeature.PhysicalVolumeControl);
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
    const reportPlaybackPromise = apiClient[method](info);
    // Notify that report has been sent
    reportPlaybackPromise.then(() => {
        Events.trigger(playbackManagerInstance, 'reportplayback', [true]);
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
    // eslint-disable-next-line sonarjs/single-char-in-character-classes
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regexS = '[\\?&]' + name + '=([^&#]*)';
    const regex = new RegExp(regexS, 'i');

    const results = regex.exec(url);
    if (results == null) {
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
function getAudioStreamUrl(item, transcodingProfile, directPlayContainers, apiClient, startPosition, maxValues) {
    const url = 'Audio/' + item.Id + '/universal';

    startingPlaySession++;
    return apiClient.getUrl(url, {
        UserId: apiClient.getCurrentUserId(),
        DeviceId: apiClient.deviceId(),
        MaxStreamingBitrate: maxValues.maxAudioBitrate || maxValues.maxBitrate,
        Container: directPlayContainers,
        TranscodingContainer: transcodingProfile.Container || null,
        TranscodingProtocol: transcodingProfile.Protocol || null,
        AudioCodec: transcodingProfile.AudioCodec,
        MaxAudioSampleRate: maxValues.maxAudioSampleRate,
        MaxAudioBitDepth: maxValues.maxAudioBitDepth,
        ApiKey: apiClient.accessToken(),
        PlaySessionId: startingPlaySession,
        StartTimeTicks: startPosition || 0,
        EnableRedirection: true,
        EnableRemoteMedia: appHost.supports(AppFeature.RemoteAudio),
        EnableAudioVbrEncoding: transcodingProfile.EnableAudioVbrEncoding
    });
}

function getAudioStreamUrlFromDeviceProfile(item, deviceProfile, maxBitrate, apiClient, startPosition) {
    const transcodingProfile = deviceProfile.TranscodingProfiles.filter(function (p) {
        return p.Type === 'Audio' && p.Context === 'Streaming';
    })[0];

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

async function getPlaybackInfo(player, apiClient, item, deviceProfile, mediaSourceId, liveStreamId, options) {
    if (!itemHelper.isLocalItem(item) && item.MediaType === 'Audio' && !player.useServerPlaybackInfoForAudio) {
        return {
            MediaSources: [
                {
                    StreamUrl: getAudioStreamUrlFromDeviceProfile(item, deviceProfile, options.maxBitrate, apiClient, options.startPosition),
                    Id: item.Id,
                    MediaStreams: [],
                    RunTimeTicks: item.RunTimeTicks
                }]
        };
    }

    if (item.PresetMediaSource) {
        return {
            MediaSources: [item.PresetMediaSource]
        };
    }

    const itemId = item.Id;

    const query = {
        UserId: apiClient.getCurrentUserId(),
        StartTimeTicks: options.startPosition || 0
    };

    const api = toApi(apiClient);
    const mediaInfoApi = getMediaInfoApi(api);

    if (options.isPlayback) {
        query.IsPlayback = true;
        query.AutoOpenLiveStream = true;
    } else {
        query.IsPlayback = false;
        query.AutoOpenLiveStream = false;
    }

    if (options.audioStreamIndex != null) {
        query.AudioStreamIndex = options.audioStreamIndex;
    }
    if (options.subtitleStreamIndex != null) {
        query.SubtitleStreamIndex = options.subtitleStreamIndex;
    }
    if (options.secondarySubtitleStreamIndex != null) {
        query.SecondarySubtitleStreamIndex = options.secondarySubtitleStreamIndex;
    }
    if (options.enableDirectPlay != null) {
        query.EnableDirectPlay = options.enableDirectPlay;
    }
    if (options.enableDirectStream != null) {
        query.EnableDirectStream = options.enableDirectStream;
    }
    if (options.allowVideoStreamCopy != null) {
        query.AllowVideoStreamCopy = options.allowVideoStreamCopy;
    }
    if (options.allowAudioStreamCopy != null) {
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

    query.AlwaysBurnInSubtitleWhenTranscoding = appSettings.alwaysBurnInSubtitleWhenTranscoding();

    query.DeviceProfile = deviceProfile;

    const res = await mediaInfoApi.getPostedPlaybackInfo({ itemId: itemId, playbackInfoDto: query });
    return res.data;
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
    if (options.audioStreamIndex != null) {
        query.AudioStreamIndex = options.audioStreamIndex;
    }
    if (options.subtitleStreamIndex != null) {
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
        if (mediaSource.IsRemote && !appHost.supports(AppFeature.RemoteVideo)) {
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

        self.currentItem = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.currentItem) {
                return player.currentItem();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.item : null;
        };

        self.currentMediaSource = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.currentMediaSource) {
                return player.currentMediaSource();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.mediaSource : null;
        };

        self.playMethod = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.playMethod) {
                return player.playMethod();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.playMethod : null;
        };

        self.playSessionId = function (player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            if (player.playSessionId) {
                return player.playSessionId();
            }

            const data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.playSessionId : null;
        };

        self.getPlayerInfo = function () {
            const player = self._currentPlayer;

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

        self.setActivePlayer = function (player, targetInfo) {
            if (player === 'localplayer' || player.name === 'localplayer') {
                if (self._currentPlayer?.isLocalPlayer) {
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

        self.trySetActivePlayer = function (player, targetInfo) {
            if (player === 'localplayer' || player.name === 'localplayer') {
                if (self._currentPlayer?.isLocalPlayer) {
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

        self.getTargets = function () {
            const promises = players.filter(displayPlayerIndividually).map(getPlayerTargets);

            return Promise.all(promises)
                .then(responses => responses.flat().sort(sortPlayerTargets));
        };

        self.playerHasSecondarySubtitleSupport = function (player = self._currentPlayer) {
            if (!player) return false;
            return Boolean(player.supports('SecondarySubtitles'));
        };

        /**
         * Checks if:
         * - the track can be used directly as a secondary subtitle
         * - or if it can be paired with a secondary subtitle when used as a primary subtitle
         */
        self.trackHasSecondarySubtitleSupport = function (track, player = self._currentPlayer) {
            if (!player || !track) return false;
            const format = (track.Codec || '').toLowerCase();
            // Currently, only non-SSA/non-ASS external subtitles are supported.
            // Showing secondary subtitles does not work with any SSA/ASS subtitle combinations because
            // of the complexity of how they are rendered and the risk of the subtitles overlapping
            return format !== 'ssa' && format !== 'ass' && getDeliveryMethod(track) === 'External';
        };

        self.secondarySubtitleTracks = function (player = self._currentPlayer) {
            const streams = self.subtitleTracks(player);
            return streams.filter((stream) => self.trackHasSecondarySubtitleSupport(stream, player));
        };

        function getCurrentSubtitleStream(player, isSecondaryStream = false) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            const index = isSecondaryStream ? getPlayerData(player).secondarySubtitleStreamIndex : getPlayerData(player).subtitleStreamIndex;

            if (index == null || index === -1) {
                return null;
            }

            return self.getSubtitleStream(player, index);
        }

        self.getSubtitleStream = function (player, index) {
            return self.subtitleTracks(player).filter(function (s) {
                return s.Type === 'Subtitle' && s.Index === index;
            })[0];
        };

        self.getPlaylist = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                if (player.getPlaylistSync) {
                    return Promise.resolve(player.getPlaylistSync());
                }

                return player.getPlaylist();
            }

            return Promise.resolve(self._playQueueManager.getPlaylist());
        };

        self.promptToSkip = function (mediaSegment, player) {
            player = player || self._currentPlayer;

            if (mediaSegment && this._skipSegment) {
                Events.trigger(player, PlayerEvent.PromptSkip, [mediaSegment]);
            }
        };

        function removeCurrentPlayer(player) {
            const previousPlayer = self._currentPlayer;

            if (!previousPlayer || player.id === previousPlayer.id) {
                setCurrentPlayerInternal(null);
            }
        }

        function setCurrentPlayerInternal(player, targetInfo) {
            const previousPlayer = self._currentPlayer;
            const previousTargetInfo = currentTargetInfo;

            if (player && !targetInfo && player.isLocalPlayer) {
                targetInfo = createTarget(self, player);
            }

            if (player && !targetInfo) {
                throw new Error('targetInfo cannot be null');
            }

            currentPairingId = null;
            self._currentPlayer = player;
            currentTargetInfo = targetInfo;

            if (targetInfo) {
                console.debug('Active player: ' + JSON.stringify(targetInfo));
            }

            if (previousPlayer) {
                self.endPlayerUpdates(previousPlayer);
            }

            if (player) {
                self.beginPlayerUpdates(player);
            }

            triggerPlayerChange(self, player, targetInfo, previousPlayer, previousTargetInfo);
        }

        self.isPlaying = function (player) {
            player = player || self._currentPlayer;

            if (player?.isPlaying) {
                return player.isPlaying();
            }

            return player?.currentSrc() != null;
        };

        self.isPlayingMediaType = function (mediaType, player) {
            player = player || self._currentPlayer;

            if (player?.isPlaying) {
                return player.isPlaying(mediaType);
            }

            if (self.isPlaying(player)) {
                const playerData = getPlayerData(player);

                return playerData.streamInfo.mediaType === mediaType;
            }

            return false;
        };

        self.isPlayingLocally = function (mediaTypes, player) {
            player = player || self._currentPlayer;

            if (!player?.isLocalPlayer) {
                return false;
            }

            return mediaTypes.filter(function (mediaType) {
                return self.isPlayingMediaType(mediaType, player);
            }).length > 0;
        };

        self.isPlayingVideo = function (player) {
            return self.isPlayingMediaType('Video', player);
        };

        self.isPlayingAudio = function (player) {
            return self.isPlayingMediaType('Audio', player);
        };

        self.getPlayers = function () {
            return players;
        };

        function getDefaultPlayOptions() {
            return {
                fullscreen: true
            };
        }

        self.canPlay = function (item) {
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

            return getPlayer(item, getDefaultPlayOptions()) != null;
        };

        self.toggleAspectRatio = function (player) {
            player = player || self._currentPlayer;

            if (player) {
                const current = self.getAspectRatio(player);

                const supported = self.getSupportedAspectRatios(player);

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

                self.setAspectRatio(supported[index].id, player);
            }
        };

        self.setAspectRatio = function (val, player) {
            player = player || self._currentPlayer;

            if (player?.setAspectRatio) {
                player.setAspectRatio(val);
            }
        };

        self.getSupportedAspectRatios = function (player) {
            player = player || self._currentPlayer;

            if (player?.getSupportedAspectRatios) {
                return player.getSupportedAspectRatios();
            }

            return [];
        };

        self.getAspectRatio = function (player) {
            player = player || self._currentPlayer;

            if (player?.getAspectRatio) {
                return player.getAspectRatio();
            }
        };

        self.increasePlaybackRate = function (player) {
            player = player || self._currentPlayer;
            if (player) {
                const current = self.getPlaybackRate(player);
                const supported = self.getSupportedPlaybackRates(player);

                let index = -1;
                for (let i = 0, length = supported.length; i < length; i++) {
                    if (supported[i].id === current) {
                        index = i;
                        break;
                    }
                }

                index = Math.min(index + 1, supported.length - 1);
                self.setPlaybackRate(supported[index].id, player);
            }
        };

        self.decreasePlaybackRate = function (player) {
            player = player || self._currentPlayer;
            if (player) {
                const current = self.getPlaybackRate(player);
                const supported = self.getSupportedPlaybackRates(player);

                let index = -1;
                for (let i = 0, length = supported.length; i < length; i++) {
                    if (supported[i].id === current) {
                        index = i;
                        break;
                    }
                }

                index = Math.max(index - 1, 0);
                self.setPlaybackRate(supported[index].id, player);
            }
        };

        self.getSupportedPlaybackRates = function (player) {
            player = player || self._currentPlayer;
            if (player?.getSupportedPlaybackRates) {
                return player.getSupportedPlaybackRates();
            }
            return [];
        };

        let brightnessOsdLoaded;
        self.setBrightness = function (val, player) {
            player = player || self._currentPlayer;

            if (player) {
                if (!brightnessOsdLoaded) {
                    brightnessOsdLoaded = true;
                    // TODO: Have this trigger an event instead to get the osd out of here
                    import('./brightnessosd').then();
                }
                player.setBrightness(val);
            }
        };

        self.getBrightness = function (player) {
            player = player || self._currentPlayer;

            if (player) {
                return player.getBrightness();
            }
        };

        self.setVolume = function (val, player) {
            player = player || self._currentPlayer;

            if (player && !supportsPhysicalVolumeControl(player)) {
                player.setVolume(val);
            }
        };

        self.getVolume = function (player) {
            player = player || self._currentPlayer;

            if (player && !supportsPhysicalVolumeControl(player)) {
                return player.getVolume();
            }

            return 1;
        };

        self.volumeUp = function (player) {
            player = player || self._currentPlayer;

            if (player && !supportsPhysicalVolumeControl(player)) {
                player.volumeUp();
            }
        };

        self.volumeDown = function (player) {
            player = player || self._currentPlayer;

            if (player && !supportsPhysicalVolumeControl(player)) {
                player.volumeDown();
            }
        };

        self.changeAudioStream = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.changeAudioStream();
            }

            if (!player) {
                return;
            }

            const currentMediaSource = self.currentMediaSource(player);
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

            const currentStreamIndex = self.getAudioStreamIndex(player);
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

            self.setAudioStreamIndex(nextIndex, player);
        };

        self.changeSubtitleStream = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.changeSubtitleStream();
            }

            if (!player) {
                return;
            }

            const currentMediaSource = self.currentMediaSource(player);
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

            const currentStreamIndex = self.getSubtitleStreamIndex(player);
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

            self.setSubtitleStreamIndex(nextIndex, player);
        };

        self.getAudioStreamIndex = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getAudioStreamIndex();
            }

            return getPlayerData(player).audioStreamIndex;
        };

        function isAudioStreamSupported(mediaSource, index, deviceProfile) {
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

        self.setAudioStreamIndex = function (index, player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setAudioStreamIndex(index);
            }

            if (self.playMethod(player) === 'Transcode' || !player.canSetAudioStreamIndex()) {
                changeStream(player, getCurrentTicks(player), { AudioStreamIndex: index });
                getPlayerData(player).audioStreamIndex = index;
            } else {
                // See if the player supports the track without transcoding
                player.getDeviceProfile(self.currentItem(player)).then(function (profile) {
                    if (isAudioStreamSupported(self.currentMediaSource(player), index, profile)) {
                        player.setAudioStreamIndex(index);
                        getPlayerData(player).audioStreamIndex = index;
                    } else {
                        changeStream(player, getCurrentTicks(player), { AudioStreamIndex: index });
                        getPlayerData(player).audioStreamIndex = index;
                    }
                });
            }
        };

        function getSavedMaxStreamingBitrate(apiClient, mediaType) {
            if (!apiClient) {
                // This should hopefully never happen
                apiClient = ServerConnections.currentApiClient();
            }

            const endpointInfo = apiClient.getSavedEndpointInfo() || {};

            return appSettings.maxStreamingBitrate(endpointInfo.IsInNetwork, mediaType);
        }

        self.getMaxStreamingBitrate = function (player) {
            player = player || self._currentPlayer;
            if (player?.getMaxStreamingBitrate) {
                return player.getMaxStreamingBitrate();
            }

            const playerData = getPlayerData(player);

            if (playerData.maxStreamingBitrate) {
                return playerData.maxStreamingBitrate;
            }

            const mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
            const currentItem = self.currentItem(player);

            const apiClient = currentItem ? ServerConnections.getApiClient(currentItem.ServerId) : ServerConnections.currentApiClient();
            return getSavedMaxStreamingBitrate(apiClient, mediaType);
        };

        self.enableAutomaticBitrateDetection = function (player) {
            player = player || self._currentPlayer;
            if (player?.enableAutomaticBitrateDetection) {
                return player.enableAutomaticBitrateDetection();
            }

            const playerData = getPlayerData(player);
            const mediaType = playerData.streamInfo ? playerData.streamInfo.mediaType : null;
            const currentItem = self.currentItem(player);

            const apiClient = currentItem ? ServerConnections.getApiClient(currentItem.ServerId) : ServerConnections.currentApiClient();
            const endpointInfo = apiClient.getSavedEndpointInfo() || {};

            return appSettings.enableAutomaticBitrateDetection(endpointInfo.IsInNetwork, mediaType);
        };

        self.setMaxStreamingBitrate = function (options, player) {
            player = player || self._currentPlayer;
            if (player?.setMaxStreamingBitrate) {
                return player.setMaxStreamingBitrate(options);
            }

            const apiClient = ServerConnections.getApiClient(self.currentItem(player).ServerId);

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

        self.isFullscreen = function (player) {
            player = player || self._currentPlayer;
            if (!player.isLocalPlayer || player.isFullscreen) {
                return player.isFullscreen();
            }

            if (!Screenfull.isEnabled) {
                // iOS Safari
                return document.webkitIsFullScreen;
            }

            return Screenfull.isFullscreen;
        };

        self.toggleFullscreen = function (player) {
            player = player || self._currentPlayer;
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

        self.togglePictureInPicture = function (player) {
            player = player || self._currentPlayer;
            return player.togglePictureInPicture();
        };

        self.toggleAirPlay = function (player) {
            player = player || self._currentPlayer;
            return player.toggleAirPlay();
        };

        self.getSubtitleStreamIndex = function (player) {
            player = player || self._currentPlayer;

            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getSubtitleStreamIndex();
            }

            if (!player) {
                throw new Error('player cannot be null');
            }

            return getPlayerData(player).subtitleStreamIndex;
        };

        self.getSecondarySubtitleStreamIndex = function (player) {
            player = player || self._currentPlayer;

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

        function getDeliveryMethod(subtitleStream) {
            // This will be null for internal subs for local items
            if (subtitleStream.DeliveryMethod) {
                return subtitleStream.DeliveryMethod;
            }

            return subtitleStream.IsExternal ? 'External' : 'Embed';
        }

        self.setSubtitleStreamIndex = function (index, player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setSubtitleStreamIndex(index);
            }

            const currentStream = getCurrentSubtitleStream(player);

            const newStream = self.getSubtitleStream(player, index);

            if (!currentStream && !newStream) {
                return;
            }

            let selectedTrackElementIndex = -1;

            const currentPlayMethod = self.playMethod(player);

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
            if (selectedTrackElementIndex === -1 || !self.trackHasSecondarySubtitleSupport(newStream)) {
                self.setSecondarySubtitleStreamIndex(-1);
            }

            getPlayerData(player).subtitleStreamIndex = index;
        };

        self.setSecondarySubtitleStreamIndex = function (index, player) {
            player = player || self._currentPlayer;
            if (!self.playerHasSecondarySubtitleSupport(player)) return;
            if (player && !enableLocalPlaylistManagement(player)) {
                try {
                    return player.setSecondarySubtitleStreamIndex(index);
                } catch (e) {
                    console.error('[playbackmanager] AutoSet - Failed to set secondary track:', e);
                }
            }

            const currentStream = getCurrentSubtitleStream(player, true);

            const newStream = self.getSubtitleStream(player, index);

            if (!currentStream && !newStream) {
                return;
            }

            // Secondary subtitles are currently only handled client side
            // Changes to the server code are required before we can handle other delivery methods
            if (newStream && !self.trackHasSecondarySubtitleSupport(newStream, player)) {
                return;
            }

            try {
                player.setSecondarySubtitleStreamIndex(index);
                getPlayerData(player).secondarySubtitleStreamIndex = index;
            } catch (e) {
                console.error('[playbackmanager] AutoSet - Failed to set secondary track:', e);
            }
        };

        self.supportSubtitleOffset = function (player) {
            player = player || self._currentPlayer;
            return player && 'setSubtitleOffset' in player;
        };

        self.enableShowingSubtitleOffset = function (player) {
            player = player || self._currentPlayer;
            player.enableShowingSubtitleOffset();
        };

        self.disableShowingSubtitleOffset = function (player) {
            player = player || self._currentPlayer;
            if (player.disableShowingSubtitleOffset) {
                player.disableShowingSubtitleOffset();
            }
        };

        self.isShowingSubtitleOffsetEnabled = function (player) {
            player = player || self._currentPlayer;
            return player.isShowingSubtitleOffsetEnabled();
        };

        self.isSubtitleStreamExternal = function (index, player) {
            const stream = self.getSubtitleStream(player, index);
            return stream ? getDeliveryMethod(stream) === 'External' : false;
        };

        self.setSubtitleOffset = function (value, player) {
            player = player || self._currentPlayer;
            if (player.setSubtitleOffset) {
                player.setSubtitleOffset(value);
            }
        };

        self.getPlayerSubtitleOffset = function (player) {
            player = player || self._currentPlayer;
            if (player.getSubtitleOffset) {
                return player.getSubtitleOffset();
            }
        };

        self.canHandleOffsetOnCurrentSubtitle = function (player) {
            const index = self.getSubtitleStreamIndex(player);
            return index !== -1 && self.isSubtitleStreamExternal(index, player);
        };

        self.seek = function (ticks, player) {
            ticks = Math.max(0, ticks);

            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.seek(ticks);
            }

            changeStream(player, ticks);
        };

        self.seekRelative = function (offsetTicks, player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player) && player.seekRelative) {
                return player.seekRelative(ticks);
            }

            const ticks = getCurrentTicks(player) + offsetTicks;
            return this.seek(ticks, player);
        };

        // Returns true if the player can seek using native client-side seeking functions
        function canPlayerSeek(player) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            const playerData = getPlayerData(player);

            const currentSrc = (playerData.streamInfo.url || '').toLowerCase();

            if (currentSrc.indexOf('.m3u8') !== -1) {
                return true;
            }

            if (player.seekable) {
                return player.seekable();
            }

            const isPlayMethodTranscode = self.playMethod(player) === 'Transcode';

            if (isPlayMethodTranscode) {
                return false;
            }

            return player.duration();
        }

        function changeStream(player, ticks, params) {
            if (canPlayerSeek(player) && params == null) {
                player.currentTime(parseInt(ticks / 10000, 10));
                return;
            }

            params = params || {};

            const liveStreamId = getPlayerData(player).streamInfo.liveStreamId;
            const lastMediaInfoQuery = getPlayerData(player).streamInfo.lastMediaInfoQuery;

            const playSessionId = self.playSessionId(player);

            const currentItem = self.currentItem(player);

            player.getDeviceProfile(currentItem, {
                isRetry: params.EnableDirectPlay === false
            }).then(function (deviceProfile) {
                const audioStreamIndex = params.AudioStreamIndex == null ? getPlayerData(player).audioStreamIndex : params.AudioStreamIndex;
                const subtitleStreamIndex = params.SubtitleStreamIndex == null ? getPlayerData(player).subtitleStreamIndex : params.SubtitleStreamIndex;
                const secondarySubtitleStreamIndex = params.SecondarySubtitleStreamIndex == null ? getPlayerData(player).secondarySubtitleStreamIndex : params.SecondarySubtitleStreamIndex;

                let currentMediaSource = self.currentMediaSource(player);
                const apiClient = ServerConnections.getApiClient(currentItem.ServerId);

                if (ticks) {
                    ticks = parseInt(ticks, 10);
                }

                const maxBitrate = params.MaxStreamingBitrate || self.getMaxStreamingBitrate(player);

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

        function changeStreamToUrl(apiClient, player, playSessionId, streamInfo) {
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

        function setSrcIntoPlayer(apiClient, player, streamInfo) {
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

        async function translateItemsForPlayback(items, options) {
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

        function sortItemsIfNeeded(items, options) {
            if (items.length > 1 && options?.ids) {
                // Use the original request id array for sorting the result in the proper order
                items.sort(function (a, b) {
                    return options.ids.indexOf(a.Id) - options.ids.indexOf(b.Id);
                });
            }
        }

        function getPlaybackPromise(firstItem, serverId, options, queryOptions, items) {
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
                        SortBy: options.shuffle ? 'Random' : 'Album,ParentIndexNumber,IndexNumber,SortName',
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
                case 'Genre':
                    return getItemsForPlayback(serverId, mergePlaybackQueries({
                        GenreIds: firstItem.Id,
                        ParentId: firstItem.ParentId,
                        Filters: 'IsNotFolder',
                        Recursive: true,
                        SortBy: options.shuffle ? 'Random' : 'SortName',
                        MediaTypes: 'Video'
                    }, queryOptions));
                case 'Studio':
                    return getItemsForPlayback(serverId, mergePlaybackQueries({
                        StudioIds: firstItem.Id,
                        Filters: 'IsNotFolder',
                        Recursive: true,
                        SortBy: options.shuffle ? 'Random' : 'SortName',
                        MediaTypes: 'Video'
                    }, queryOptions));
                case 'Series':
                case 'Season':
                    return getSeriesOrSeasonPlaybackPromise(firstItem, options, items);
                case 'Episode':
                    return getEpisodePlaybackPromise(firstItem, options, items);
            }

            return getNonItemTypePromise(firstItem, serverId, options, queryOptions);
        }

        function getNonItemTypePromise(firstItem, serverId, options, queryOptions) {
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
                    if (firstItem.CollectionType === 'music' || firstItem.MediaType === 'Audio') {
                        sortBy = 'Album,ParentIndexNumber,IndexNumber,SortName';
                    } else {
                        sortBy = 'SortName';
                    }
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

        async function getSeriesOrSeasonPlaybackPromise(firstItem, options, items) {
            const apiClient = ServerConnections.getApiClient(firstItem.ServerId);
            const startSeasonId = firstItem.Type === 'Season' ? items[options.startIndex || 0].Id : undefined;

            const seasonId = (startSeasonId && items.length === 1) ? startSeasonId : undefined;
            const seriesId = firstItem.SeriesId || firstItem.Id;
            const UserId = apiClient.getCurrentUserId();

            let startItemId;

            // Start from a specific (the next unwatched) episode if we want to watch in order and have not chosen a specific season
            if (!options.shuffle && !seasonId) {
                const initialUnplayedEpisode = await getItems(apiClient, UserId, {
                    SortBy: 'SeriesSortName,SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Episode',
                    Recursive: true,
                    IsMissing: false,
                    ParentId: seriesId,
                    limit: 1,
                    Filters: 'IsUnplayed'
                });

                startItemId = initialUnplayedEpisode?.Items?.at(0)?.Id;
            }

            const episodesResult = await apiClient.getEpisodes(seriesId, {
                IsVirtualUnaired: false,
                IsMissing: false,
                SeasonId: seasonId,
                // default to first 100 episodes if no season was specified to avoid loading too large payloads
                limit: seasonId ? undefined : 100,
                SortBy: options.shuffle ? 'Random' : undefined,
                UserId,
                Fields: ['Chapters', 'Trickplay'],
                startItemId
            });

            if (options.shuffle) {
                episodesResult.StartIndex = 0;
            } else {
                episodesResult.StartIndex = undefined;
                let seasonStartIndex;
                for (const [index, e] of episodesResult.Items.entries()) {
                    if (startSeasonId && items.length != 1) {
                        if (e.SeasonId == startSeasonId) {
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

        function getEpisodePlaybackPromise(firstItem, options, items) {
            if (items.length === 1 && getPlayer(firstItem, options).supportsProgress !== false) {
                return getEpisodes(firstItem, options);
            } else {
                return null;
            }
        }

        function getEpisodes(firstItem, options) {
            return new Promise(function (resolve, reject) {
                const apiClient = ServerConnections.getApiClient(firstItem.ServerId);

                const { SeriesId, Id } = firstItem;
                if (!SeriesId) {
                    resolve(null);
                    return;
                }

                apiClient.getEpisodes(SeriesId, {
                    IsVirtualUnaired: false,
                    IsMissing: false,
                    UserId: apiClient.getCurrentUserId(),
                    Fields: ['Chapters', 'Trickplay'],
                    // limit to loading 100 episodes to avoid loading too large payload
                    limit: 100,
                    startItemId: Id
                }).then(function (episodesResult) {
                    resolve(filterEpisodes(episodesResult, firstItem, options));
                }, reject);
            });
        }

        function filterEpisodes(episodesResult, firstItem, options) {
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

        self.translateItemsForPlayback = translateItemsForPlayback;
        self.getItemsForPlayback = getItemsForPlayback;

        self.play = async function (options) {
            hijackMediaElementForCrossfade();

            normalizePlayOptions(options);

            if (self._currentPlayer) {
                if (options.enableRemotePlayers === false && !self._currentPlayer.isLocalPlayer) {
                    throw new Error('Remote players are disabled');
                }

                if (!self._currentPlayer.isLocalPlayer) {
                    return self._currentPlayer.play(options);
                }
            }

            if (options.fullscreen) {
                loading.show();
            }

            let { items } = options;
            // If items were not passed directly, fetch them by ID
            if (!items) {
                if (!options.serverId) {
                    throw new Error('serverId required!');
                }

                items = (await getItemsForPlayback(options.serverId, {
                    Ids: options.ids.join(',')
                })).Items;
            }

            // Prepare the list of items
            items = await translateItemsForPlayback(items, options);
            // Add any additional parts for movies or episodes
            items = await getAdditionalParts(items);
            // Adjust the start index for additional parts added to the queue
            if (options.startIndex) {
                let adjustedStartIndex = 0;
                for (let i = 0; i < options.startIndex; i++) {
                    adjustedStartIndex += items[i].length;
                }

                options.startIndex = adjustedStartIndex;
            }
            // getAdditionalParts returns an array of arrays of items, so flatten it
            items = items.flat();

            return playWithIntros(items, options);
        };

        function getPlayerData(player) {
            if (!player) {
                throw new Error('player cannot be null');
            }
            if (!player.name) {
                throw new Error('player name cannot be null');
            }
            let state = playerStates[player.name];

            if (!state) {
                playerStates[player.name] = {};
                // eslint-disable-next-line sonarjs/no-dead-store
                state = playerStates[player.name];
            }

            return player;
        }

        self.getPlayerState = function (player, item, mediaSource) {
            player = player || self._currentPlayer;

            if (!player) {
                throw new Error('player cannot be null');
            }

            if (!enableLocalPlaylistManagement(player) && player.getPlayerState) {
                return player.getPlayerState();
            }

            item = item || self.currentItem(player);
            mediaSource = mediaSource || self.currentMediaSource(player);

            const state = {
                PlayState: {}
            };

            if (player) {
                state.PlayState.VolumeLevel = player.getVolume();
                state.PlayState.IsMuted = player.isMuted();
                state.PlayState.IsPaused = player.paused();
                state.PlayState.RepeatMode = self.getRepeatMode(player);
                state.PlayState.ShuffleMode = self.getQueueShuffleMode(player);
                state.PlayState.MaxStreamingBitrate = self.getMaxStreamingBitrate(player);

                state.PlayState.PositionTicks = getCurrentTicks(player);
                state.PlayState.PlaybackStartTimeTicks = self.playbackStartTime(player);
                state.PlayState.PlaybackRate = self.getPlaybackRate(player);

                state.PlayState.SubtitleStreamIndex = self.getSubtitleStreamIndex(player);
                state.PlayState.SecondarySubtitleStreamIndex = self.getSecondarySubtitleStreamIndex(player);
                state.PlayState.AudioStreamIndex = self.getAudioStreamIndex(player);
                state.PlayState.BufferedRanges = self.getBufferedRanges(player);

                state.PlayState.PlayMethod = self.playMethod(player);

                if (mediaSource) {
                    state.PlayState.LiveStreamId = mediaSource.LiveStreamId;
                }
                state.PlayState.PlaySessionId = self.playSessionId(player);
                state.PlayState.PlaylistItemId = self.getCurrentPlaylistItemId(player);
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

        self.duration = function (player) {
            player = player || self._currentPlayer;

            if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
                return player.duration();
            }

            if (!player) {
                throw new Error('player cannot be null');
            }

            const mediaSource = self.currentMediaSource(player);

            if (mediaSource?.RunTimeTicks) {
                return mediaSource.RunTimeTicks;
            }

            let playerDuration = player.duration();

            if (playerDuration) {
                playerDuration *= 10000;
            }

            return playerDuration;
        };

        function getCurrentTicks(player) {
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
        self.getCurrentTicks = getCurrentTicks;

        function playOther(items, options) {
            const playStartIndex = options.startIndex || 0;
            const player = getPlayer(items[playStartIndex], options);

            loading.hide();

            options.items = items;

            return player.play(options);
        }

        const getAdditionalParts = async (items) => {
            const getItemAndParts = async function (item) {
                if (
                    item.PartCount && item.PartCount > 1
                    && [ BaseItemKind.Episode, BaseItemKind.Movie ].includes(item.Type)
                ) {
                    const client = ServerConnections.getApiClient(item.ServerId);
                    const user = await client.getCurrentUser();
                    const additionalParts = await client.getAdditionalVideoParts(user.Id, item.Id);
                    if (additionalParts.Items.length) {
                        return [ item, ...additionalParts.Items ];
                    }
                }
                return [ item ];
            };

            return Promise.all(items.map(getItemAndParts));
        };

        function playWithIntros(items, options) {
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
                        self._playQueueManager.setPlaylist(items);

                        setPlaylistState(items[playStartIndex].PlaylistItemId, playStartIndex);
                        loading.hide();
                    });
                }, Math.max(xDuration.sustain * 1000), 1);
            });
        }

        // Set playlist state. Using a method allows for overloading in derived player implementations
        function setPlaylistState(playlistItemId, index) {
            if (!isNaN(index)) {
                self._playQueueManager.setPlaylistState(playlistItemId, index);
            }
        }

        function playInternal(item, playOptions, onPlaybackStartedFn, prevSource) {
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

            if (playOptions.fullscreen) {
                loading.show();
            }

            return runInterceptors(item, playOptions)
                .catch(onInterceptorRejection)
                .then(() => detectBitrate(apiClient, item, mediaType))
                .then((bitrate) => {
                    const elapsedTime = performance.now() - xDuration.t0; // Calculate the elapsed time
                    setTimeout(() => {
                        return playAfterBitrateDetect(bitrate, item, playOptions, onPlaybackStartedFn, prevSource)
                            .catch(onPlaybackRejection);
                    }, Math.max(1, xDuration.sustain * 1000 - elapsedTime));
                })
                .catch(() => {
                    if (playOptions.fullscreen) {
                        loading.hide();
                    }
                });
        }

        function cancelPlayback() {
            const player = self._currentPlayer;

            if (player) {
                destroyPlayer(player);
                removeCurrentPlayer(player);
            }

            Events.trigger(self, 'playbackcancelled');
        }

        function onInterceptorRejection() {
            cancelPlayback();

            return Promise.reject();
        }

        function onPlaybackRejection(e) {
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

        function destroyPlayer(player) {
            player.destroy();
        }

        function runInterceptors(item, playOptions) {
            return new Promise(function (resolve, reject) {
                const interceptors = pluginManager.ofType(PluginType.PreplayIntercept);

                interceptors.sort(function (a, b) {
                    return (a.order || 0) - (b.order || 0);
                });

                if (!interceptors.length) {
                    resolve();
                    return;
                }

                const options = Object.assign({}, playOptions);

                options.mediaType = item.MediaType;
                options.item = item;

                runNextPrePlay(interceptors, 0, options, resolve, reject);
            });
        }

        function runNextPrePlay(interceptors, index, options, resolve, reject) {
            if (index >= interceptors.length) {
                resolve();
                return;
            }

            const interceptor = interceptors[index];

            interceptor.intercept(options).then(function () {
                runNextPrePlay(interceptors, index + 1, options, resolve, reject);
            }, reject);
        }

        function sendPlaybackListToPlayer(player, items, deviceProfile, apiClient, mediaSourceId, options) {
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

        function rankStreamType(prevIndex, prevSource, mediaStreams, trackOptions, streamType, isSecondarySubtitle) {
            if (prevIndex == -1) {
                console.debug(`AutoSet ${streamType} - No Stream Set`);
                if (streamType == 'Subtitle') {
                    if (isSecondarySubtitle) {
                        trackOptions.DefaultSecondarySubtitleStreamIndex = -1;
                    } else {
                        trackOptions.DefaultSubtitleStreamIndex = -1;
                    }
                }
                return;
            }

            if (!prevSource.MediaStreams || !mediaStreams) {
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
                if (stream.Type != streamType) continue;

                if (stream.Index == prevIndex) break;

                prevRelIndex += 1;
            }

            let newRelIndex = 0;
            for (const stream of mediaStreams) {
                if (stream.Type != streamType) continue;

                let score = 0;

                if (prevStream.Codec == stream.Codec) score += 1;
                if (prevRelIndex == newRelIndex) score += 1;
                if (prevStream.DisplayTitle && prevStream.DisplayTitle == stream.DisplayTitle) score += 2;
                if (prevStream.Language && prevStream.Language != 'und' && prevStream.Language == stream.Language) score += 2;

                console.debug(`AutoSet ${streamType} - Score ${score} for ${stream.Index} - ${stream.DisplayTitle}`);
                if (score > bestStreamScore && score >= 3) {
                    bestStreamScore = score;
                    bestStreamIndex = stream.Index;
                }

                newRelIndex += 1;
            }

            if (bestStreamIndex != null) {
                console.debug(`AutoSet ${streamType} - Using ${bestStreamIndex} score ${bestStreamScore}.`);
                if (streamType == 'Subtitle') {
                    if (isSecondarySubtitle) {
                        trackOptions.DefaultSecondarySubtitleStreamIndex = bestStreamIndex;
                    } else {
                        trackOptions.DefaultSubtitleStreamIndex = bestStreamIndex;
                    }
                }
                if (streamType == 'Audio') {
                    trackOptions.DefaultAudioStreamIndex = bestStreamIndex;
                }
            } else {
                console.debug(`AutoSet ${streamType} - Threshold not met. Using default.`);
            }
        }

        function autoSetNextTracks(prevSource, mediaStreams, trackOptions, audio, subtitle) {
            try {
                if (!prevSource) return;

                if (!mediaStreams) {
                    console.warn('AutoSet - No mediaStreams');
                    return;
                }

                if (audio && typeof prevSource.DefaultAudioStreamIndex == 'number') {
                    rankStreamType(prevSource.DefaultAudioStreamIndex, prevSource, mediaStreams, trackOptions, 'Audio');
                }

                if (subtitle && typeof prevSource.DefaultSubtitleStreamIndex == 'number') {
                    rankStreamType(prevSource.DefaultSubtitleStreamIndex, prevSource, mediaStreams, trackOptions, 'Subtitle');
                }

                if (subtitle && typeof prevSource.DefaultSecondarySubtitleStreamIndex == 'number') {
                    rankStreamType(prevSource.DefaultSecondarySubtitleStreamIndex, prevSource, mediaStreams, trackOptions, 'Subtitle', true);
                }
            } catch (e) {
                console.error(`AutoSet - Caught unexpected error: ${e}`);
            }
        }

        function detectBitrate(apiClient, item, mediaType) {
            // FIXME: This is gnarly, but don't want to change too much here in a bugfix
            return Promise.resolve()
                .then(() => {
                    if (!isServerItem(item) || itemHelper.isLocalItem(item)) {
                        return Promise.reject(new Error('skip bitrate detection'));
                    }

                    return apiClient.getEndpointInfo()
                        .then((endpointInfo) => {
                            if ((mediaType === 'Video' || mediaType === 'Audio') && appSettings.enableAutomaticBitrateDetection(endpointInfo.IsInNetwork, mediaType)) {
                                return apiClient.detectBitrate().then((bitrate) => {
                                    appSettings.maxStreamingBitrate(endpointInfo.IsInNetwork, mediaType, bitrate);
                                    return bitrate;
                                });
                            }

                            return Promise.reject(new Error('skip bitrate detection'));
                        });
                })
                .catch(() => getSavedMaxStreamingBitrate(apiClient, mediaType));
        }

        function playAfterBitrateDetect(maxBitrate, item, playOptions, onPlaybackStartedFn, prevSource) {
            const startPosition = playOptions.startPositionTicks;

            const player = getPlayer(item, playOptions);
            const activePlayer = self._currentPlayer;

            let promise;

            if (activePlayer) {
                // TODO: if changing players within the same playlist, this will cause nextItem to be null
                self._playNextAfterEnded = false;
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
                        self.stop(player);
                        loading.hide();
                        showPlaybackInfoErrorMessage(self, errorCode || 'ErrorDefault');
                    });
                });
            }

            let mediaSourceId = playOptions.mediaSourceId;

            const apiClient = ServerConnections.getApiClient(item.ServerId);
            const isLiveTv = [BaseItemKind.TvChannel, BaseItemKind.LiveTvChannel].includes(item.Type);
            const getMediaStreams = isLiveTv ? Promise.resolve([]) : apiClient.getItem(apiClient.getCurrentUserId(), mediaSourceId || item.Id)
                .then(fullItem => {
                    return fullItem.MediaStreams;
                });

            return Promise.all([promise, player.getDeviceProfile(item), apiClient.getCurrentUser(), getMediaStreams]).then(function (responses) {
                const deviceProfile = responses[1];
                const user = responses[2];
                const mediaStreams = responses[3];

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

                const trackOptions = {};
                let isIdFallbackNeeded = false;

                autoSetNextTracks(prevSource, mediaStreams, trackOptions, user.Configuration.RememberAudioSelections, user.Configuration.RememberSubtitleSelections);
                if (trackOptions.DefaultAudioStreamIndex != null) {
                    options.audioStreamIndex = trackOptions.DefaultAudioStreamIndex;
                    isIdFallbackNeeded = true;
                }
                if (trackOptions.DefaultSubtitleStreamIndex != null) {
                    options.subtitleStreamIndex = trackOptions.DefaultSubtitleStreamIndex;
                    isIdFallbackNeeded = true;
                }

                if (isIdFallbackNeeded) {
                    mediaSourceId ||= item.Id;
                }

                return getPlaybackMediaSource(player, apiClient, deviceProfile, item, mediaSourceId, options).then(async (mediaSource) => {
                    if (trackOptions.DefaultSecondarySubtitleStreamIndex != null) {
                        mediaSource.DefaultSecondarySubtitleStreamIndex = trackOptions.DefaultSecondarySubtitleStreamIndex;
                    }

                    if (mediaSource.DefaultSubtitleStreamIndex == null || mediaSource.DefaultSubtitleStreamIndex < 0) {
                        if (mediaSource.DefaultSecondarySubtitleStreamIndex != null) {
                            mediaSource.DefaultSubtitleStreamIndex = mediaSource.DefaultSecondarySubtitleStreamIndex;
                        }
                        mediaSource.DefaultSecondarySubtitleStreamIndex = -1;
                    }

                    const subtitleTrack1 = mediaSource.MediaStreams[mediaSource.DefaultSubtitleStreamIndex];
                    const subtitleTrack2 = mediaSource.MediaStreams[mediaSource.DefaultSecondarySubtitleStreamIndex];

                    if (!self.trackHasSecondarySubtitleSupport(subtitleTrack1, player)
                        || !self.trackHasSecondarySubtitleSupport(subtitleTrack2, player)) {
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

        self.getPlaybackInfo = function (item, options) {
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

        self.getPlaybackMediaSources = function (item, options) {
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

        function createStreamInfo(apiClient, type, item, mediaSource, startPosition, player) {
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
                        ApiKey: apiClient.accessToken()
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
            if (type === "Audio") {
              let link = document.getElementById("next-audio-prefetch");

              if (!link) {
                link = document.createElement("link");
                link.id = "next-audio-prefetch";
                link.rel = "prefetch";
                link.as = "audio";
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

        function getTextTracks(apiClient, item, mediaSource) {
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

        function getPlaybackMediaSource(player, apiClient, deviceProfile, item, mediaSourceId, options) {
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
                                if (item.AlbumId != null) {
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

        function getPlayer(item, playOptions, forceLocalPlayers) {
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

        self.getItemFromPlaylistItemId = function (playlistItemId) {
            let item;
            let itemIndex;
            const playlist = self._playQueueManager.getPlaylist();

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

        self.setCurrentPlaylistItem = function (playlistItemId, player) {
            hijackMediaElementForCrossfade();

            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.setCurrentPlaylistItem(playlistItemId);
            }

            const newItem = self.getItemFromPlaylistItemId(playlistItemId);

            if (newItem.Item) {
                const newItemPlayOptions = newItem.Item.playOptions || getDefaultPlayOptions();

                playInternal(newItem.Item, newItemPlayOptions, function () {
                    setPlaylistState(newItem.Item.PlaylistItemId, newItem.Index);
                });
            }
        };

        self.removeFromPlaylist = function (playlistItemIds, player) {
            if (!playlistItemIds) {
                throw new Error('Invalid playlistItemIds');
            }

            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.removeFromPlaylist(playlistItemIds);
            }

            const removeResult = self._playQueueManager.removeFromPlaylist(playlistItemIds);

            if (removeResult.result === 'empty') {
                return self.stop(player);
            }

            const isCurrentIndex = removeResult.isCurrentIndex;

            Events.trigger(player, 'playlistitemremove', [
                {
                    playlistItemIds: playlistItemIds
                }
            ]);

            if (isCurrentIndex) {
                return self.setCurrentPlaylistItem(self._playQueueManager.getPlaylist()[0].PlaylistItemId, player);
            }

            return Promise.resolve();
        };

        self.movePlaylistItem = function (playlistItemId, newIndex, player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.movePlaylistItem(playlistItemId, newIndex);
            }

            const moveResult = self._playQueueManager.movePlaylistItem(playlistItemId, newIndex);

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

        self.getCurrentPlaylistIndex = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getCurrentPlaylistIndex();
            }

            return self._playQueueManager.getCurrentPlaylistIndex();
        };

        self.getCurrentPlaylistItemId = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.getCurrentPlaylistItemId();
            }

            return self._playQueueManager.getCurrentPlaylistItemId();
        };

        self.channelUp = function (player) {
            player = player || self._currentPlayer;
            return self.nextTrack(player);
        };

        self.channelDown = function (player) {
            player = player || self._currentPlayer;
            return self.previousTrack(player);
        };

        function getPreviousSource(player) {
            const prevSource = self.currentMediaSource(player);
            const prevPlayerData = getPlayerData(player);
            return {
                ...prevSource,
                DefaultAudioStreamIndex: prevPlayerData.audioStreamIndex,
                DefaultSubtitleStreamIndex: prevPlayerData.subtitleStreamIndex,
                DefaultSecondarySubtitleStreamIndex: prevPlayerData.secondarySubtitleStreamIndex
            };
        }

        self.nextTrack = function (player) {
            hijackMediaElementForCrossfade();

            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.nextTrack();
            }

            const newItemInfo = self._playQueueManager.getNextItemInfo();

            if (newItemInfo) {
                console.debug('playing next track');

                const newItemPlayOptions = newItemInfo.item.playOptions || getDefaultPlayOptions();

                playInternal(newItemInfo.item, newItemPlayOptions, function () {
                    setPlaylistState(newItemInfo.item.PlaylistItemId, newItemInfo.index);
                }, getPreviousSource(player));
            }
        };

        self.previousTrack = function (player) {
            player = player || self._currentPlayer;
            if (player && !enableLocalPlaylistManagement(player)) {
                return player.previousTrack();
            }

            const newIndex = self.getCurrentPlaylistIndex(player) - 1;
            if (newIndex >= 0) {
                const playlist = self._playQueueManager.getPlaylist();
                const newItem = playlist[newIndex];

                if (newItem) {
                    const newItemPlayOptions = newItem.playOptions || getDefaultPlayOptions();
                    newItemPlayOptions.startPositionTicks = 0;

                    playInternal(newItem, newItemPlayOptions, function () {
                        setPlaylistState(newItem.PlaylistItemId, newIndex);
                    }, getPreviousSource(player));
                }
            }
        };

        self.queue = function (options, player = this._currentPlayer) {
            return queue(options, '', player);
        };

        self.queueNext = function (options, player = this._currentPlayer) {
            return queue(options, 'next', player);
        };

        function queue(options, mode, player) {
            player = player || self._currentPlayer;

            if (!player) {
                return self.play(options);
            }

            if (options.items) {
                return translateItemsForPlayback(options.items, options).then(function (items) {
                    // TODO: Handle options.startIndex for photos
                    queueAll(items, mode, player);
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
                        queueAll(items, mode, player);
                    });
                });
            }
        }

        function queueAll(items, mode, player) {
            if (!items.length) {
                return;
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
                return;
            }

            const queueDirectToPlayer = player && !enableLocalPlaylistManagement(player);

            if (queueDirectToPlayer) {
                const apiClient = ServerConnections.getApiClient(items[0].ServerId);

                player.getDeviceProfile(items[0]).then(function (profile) {
                    setStreamUrls(items, profile, self.getMaxStreamingBitrate(player), apiClient, 0).then(function () {
                        if (mode === 'next') {
                            player.queueNext(items);
                        } else {
                            player.queue(items);
                        }
                    });
                });

                return;
            }

            if (mode === 'next') {
                self._playQueueManager.queueNext(items);
            } else {
                self._playQueueManager.queue(items);
            }
            Events.trigger(player, 'playlistitemadd');
        }

        function onPlayerProgressInterval() {
            const player = this;
            sendProgressUpdate(player, 'timeupdate');
        }

        function startPlaybackProgressTimer(player) {
            stopPlaybackProgressTimer(player);

            player._progressInterval = setInterval(onPlayerProgressInterval.bind(player), 10000);
        }

        function stopPlaybackProgressTimer(player) {
            if (player._progressInterval) {
                clearInterval(player._progressInterval);
                player._progressInterval = null;
            }
        }

        function onPlaybackStarted(player, playOptions, streamInfo, mediaSource) {
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

            self._playNextAfterEnded = true;
            const isFirstItem = playOptions.isFirstItem;
            const fullscreen = playOptions.fullscreen;

            const state = self.getPlayerState(player, streamInfo.item, streamInfo.mediaSource);

            reportPlayback(self, state, player, true, state.NowPlayingItem.ServerId, 'reportPlaybackStart');

            state.IsFirstItem = isFirstItem;
            state.IsFullscreen = fullscreen;
            Events.trigger(player, 'playbackstart', [state]);
            Events.trigger(self, 'playbackstart', [player, state]);

            // only used internally as a safeguard to avoid reporting other events to the server before playback start
            streamInfo.started = true;

            startPlaybackProgressTimer(player);
        }

        function onPlaybackStartedFromSelfManagingPlayer(e, item, mediaSource) {
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

            const state = self.getPlayerState(player, item, mediaSource);

            reportPlayback(self, state, player, true, state.NowPlayingItem.ServerId, 'reportPlaybackStart');

            state.IsFirstItem = isFirstItem;
            state.IsFullscreen = fullscreen;
            Events.trigger(player, 'playbackstart', [state]);
            Events.trigger(self, 'playbackstart', [player, state]);

            // only used internally as a safeguard to avoid reporting other events to the server before playback start
            streamInfo.started = true;

            startPlaybackProgressTimer(player);
        }

        function onPlaybackStoppedFromSelfManagingPlayer(e, playerStopInfo) {
            const player = this;

            stopPlaybackProgressTimer(player);
            const state = self.getPlayerState(player, playerStopInfo.item, playerStopInfo.mediaSource);

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
        function enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy) {
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
        function onPlaybackError(e, error) {
            destroyWaveSurferInstance();
            const player = this;
            error = error || {};

            const errorType = error.type;

            console.warn('[playbackmanager] onPlaybackError:', e, error);

            const streamInfo = error.streamInfo || getPlayerData(player).streamInfo;

            if (streamInfo?.url) {
                const isAlreadyFallbacking = streamInfo.url.toLowerCase().includes('transcodereasons');
                const currentlyPreventsVideoStreamCopy = streamInfo.url.toLowerCase().indexOf('allowvideostreamcopy=false') !== -1;
                const currentlyPreventsAudioStreamCopy = streamInfo.url.toLowerCase().indexOf('allowaudiostreamcopy=false') !== -1;

                // Auto switch to transcoding
                if (enablePlaybackRetryWithTranscoding(streamInfo, errorType, currentlyPreventsVideoStreamCopy, currentlyPreventsAudioStreamCopy)) {
                    const startTime = getCurrentTicks(player) || streamInfo.playerStartPositionTicks;
                    const isRemoteSource = streamInfo.item.LocationType === 'Remote';
                    // force transcoding and only allow remuxing for remote source like liveTV, but only for initial trial
                    const tryVideoStreamCopy = isRemoteSource && !isAlreadyFallbacking;

                    changeStream(player, startTime, {
                        EnableDirectPlay: false,
                        EnableDirectStream: tryVideoStreamCopy,
                        AllowVideoStreamCopy: tryVideoStreamCopy,
                        AllowAudioStreamCopy: currentlyPreventsAudioStreamCopy || currentlyPreventsVideoStreamCopy ? false : null
                    });

                    return;
                }
            }

            Events.trigger(self, 'playbackerror', [errorType]);

            onPlaybackStopped.call(player, e, `.${errorType}`);
        }

        function onPlaybackStopped(e, displayErrorCode) {
            const player = this;

            if (getPlayerData(player).isChangingStream) {
                return;
            }

            stopPlaybackProgressTimer(player);

            // User clicked stop or content ended
            const state = self.getPlayerState(player);
            const data = getPlayerData(player);
            const streamInfo = data.streamInfo;

            const errorOccurred = displayErrorCode && typeof (displayErrorCode) === 'string';

            const nextItem = self._playNextAfterEnded && !errorOccurred ? self._playQueueManager.getNextItemInfo() : null;

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
                self._playQueueManager.reset();
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
                const apiClient = ServerConnections.getApiClient(nextItem.item.ServerId);

                apiClient.getCurrentUser().then(function (user) {
                    if (user.Configuration.EnableNextEpisodeAutoPlay || nextMediaType !== MediaType.Video) {
                        self.nextTrack();
                    }
                });
            }
        }

        function onPlaybackChanging(activePlayer, newPlayer, newItem) {
            const state = self.getPlayerState(activePlayer);

            const serverId = self.currentItem(activePlayer).ServerId;

            // User started playing something new while existing content is playing
            let promise;

            stopPlaybackProgressTimer(activePlayer);
            unbindStopped(activePlayer);

            if (activePlayer === newPlayer) {
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

        function bindStopped(player) {
            if (enableLocalPlaylistManagement(player)) {
                Events.off(player, 'stopped', onPlaybackStopped);
                Events.on(player, 'stopped', onPlaybackStopped);
            }
        }

        function onPlaybackTimeUpdate() {
            const player = this;
            if (timeRunningOut(player)) {
                self.nextTrack();
            }

            sendProgressUpdate(player, 'timeupdate');
        }

        function onPlaybackPause() {
            const player = this;
            sendProgressUpdate(player, 'pause');
        }

        function onPlaybackUnpause() {
            const player = this;
            sendProgressUpdate(player, 'unpause');
        }

        function onPlaybackVolumeChange() {
            const player = this;
            sendProgressUpdate(player, 'volumechange');
        }

        function onRepeatModeChange() {
            const player = this;
            sendProgressUpdate(player, 'repeatmodechange');
        }

        function onShuffleQueueModeChange() {
            const player = this;
            sendProgressUpdate(player, 'shufflequeuemodechange');
        }

        function onPlaylistItemMove() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemmove', true);
        }

        function onPlaylistItemRemove() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemremove', true);
        }

        function onPlaylistItemAdd() {
            const player = this;
            sendProgressUpdate(player, 'playlistitemadd', true);
        }

        function unbindStopped(player) {
            Events.off(player, 'stopped', onPlaybackStopped);
        }

        function initLegacyVolumeMethods(player) {
            player.getVolume = function () {
                return player.volume();
            };
            player.setVolume = function (val) {
                return player.volume(val);
            };
        }

        function initMediaPlayer(player) {
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

        function sendProgressUpdate(player, progressEventName, reportPlaylist) {
            if (!player) {
                throw new Error('player cannot be null');
            }

            const state = self.getPlayerState(player);

            if (state.NowPlayingItem) {
                const serverId = state.NowPlayingItem.ServerId;

                const streamInfo = getPlayerData(player).streamInfo;

                if (streamInfo?.started && !streamInfo.ended) {
                    reportPlayback(self, state, player, reportPlaylist, serverId, 'reportPlaybackProgress', progressEventName);
                }

                if (streamInfo?.liveStreamId
                    && (new Date().getTime() - (streamInfo.lastMediaInfoQuery || 0) >= 600000)
                ) {
                    getLiveStreamMediaInfo(player, streamInfo, self.currentMediaSource(player), streamInfo.liveStreamId, serverId);
                }
            }
        }

        function getLiveStreamMediaInfo(player, streamInfo, mediaSource, liveStreamId, serverId) {
            console.debug('getLiveStreamMediaInfo');

            streamInfo.lastMediaInfoQuery = new Date().getTime();

            ServerConnections.getApiClient(serverId).getLiveStreamMediaInfo(liveStreamId).then(function (info) {
                mediaSource.MediaStreams = info.MediaStreams;
                Events.trigger(player, 'mediastreamschange');
            }, function () {
                // Swallow errors
            });
        }

        self.onAppClose = function () {
            const player = this._currentPlayer;

            // Try to report playback stopped before the app closes
            if (player && this.isPlaying(player)) {
                this._playNextAfterEnded = false;
                onPlaybackStopped.call(player);
            }
        };

        self.playbackStartTime = function (player = this._currentPlayer) {
            if (player && !enableLocalPlaylistManagement(player) && !player.isLocalPlayer) {
                return player.playbackStartTime();
            }

            const streamInfo = getPlayerData(player).streamInfo;
            return streamInfo ? streamInfo.playbackStartTimeTicks : null;
        };

        if (appHost.supports(AppFeature.RemoteControl)) {
            import('../../scripts/serverNotifications').then(({ default: serverNotifications }) => {
                Events.on(serverNotifications, 'ServerShuttingDown', self.setDefaultPlayerActive.bind(self));
                Events.on(serverNotifications, 'ServerRestarting', self.setDefaultPlayerActive.bind(self));
            });
        }

        bindMediaSegmentManager(self);
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
        if (enabled != null) {
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
        if (player.fastForward != null) {
            player.fastForward(userSettings.skipForwardLength());
            return;
        }

        // Go back 15 seconds
        const offsetTicks = userSettings.skipForwardLength() * 10000;

        this.seekRelative(offsetTicks, player);
    }

    rewind(player = this._currentPlayer) {
        if (player.rewind != null) {
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
        if (player) {
            if (enableLocalPlaylistManagement(player)) {
                this._playNextAfterEnded = false;
            }

            // TODO: remove second param
            return player.stop(true, true);
        }

        return Promise.resolve();
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
        if (player) {
            player.pause();
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

            if (appHost.supports(AppFeature.Fullscreen)) {
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
bindMediaSegmentManager(playbackManager);
bindMediaSessionSubscriber(playbackManager);

window.addEventListener('beforeunload', function () {
    try {
        playbackManager.onAppClose();
    } catch (err) {
        console.error('error in onAppClose: ' + err);
    }
});
