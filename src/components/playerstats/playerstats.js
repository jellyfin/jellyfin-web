import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from 'types/plugin';
import Events from 'utils/events';
import { getReadableSize } from 'utils/file';

import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import playMethodHelper from '../playback/playmethodhelper';
import { pluginManager } from '../pluginManager';

import 'elements/emby-button/paper-icon-button-light';

import './playerstats.scss';

function init(instance) {
    const parent = document.createElement('div');

    parent.classList.add('playerStats');

    if (layoutManager.tv) {
        parent.classList.add('playerStats-tv');
    }

    parent.classList.add('hide');

    let button;

    if (layoutManager.tv) {
        button = '';
    } else {
        button = '<button type="button" is="paper-icon-button-light" class="playerStats-closeButton"><span class="material-icons close" aria-hidden="true"></span></button>';
    }

    const contentClass = layoutManager.tv ? 'playerStats-content playerStats-content-tv' : 'playerStats-content';

    parent.innerHTML = '<div class="' + contentClass + '">' + button + '<div class="playerStats-stats"></div></div>';

    button = parent.querySelector('.playerStats-closeButton');

    if (button) {
        button.addEventListener('click', onCloseButtonClick.bind(instance));
    }

    document.body.appendChild(parent);

    instance.element = parent;
}

function onCloseButtonClick() {
    this.enabled(false);
}

function renderStats(elem, categories) {
    elem.querySelector('.playerStats-stats').innerHTML = categories.map(function (category) {
        let categoryHtml = '';

        const stats = category.stats;

        if (stats.length && category.name) {
            categoryHtml += '<div class="playerStats-stat playerStats-stat-header">';

            categoryHtml += '<div class="playerStats-stat-label">';
            categoryHtml += category.name;
            categoryHtml += '</div>';

            categoryHtml += '<div class="playerStats-stat-value">';
            categoryHtml += category.subText || '';
            categoryHtml += '</div>';

            categoryHtml += '</div>';
        }

        for (let i = 0, length = stats.length; i < length; i++) {
            categoryHtml += '<div class="playerStats-stat">';

            const stat = stats[i];

            categoryHtml += '<div class="playerStats-stat-label">';
            categoryHtml += stat.label;
            categoryHtml += '</div>';

            categoryHtml += '<div class="playerStats-stat-value">';
            categoryHtml += stat.value;
            categoryHtml += '</div>';

            categoryHtml += '</div>';
        }

        return categoryHtml;
    }).join('');
}

function getSession(instance, player) {
    const now = new Date().getTime();

    if ((now - (instance.lastSessionTime || 0)) < 10000) {
        return Promise.resolve(instance.lastSession);
    }

    const apiClient = ServerConnections.getApiClient(playbackManager.currentItem(player).ServerId);

    return apiClient.getSessions({
        deviceId: apiClient.deviceId()
    }).then(function (sessions) {
        instance.lastSession = sessions[0] || {};
        instance.lastSessionTime = new Date().getTime();

        return Promise.resolve(instance.lastSession);
    }, function () {
        return Promise.resolve({});
    });
}

function translateReason(reason) {
    return globalize.translate('' + reason);
}

function getTranscodingStats(session, player, displayPlayMethod) {
    const sessionStats = [];

    let videoCodec;
    let audioCodec;
    let totalBitrate;
    let audioChannels;

    if (session.TranscodingInfo) {
        videoCodec = session.TranscodingInfo.VideoCodec;
        audioCodec = session.TranscodingInfo.AudioCodec;
        totalBitrate = session.TranscodingInfo.Bitrate;
        audioChannels = session.TranscodingInfo.AudioChannels;
    }

    const targetInfos = [];
    const transcodeInfos = [];
    if (videoCodec) {
        targetInfos.push(session.TranscodingInfo.IsVideoDirect ? (`${videoCodec.toUpperCase()} (direct)`) : videoCodec.toUpperCase());
    }
    if (audioCodec) {
        targetInfos.push(session.TranscodingInfo.IsAudioDirect ? (`${audioCodec.toUpperCase()} (direct)`) : audioCodec.toUpperCase());
    }
    if (displayPlayMethod === 'Transcode') {
        if (audioChannels) {
            targetInfos.push(`${audioChannels} Ch`);
        }
        if (totalBitrate) {
            targetInfos.push(getDisplayBitrate(totalBitrate));
        }
        if (session.TranscodingInfo.CompletionPercentage) {
            transcodeInfos.push(`${session.TranscodingInfo.CompletionPercentage.toFixed(1)}%`);
        }
        if (session.TranscodingInfo.Framerate) {
            transcodeInfos.push(getDisplayTranscodeFps(session, player));
        }
    }
    if (targetInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelTargetCodecs'),
            value: targetInfos.join(',  ')
        });
    }
    if (transcodeInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelProgressAndSpeed'),
            value: transcodeInfos.join(' / ')
        });
    }
    if (session.TranscodingInfo.TranscodeReasons?.length) {
        sessionStats.push({
            label: globalize.translate('LabelReasons'),
            value: session.TranscodingInfo.TranscodeReasons.map(translateReason).join('<br/>')
        });
    }

    return sessionStats;
}

function getDisplayBitrate(bitrate) {
    if (bitrate > 1000000) {
        return (bitrate / 1000000).toFixed(1) + ' Mbps';
    } else {
        return Math.floor(bitrate / 1000) + ' Kbps';
    }
}

function getDisplayTranscodeFps(session, player) {
    const mediaSource = playbackManager.currentMediaSource(player) || {};
    const videoStream = (mediaSource.MediaStreams || []).find((s) => s.Type === 'Video') || {};

    const originalFramerate = videoStream.ReferenceFrameRate || videoStream.RealFrameRate;
    const transcodeFramerate = session.TranscodingInfo.Framerate;

    if (!originalFramerate) {
        return `${transcodeFramerate} fps`;
    }

    return `${transcodeFramerate} fps (${(transcodeFramerate / originalFramerate).toFixed(2)}x)`;
}

function getMediaSourceStats(session, player) {
    const sessionStats = [];

    const mediaSource = playbackManager.currentMediaSource(player) || {};
    const totalBitrate = mediaSource.Bitrate;
    const mediaFileSize = mediaSource.Size;

    const containerInfos = [];
    if (mediaSource.Container) {
        containerInfos.push(mediaSource.Container);
    }
    if (mediaFileSize) {
        containerInfos.push(getReadableSize(mediaFileSize));
    }
    if (totalBitrate) {
        containerInfos.push(getDisplayBitrate(totalBitrate));
    }
    if (containerInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelProfileContainer'),
            value: containerInfos.join(',  ')
        });
    }

    const mediaStreams = mediaSource.MediaStreams || [];
    const videoStream = mediaStreams.filter(function (s) {
        return s.Type === 'Video';
    })[0] || {};

    const videoCodec = videoStream.Codec;

    const audioStreamIndex = playbackManager.getAudioStreamIndex(player);
    const audioStream = playbackManager.audioTracks(player).filter(function (s) {
        return s.Type === 'Audio' && s.Index === audioStreamIndex;
    })[0] || {};

    const audioCodec = audioStream.Codec;

    const videoCodecInfos = [];
    if (videoCodec) {
        videoCodecInfos.push(videoCodec.toUpperCase());
    }
    if (videoStream.VideoDoViTitle) {
        videoCodecInfos.push(videoStream.VideoDoViTitle);
    }
    if (videoCodecInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelVideoCodec'),
            value: videoCodecInfos.join('  ')
        });
    }

    const videoAttributes = [];
    if (videoStream.Profile) {
        videoAttributes.push(videoStream.Profile);
    }
    if (videoStream.Level && videoStream.Level >= 0) {
        videoAttributes.push(`Lv ${videoStream.Level}`);
    }
    if (videoStream.BitRate) {
        videoAttributes.push(getDisplayBitrate(videoStream.BitRate));
    }
    const frameRate = videoStream.AverageFrameRate || videoStream.RealFrameRate;
    if (frameRate) {
        videoAttributes.push(`${frameRate.toFixed(2)} fps`);
    }
    if (videoAttributes.length) {
        sessionStats.push({
            label: globalize.translate('LabelVideoAttributes'),
            value: videoAttributes.join(',  ')
        });
    }

    const videoBitDepthInfos = [];
    if (videoStream.BitDepth) {
        videoBitDepthInfos.push(`${videoStream.BitDepth} Bit`);
    }
    if (videoStream.PixelFormat) {
        videoBitDepthInfos.push(videoStream.PixelFormat);
    }
    if (videoStream.VideoRangeType) {
        videoBitDepthInfos.push(videoStream.VideoRangeType);
    }
    if (videoBitDepthInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelVideoBitDepth'),
            value: videoBitDepthInfos.join(',  ')
        });
    }

    const videoColorInfos = [];
    if (videoStream.ColorSpace) {
        videoColorInfos.push(`${videoStream.ColorSpace}(m)`);
    }
    if (videoStream.ColorPrimaries) {
        videoColorInfos.push(`${videoStream.ColorPrimaries}(p)`);
    }
    if (videoStream.ColorTransfer) {
        videoColorInfos.push(`${videoStream.ColorTransfer}(t)`);
    }
    if (videoColorInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelVideoColors'),
            value: videoColorInfos.join(',  ')
        });
    }

    const audioCodecInfos = [];
    if (audioCodec) {
        audioCodecInfos.push(audioCodec.toUpperCase());
    }
    if (audioStream.Profile) {
        audioCodecInfos.push(audioStream.Profile);
    }
    if (audioCodecInfos.length) {
        sessionStats.push({
            label: globalize.translate('LabelAudioCodec'),
            value: audioCodecInfos.join('  ')
        });
    }

    const audioAttributes = [];
    if (audioStream.Channels) {
        audioAttributes.push(`${audioStream.Channels} Ch`);
    }
    if (audioStream.BitRate) {
        audioAttributes.push(getDisplayBitrate(audioStream.BitRate));
    }
    if (audioStream.SampleRate) {
        audioAttributes.push(`${audioStream.SampleRate} Hz`);
    }
    if (audioStream.BitDepth) {
        audioAttributes.push(`${audioStream.BitDepth} Bit`);
    }
    if (audioAttributes.length) {
        sessionStats.push({
            label: globalize.translate('LabelAudioAttributes'),
            value: audioAttributes.join(',  ')
        });
    }

    return sessionStats;
}

function getSyncPlayStats() {
    const SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

    if (!SyncPlay?.Manager.isSyncPlayEnabled()) {
        return [];
    }

    const syncStats = [];
    const stats = SyncPlay.Manager.getStats();

    syncStats.push({
        label: globalize.translate('LabelSyncPlayTimeSyncDevice'),
        value: stats.TimeSyncDevice
    });

    syncStats.push({
        // TODO: clean old string 'LabelSyncPlayTimeOffset' from translations.
        label: globalize.translate('LabelSyncPlayTimeSyncOffset'),
        value: stats.TimeSyncOffset + ' ' + globalize.translate('MillisecondsUnit')
    });

    syncStats.push({
        label: globalize.translate('LabelSyncPlayPlaybackDiff'),
        value: stats.PlaybackDiff + ' ' + globalize.translate('MillisecondsUnit')
    });

    syncStats.push({
        label: globalize.translate('LabelSyncPlaySyncMethod'),
        value: stats.SyncMethod
    });

    return syncStats;
}

function getStats(instance, player) {
    const statsPromise = player.getStats ? player.getStats() : Promise.resolve({});
    const sessionPromise = getSession(instance, player);

    return Promise.all([statsPromise, sessionPromise]).then(function (responses) {
        const playerStatsResult = responses[0];
        const playerStats = playerStatsResult.categories || [];
        const session = responses[1];

        const displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);
        let localizedDisplayMethod = displayPlayMethod;

        if (displayPlayMethod === 'DirectPlay') {
            localizedDisplayMethod = globalize.translate('DirectPlaying');
        } else if (displayPlayMethod === 'Remux') {
            localizedDisplayMethod = globalize.translate('Remuxing');
        } else if (displayPlayMethod === 'DirectStream') {
            localizedDisplayMethod = globalize.translate('DirectStreaming');
        } else if (displayPlayMethod === 'Transcode') {
            localizedDisplayMethod = globalize.translate('Transcoding');
        }

        const baseCategory = {
            stats: [],
            name: globalize.translate('LabelPlaybackInfo')
        };

        const playerInfos = [];
        playerInfos.push(player.name);
        playerInfos.push(`(${localizedDisplayMethod})`);
        baseCategory.stats.push({
            label: globalize.translate('LabelPlayer'),
            value: playerInfos.join('  ')
        });

        const categories = [];
        categories.push(baseCategory);
        for (let i = 0, length = playerStats.length; i < length; i++) {
            const category = playerStats[i];
            categories.push(category);
        }

        let localizedTranscodingInfo = globalize.translate('LabelTranscodingInfo');
        if (displayPlayMethod === 'Remux') {
            localizedTranscodingInfo = globalize.translate('LabelRemuxingInfo');
        } else if (displayPlayMethod === 'DirectStream') {
            localizedTranscodingInfo = globalize.translate('LabelDirectStreamingInfo');
        }

        if (session.TranscodingInfo) {
            categories.push({
                stats: getTranscodingStats(session, player, displayPlayMethod),
                name: localizedTranscodingInfo
            });
        }

        categories.push({
            stats: getMediaSourceStats(session, player),
            name: globalize.translate('LabelOriginalMediaInfo')
        });

        const syncPlayStats = getSyncPlayStats();
        if (syncPlayStats.length > 0) {
            categories.push({
                stats: syncPlayStats,
                name: globalize.translate('LabelSyncPlayInfo')
            });
        }

        return Promise.resolve(categories);
    });
}

function renderPlayerStats(instance, player) {
    const now = new Date().getTime();

    if ((now - (instance.lastRender || 0)) < 700) {
        return;
    }

    instance.lastRender = now;

    getStats(instance, player).then(function (stats) {
        const elem = instance.element;
        if (!elem) {
            return;
        }

        renderStats(elem, stats);
    });
}

function bindEvents(instance, player) {
    const localOnTimeUpdate = function () {
        renderPlayerStats(instance, player);
    };

    instance.onTimeUpdate = localOnTimeUpdate;
    Events.on(player, 'timeupdate', localOnTimeUpdate);
}

function unbindEvents(instance, player) {
    const localOnTimeUpdate = instance.onTimeUpdate;

    if (localOnTimeUpdate) {
        Events.off(player, 'timeupdate', localOnTimeUpdate);
    }
}

class PlayerStats {
    constructor(options) {
        this.options = options;

        init(this);

        this.enabled(true);
    }

    enabled(enabled) {
        if (enabled == null) {
            return this._enabled;
        }

        const options = this.options;

        if (!options) {
            return;
        }

        this._enabled = enabled;
        if (enabled) {
            this.element.classList.remove('hide');
            bindEvents(this, options.player);
        } else {
            this.element.classList.add('hide');
            unbindEvents(this, options.player);
        }
    }

    toggle() {
        this.enabled(!this.enabled());
    }

    destroy() {
        const options = this.options;

        if (options) {
            this.options = null;
            unbindEvents(this, options.player);
        }

        const elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
    }
}

export default PlayerStats;
