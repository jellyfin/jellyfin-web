define(['events', 'globalize', 'playbackManager', 'connectionManager', 'playMethodHelper', 'layoutManager', 'serverNotifications', 'paper-icon-button-light', 'css!./playerstats'], function (events, globalize, playbackManager, connectionManager, playMethodHelper, layoutManager, serverNotifications) {
    'use strict';

    function init(instance) {

        var parent = document.createElement('div');

        parent.classList.add('playerStats');

        if (layoutManager.tv) {
            parent.classList.add('playerStats-tv');
        }

        parent.classList.add('hide');

        var button;

        if (layoutManager.tv) {
            button = '';
        } else {
            button = '<button type="button" is="paper-icon-button-light" class="playerStats-closeButton"><i class="material-icons">close</i></button>';
        }

        var contentClass = layoutManager.tv ? 'playerStats-content playerStats-content-tv' : 'playerStats-content';

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

            var categoryHtml = '';

            var stats = category.stats;

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

            for (var i = 0, length = stats.length; i < length; i++) {

                categoryHtml += '<div class="playerStats-stat">';

                var stat = stats[i];

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

        var now = new Date().getTime();

        if ((now - (instance.lastSessionTime || 0)) < 10000) {
            return Promise.resolve(instance.lastSession);
        }

        var apiClient = connectionManager.getApiClient(playbackManager.currentItem(player).ServerId);

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
        var sessionStats = [];

        var videoCodec;
        var audioCodec;
        var totalBitrate;
        var audioChannels;

        if (session.TranscodingInfo) {

            videoCodec = session.TranscodingInfo.VideoCodec;
            audioCodec = session.TranscodingInfo.AudioCodec;
            totalBitrate = session.TranscodingInfo.Bitrate;
            audioChannels = session.TranscodingInfo.AudioChannels;
        }

        if (videoCodec) {

            sessionStats.push({
                label: globalize.translate("LabelVideoCodec"),
                value: session.TranscodingInfo.IsVideoDirect ? (videoCodec.toUpperCase() + ' (direct)') : videoCodec.toUpperCase()
            });
        }

        if (audioCodec) {

            sessionStats.push({
                label: globalize.translate("LabelAudioCodec"),
                value: session.TranscodingInfo.IsAudioDirect ? (audioCodec.toUpperCase() + ' (direct)') : audioCodec.toUpperCase()
            });
        }

        //if (audioChannels) {

        //    sessionStats.push({
        //        label: 'Audio channels:',
        //        value: audioChannels
        //    });
        //}

        if (displayPlayMethod === 'Transcode') {
            if (totalBitrate) {

                sessionStats.push({
                    label: globalize.translate("LabelBitrate"),
                    value: getDisplayBitrate(totalBitrate)
                });
            }
            if (session.TranscodingInfo.CompletionPercentage) {

                sessionStats.push({
                    label: globalize.translate("LabelTranscodingProgress"),
                    value: session.TranscodingInfo.CompletionPercentage.toFixed(1) + '%'
                });
            }
            if (session.TranscodingInfo.Framerate) {

                sessionStats.push({
                    label: globalize.translate("LabelTranscodingFramerate"),
                    value: session.TranscodingInfo.Framerate + ' fps'
                });
            }
            if (session.TranscodingInfo.TranscodeReasons && session.TranscodingInfo.TranscodeReasons.length) {

                sessionStats.push({
                    label: globalize.translate("LabelReasonForTranscoding"),
                    value: session.TranscodingInfo.TranscodeReasons.map(translateReason).join('<br/>')
                });
            }
        }

        return sessionStats;
    }

    function getDisplayBitrate(bitrate) {

        if (bitrate > 1000000) {
            return (bitrate / 1000000).toFixed(1) + ' Mbps';
        } else {
            return Math.floor(bitrate / 1000) + ' kbps';
        }
    }

    function getReadableSize(size) {
        if (size >= 1073741824) {
            return parseFloat((size / 1073741824).toFixed(1)) + ' GiB';
        } else if (size >= 1048576) {
            return parseFloat((size / 1048576).toFixed(1)) + ' MiB';
        } else {
            return Math.floor(size / 1024) + ' KiB';
        }
    }

    function getMediaSourceStats(session, player, displayPlayMethod) {

        var sessionStats = [];

        var mediaSource = playbackManager.currentMediaSource(player) || {};
        var totalBitrate = mediaSource.Bitrate;
        var mediaFileSize = mediaSource.Size;

        if (mediaSource.Container) {
            sessionStats.push({
                label: globalize.translate("LabelProfileContainer"),
                value: mediaSource.Container
            });
        }

        if (mediaFileSize) {
            sessionStats.push({
                label: globalize.translate("LabelSize"),
                value: getReadableSize(mediaFileSize)
            });
        }

        if (totalBitrate) {

            sessionStats.push({
                label: globalize.translate("LabelBitrate"),
                value: getDisplayBitrate(totalBitrate)
            });
        }

        var mediaStreams = mediaSource.MediaStreams || [];
        var videoStream = mediaStreams.filter(function (s) {

            return s.Type === 'Video';

        })[0] || {};

        var videoCodec = videoStream.Codec;

        var audioStreamIndex = playbackManager.getAudioStreamIndex(player);
        var audioStream = playbackManager.audioTracks(player).filter(function (s) {

            return s.Type === 'Audio' && s.Index === audioStreamIndex;

        })[0] || {};

        var audioCodec = audioStream.Codec;
        var audioChannels = audioStream.Channels;

        var videoInfos = [];

        if (videoCodec) {
            videoInfos.push(videoCodec.toUpperCase());
        }

        if (videoStream.Profile) {
            videoInfos.push(videoStream.Profile);
        }

        if (videoInfos.length) {
            sessionStats.push({
                label: globalize.translate("LabelVideoCodec"),
                value: videoInfos.join(' ')
            });
        }

        if (videoStream.BitRate) {
            sessionStats.push({
                label: globalize.translate("LabelVideoBitrate"),
                value: getDisplayBitrate(videoStream.BitRate)
            });
        }

        var audioInfos = [];

        if (audioCodec) {
            audioInfos.push(audioCodec.toUpperCase());
        }

        if (audioStream.Profile) {
            audioInfos.push(audioStream.Profile);
        }

        if (audioInfos.length) {
            sessionStats.push({
                label: globalize.translate("LabelAudioCodec"),
                value: audioInfos.join(' ')
            });
        }

        if (audioStream.BitRate) {
            sessionStats.push({
                label: globalize.translate("LabelAudioBitrate"),
                value: getDisplayBitrate(audioStream.BitRate)
            });
        }

        if (audioChannels) {
            sessionStats.push({
                label: globalize.translate("LabelAudioChannels"),
                value: audioChannels
            });
        }

        if (audioStream.SampleRate) {
            sessionStats.push({
                label: globalize.translate("LabelAudioSampleRate"),
                value: audioStream.SampleRate + ' Hz'
            });
        }

        if (audioStream.BitDepth) {
            sessionStats.push({
                label: globalize.translate("LabelAudioBitDepth"),
                value: audioStream.BitDepth
            });
        }

        return sessionStats;
    }

    function getStats(instance, player) {

        var statsPromise = player.getStats ? player.getStats() : Promise.resolve({});
        var sessionPromise = getSession(instance, player);

        return Promise.all([statsPromise, sessionPromise]).then(function (responses) {

            var playerStatsResult = responses[0];
            var playerStats = playerStatsResult.categories || [];
            var session = responses[1];

            var displayPlayMethod = playMethodHelper.getDisplayPlayMethod(session);

            var baseCategory = {
                stats: [],
                name: 'Playback Info'
            };

            baseCategory.stats.unshift({
                label: globalize.translate("LabelPlayMethod"),
                value: displayPlayMethod
            });

            baseCategory.stats.unshift({
                label: globalize.translate("LabelPlayer"),
                value: player.name
            });

            var categories = [];

            categories.push(baseCategory);

            for (var i = 0, length = playerStats.length; i < length; i++) {

                var category = playerStats[i];
                if (category.type === 'audio') {
                    category.name = 'Audio Info';
                } else if (category.type === 'video') {
                    category.name = 'Video Info';
                }
                categories.push(category);
            }

            if (session.TranscodingInfo) {

                categories.push({
                    stats: getTranscodingStats(session, player, displayPlayMethod),
                    name: displayPlayMethod === 'Transcode' ? 'Transcoding Info' : 'Direct Stream Info'
                });
            }

            categories.push({
                stats: getMediaSourceStats(session, player),
                name: 'Original Media Info'
            });

            return Promise.resolve(categories);
        });
    }

    function renderPlayerStats(instance, player) {

        var now = new Date().getTime();

        if ((now - (instance.lastRender || 0)) < 700) {
            return;
        }

        instance.lastRender = now;

        getStats(instance, player).then(function (stats) {

            var elem = instance.element;
            if (!elem) {
                return;
            }

            renderStats(elem, stats);
        });
    }

    function bindEvents(instance, player) {

        var localOnTimeUpdate = function () {
            renderPlayerStats(instance, player);
        };

        instance.onTimeUpdate = localOnTimeUpdate;
        events.on(player, 'timeupdate', localOnTimeUpdate);
    }

    function unbindEvents(instance, player) {

        var localOnTimeUpdate = instance.onTimeUpdate;

        if (localOnTimeUpdate) {
            events.off(player, 'timeupdate', localOnTimeUpdate);
        }
    }

    function PlayerStats(options) {

        this.options = options;

        init(this);

        this.enabled(true);
    }

    PlayerStats.prototype.enabled = function (enabled) {

        if (enabled == null) {
            return this._enabled;
        }

        var options = this.options;

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
    };

    PlayerStats.prototype.toggle = function () {
        this.enabled(!this.enabled());
    };

    PlayerStats.prototype.destroy = function () {

        var options = this.options;

        if (options) {

            this.options = null;
            unbindEvents(this, options.player);
        }

        var elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
    };

    return PlayerStats;
});
