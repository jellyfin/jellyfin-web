import DOMPurify from 'dompurify';
import subtitleAppearanceHelper from 'components/subtitlesettings/subtitleappearancehelper';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import loading from '../../components/loading/loading';
import { appRouter } from '../../components/router/appRouter';
import globalize from '../../lib/globalize';
import { setBackdropTransparency, TRANSPARENCY_LEVEL } from '../../components/backdrop/backdrop';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';


function getMediaStreamAudioTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Audio';
    });
}

function getMediaStreamTextTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Subtitle';
    });
}

function normalizeSubtitleText(text) {
    const result = text
        .replace(/\\N/gi, '\n') // Correct newline characters
        .replace(/\r/gi, '') // Remove carriage return characters
        .replace(/{\\.*?}/gi, '') // Remove ass/ssa tags
        // Force LTR as the default direction
        .split('\n').map(val => `\u200E${val}`).join('\n');
    return result.replace(/\n/gi, '<br>');
}

class AvplayVideoPlayer {
    // playbackManager needs this
    name = "AVPlay Video Player";
    type = PluginType.MediaPlayer;
    id = 'avplay-video';
    isLocalPlayer = true;
    //lastPlayerData = {}; // FIXME: need?

    _currentPlayOptions = {};
    _currentTrackOffset = 0;

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'video';
    }

    supportsPlayMethod(playMethod, item) {
        return true;
    }

    getDeviceProfile(item, options) {
        var profile = {
            Name: this.name + ' Profile',

            MaxStreamingBitrate: 120000000,
            MaxStaticBitrate: 100000000,
            MusicStreamingTranscodingBitrate: 384000,

            CodecProfiles: [
                {
                    Codec: 'h264',
                    Conditions: [
                        {
                            Condition: 'EqualsAny',
                            IsRequired: false,
                            Property: 'VideoProfile',
                            Value: 'high|main|baseline|constrained baseline|high 10'
                        },
                        {
                            Condition: 'LessThanEqual',
                            IsRequired: false,
                            Property: 'VideoLevel',
                            Value: '51'
                        }
                    ],
                    Type: 'Video'
                },
                {
                    Codec: 'hevc',
                    Conditions: [
                        {
                            Condition: 'EqualsAny',
                            IsRequired: false,
                            Property: 'VideoProfile',
                            Value: 'main|main 10'
                        },
                        {
                            Condition: 'LessThanEqual',
                            IsRequired: false,
                            Property: 'VideoLevel',
                            Value: '183'
                        }
                    ],
                    Type: 'Video'
                }
            ],

            DirectPlayProfiles: [
                {
                    Container: 'webm',
                    AudioCodec: 'vorbis,opus',
                    VideoCodec: 'vp8,vp9',
                    Type: 'Video'
                },
                {
                    Container: 'mp4,m4v',
                    AudioCodec: 'aac,mp3,ac3,eac3,ac4,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,mpeg2video,vc1,msmpeg4v2,vp8,vp9,av1',
                    Type: 'Video'
                },
                {
                    Container: 'mkv',
                    AudioCodec: 'aac,mp3,ac3,eac3,ac4,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,mpeg2video,vc1,msmpeg4v2,vp8,vp9,av1',
                    Type: 'Video'
                },
                {
                    Container: 'm2ts',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,vc1,mpeg2video',
                    Type: 'Video'
                },
                {
                    Container: 'wmv',
                    Type: 'Video'
                },
                {
                    Container: 'ts,mpegts',
                    AudioCodec: 'aac,mp3,ac3,eac3,ac4,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc,vc1,mpeg2video,av1',
                    Type: 'Video'
                },
                {
                    Container: 'asf',
                    Type: 'Video'
                },
                {
                    Container: 'avi',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264,hevc',
                    Type: 'Video'
                },
                {
                    Container: 'mpg,mpeg,flv,3gp,mts,trp,vob,vro',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    Type: 'Video'
                },
                {
                    Container: 'mov',
                    AudioCodec: 'aac,mp3,ac3,eac3,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis',
                    VideoCodec: 'h264',
                    Type: 'Video'
                },
                {
                    Container: 'opus,mp3,aac,m4a,m4b,flac,webma,wma,wav,ogg',
                    Type: 'Audio'
                },
                {
                    Container: 'webm',
                    AudioCodec: 'opus,webma',
                    Type: 'Audio'
                },
            ],

            ResponseProfiles: [
                {
                    Container: 'm4v',
                    MimeType: 'video/mp4',
                    Type: 'Video'
                }
            ],

            SubtitleProfiles: [
                {
                    Format: 'vtt',
                    Method: 'External'
                },
                {
                    Format: 'ass',
                    Method: 'External'
                },
                {
                    Format: 'ssa',
                    Method: 'External'
                }
            ],

            TranscodingProfiles: [{
                Container: "aac",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "aac",
                Protocol: "hls",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 1,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "aac",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "aac",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "mp3",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "mp3",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "opus",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "opus",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "wav",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "wav",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "opus",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "opus",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "mp3",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "mp3",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "aac",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "aac",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "wav",
                Type: 'Audio',
                VideoCodec: "",
                AudioCodec: "wav",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "mkv",
                Type: 'Video',
                VideoCodec: "h264,hevc,mpeg2video,vc1,msmpeg4v2,vp8,vp9,av1",
                AudioCodec: "aac,mp3,ac3,eac3,ac4,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis",
                Protocol: "",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: true,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "ts",
                Type: 'Video',
                VideoCodec: "h264,hevc,av1",
                AudioCodec: "aac,mp3,ac3,eac3,ac4,opus",
                Protocol: "hls",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 1,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "webm",
                Type: 'Video',
                VideoCodec: "vpx",
                AudioCodec: "vorbis",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Streaming',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: "6",
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }, {
                Container: "mp4",
                Type: 'Video',
                VideoCodec: "h264,hevc,av1",
                AudioCodec: "aac,mp3,ac3,eac3,ac4,mp2,pcm_s16le,pcm_s24le,aac_latm,opus,flac,vorbis",
                Protocol: "http",
                EstimateContentLength: false,
                EnableMpegtsM2TsMode: false,
                TranscodeSeekInfo: 'Auto',
                CopyTimestamps: false,
                Context: 'Static',
                EnableSubtitlesInManifest: false,
                MaxAudioChannels: null,
                MinSegments: 0,
                SegmentLength: 0,
                BreakOnNonKeyFrames: false
            }]
        };

        return Promise.resolve(profile);
    }

    play(options) {
        var self = this;

        return self.createMediaElement(options)
            .then(function (elem) {
                self._videoElement = elem;
                return self.setCurrentSrc(elem, options);
            })
            .then(function () {
                if (options.fullscreen) {
                    appRouter.showVideoOsd().then(function () {
                        self._videoElement.classList.remove('avplayVideoPlayerOnTop');
                    });
                } else {
                    setBackdropTransparency(TRANSPARENCY_LEVEL.Backdrop);
                    self._videoElement.classList.remove('avplayVideoPlayerOnTop');
                }

                if (options.playerStartPositionTicks) {
                    return self.currentTime(options.playerStartPositionTicks / 10000);
                }

                return Promise.resolve();
            })
            .then(function () {
                console.debug('play 1', webapis.avplay.getState());
                webapis.avplay.play();
                console.debug('play 2', webapis.avplay.getState());

                if (!self._videoSubtitlesElem) {
                    let subtitlesContainer = document.querySelector('.avplaySubtitles');
                    if (!subtitlesContainer) {
                        subtitlesContainer = document.createElement('div');
                        subtitlesContainer.classList.add('avplaySubtitles');
                    }
                    const subtitlesElement = document.createElement('div');
                    subtitlesElement.classList.add('avplaySubtitlesInner');
                    subtitlesContainer.appendChild(subtitlesElement);
                    self._videoSubtitlesElem = subtitlesElement;
                    self._videoElement.parentNode.appendChild(subtitlesContainer);
                    subtitleAppearanceHelper.applyStyles({
                            text: self._videoSubtitlesElem,
                            window: subtitlesContainer
                        }, userSettings.getSubtitleAppearanceSettings());
                }

                var audioIndex = options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;
                if (audioIndex) {
                    self.setAudioStreamIndex(audioIndex);
                }

                var subtitleIndex = options.mediaSource.DefaultSubtitleStreamIndex;
                if (subtitleIndex != null && subtitleIndex >= 0) {
                    var initialSubtitleStream = options.mediaSource.MediaStreams[subtitleIndex];
                    if (initialSubtitleStream && initialSubtitleStream.DeliveryMethod !== 'Encode') {
                        self.setSubtitleStreamIndex(subtitleIndex);
                    }
                }

                loading.hide();

                Events.trigger(self, 'playing');
            });
    }

    stop(destroyPlayer) {
        var elem = document.querySelector('.avplayVideoPlayer');

        if (elem) {
            console.debug('stop 1', webapis.avplay.getState());
            /*
            webapis.avplay.pause();
            console.debug('stop 2', webapis.avplay.getState());
            */

            this.onEnded();

            webapis.avplay.stop();
            console.debug('stop 3', webapis.avplay.getState());
            webapis.avplay.close();
            console.debug('stop 4', webapis.avplay.getState());

            if (destroyPlayer) {
                this.destroy();
            }
        }

        this._currentPlayOptions = {};

        return Promise.resolve();
    }

    destroy() {
        setBackdropTransparency(TRANSPARENCY_LEVEL.None);
        document.body.classList.remove('hide-scroll');

        var elem = document.querySelector('.avplayVideoPlayer');

        if (elem) {
            console.debug('destroy 1', webapis.avplay.getState());
            webapis.avplay.close();
            console.debug('destroy 2', webapis.avplay.getState());
            elem.parentNode.removeChild(elem);
        }

        this._videoElement = null;

        if (this._videoSubtitlesElem) {
            this._videoSubtitlesElem.parentNode.removeChild(this._videoSubtitlesElem);
            this._videoSubtitlesElem = null;
        }
    }

    volume(val) {
        // Volume is controlled physically
        return 1.0;
    }

    isMuted() {
        // Volume is controlled physically
        return false;
    }

    currentSrc() {
        return this._currentPlayOptions.url;
    }

    currentTime(val) {
        if (val != null) {
            return new Promise(function (resolve, reject) {
                var successCallback = function () {
                    console.debug('Media seek successful');
                    resolve();
                };

                var errorCallback = function () {
                    console.debug('Media seek failed');
                    reject();
                };

                console.debug('seekTo', webapis.avplay.getState());
                webapis.avplay.seekTo(val, successCallback, errorCallback);
            });
        }

        return webapis.avplay.getCurrentTime();
    }

    duration() {
        return webapis.avplay.getDuration();
    }

    seekable() {
        return this._videoElement && webapis.avplay.getDuration() > 0;
    }

    paused() {
        return webapis.avplay.getState() === 'PAUSED';
    }

    pause() {
        webapis.avplay.pause();
        Events.trigger(this, 'pause');
    }

    unpause() {
        webapis.avplay.play();
        Events.trigger(this, 'unpause');
    }

    createMediaElement(options) {
        var elem = document.querySelector('.avplayVideoPlayer');

        if (!elem) {
            elem = document.createElement('object');
            elem.type = 'application/avplayer';
            elem.classList.add('avplayVideoPlayer');
            elem.classList.toggle('avplayVideoPlayerOnTop', options.fullscreen);
            document.body.insertBefore(elem, document.body.children[0]);
        }

        if (options.fullscreen) {
            document.body.classList.add('hide-scroll');
        }

        return import('./style.scss').then(() => elem);
    }

    setCurrentSrc(elem, options) {
        var self = this;

        return new Promise(function (resolve, reject) {
            var listener = {
                onbufferingstart: function () {
                    console.debug("Buffering start.");
                },
 
                onbufferingprogress: function (percent) {
                    console.debug("Buffering progress data : " + percent);
                },

                onbufferingcomplete: function () {
                    console.debug("Buffering complete.");
                },
 
                onstreamcompleted: function () {
                    console.debug('onstreamcompleted');
                    self.onEnded();
                },

                oncurrentplaytime: function (currentTime)  {
                    Events.trigger(self, 'timeupdate');
                },

                onerror: function (eventType) {
                    console.debug("event type error : " + eventType);
                    reject(eventType);
                },

                onevent: function (eventType, eventData) {
                    console.debug("event type: " + eventType + ", data: " + eventData);
                },

                onsubtitlechange: function (duration, text, data3, data4) {
                    console.debug("subtitleText: " + text);
                    const e = self._videoSubtitlesElem;
                    if (e) {
                        if (text) {
                            e.innerHTML = DOMPurify.sanitize(normalizeSubtitleText(text));
                            e.classList.remove('hide');
                        } else {
                            e.classList.add('hide');
                        }
                    }
                },

                ondrmevent: function (drmEvent, drmData) {
                    console.debug("DRM callback: " + drmEvent + ", data: " + drmData);
                }
            };

            self._currentPlayOptions = options;

            console.debug('setCurrentSrc 1', webapis.avplay.getState());
            webapis.avplay.close();
            console.debug('setCurrentSrc 2', webapis.avplay.getState());
            webapis.avplay.open(options.url);
            console.debug('setCurrentSrc 3', webapis.avplay.getState());

            // HACK: Wait more - doesn't help
            webapis.avplay.setTimeoutForBuffering(60);

            webapis.avplay.setListener(listener);

            webapis.avplay.setDisplayRect(elem.offsetLeft, elem.offsetTop, elem.offsetWidth, elem.offsetHeight);

            webapis.avplay.prepareAsync(resolve, reject);
        });
    }

    canSetAudioStreamIndex() {
        return true;
    }

    setAudioStreamIndex(streamIndex) {
        console.debug('setting new audio track index to: ' + streamIndex);

        var audioIndex = -1;

        if (streamIndex !== -1) {
            var audioTracks = getMediaStreamAudioTracks(this._currentPlayOptions.mediaSource);

            console.debug('AudioTracks:', audioTracks);

            for (var i = 0; i < audioTracks.length; i++) {
                var track = audioTracks[i];

                if (track.Index === streamIndex) {
                    audioIndex = i;
                    break;
                }
            }
        }

        if (audioIndex === -1) {
            return;
        }

        var audioTracks = webapis.avplay.getTotalTrackInfo().filter(function (t) {
            return t.type === 'AUDIO';
        });

        console.debug('AudioTracks:', audioTracks);

        if (audioIndex < audioTracks.length) {
            var track = audioTracks[audioIndex];

            webapis.avplay.setSelectTrack('AUDIO', track.index);
        } else {
            console.error('[setAudioStreamIndex] Out of bound');
        }
    }

    setSubtitleStreamIndex(streamIndex) {
        var self = this;

        console.debug('setting new text track index to: ' + streamIndex);

        var textIndex = -1;
        var track = null;

        if (streamIndex !== -1) {
            var textTracks = getMediaStreamTextTracks(this._currentPlayOptions.mediaSource);

            console.debug('TextTracks:', textTracks);
            console.debug(webapis.avplay.getTotalTrackInfo());

            for (var i = 0; i < textTracks.length; i++) {
                var t = textTracks[i];

                if (t.Index === streamIndex) {
                    textIndex = i;
                    track = t;
                    break;
                }
            }
        }

        if (track) {
            if (track.DeliveryMethod === 'External') {
                var downloadRequest = new tizen.DownloadRequest(window.ApiClient.getUrl(track.DeliveryUrl), 'wgt-private-tmp');

                tizen.download.start(downloadRequest, {
                    oncompleted: function (downloadId, fullPath) {
                        console.log('absolute path of downloaded file: ' + fullPath);

                        webapis.avplay.setExternalSubtitlePath(fullPath);
                        console.debug(webapis.avplay.getTotalTrackInfo());

                        webapis.avplay.setSubtitlePosition(self._currentTrackOffset);
                    },
                    onfailed: function (error) {
                        console.log('Failed to download Subtitle', error);
                    }
                });
            } else if (track.DeliveryMethod === 'Embed') {
                var textTracks = webapis.avplay.getTotalTrackInfo().filter(function (t) {
                    return t.type === 'TEXT';
                });

                console.debug('TextTracks:', textTracks);

                if (textIndex < textTracks.length) {
                    webapis.avplay.setSelectTrack('TEXT', textTracks[textIndex].index);
                } else {
                    console.error('[setSubtitleStreamIndex] Out of bound');
                }
            }
        } else {
            webapis.avplay.setSilentSubtitle(true);
        }
    }

    setSubtitleOffset(offset) {
        var offsetValue = parseFloat(offset) * 1000;
        // FIXME: Cannot be called if no subtitles
        //webapis.avplay.setSubtitlePosition(offsetValue);
    }

    resetSubtitleOffset() {
        this._currentTrackOffset = 0;
        this._showTrackOffset = false;
    }

    enableShowingSubtitleOffset() {
        this._showTrackOffset = true;
    }

    disableShowingSubtitleOffset() {
        this._showTrackOffset = false;
    }

    isShowingSubtitleOffsetEnabled() {
        return this._showTrackOffset;
    }

    onEnded() {
        var stopInfo = {
            src: this.currentSrc()
        };

        Events.trigger(this, 'stopped', [stopInfo]);
    }

    getStats() {
        const categories = [];

        for (const stream of webapis.avplay.getCurrentStreamInfo()) {
            if (stream.type === 'VIDEO' && stream.extra_info) {
                const extraInfo = JSON.parse(stream.extra_info);
                categories.push({
                    type: 'video',
                    stats: [{
                        label: globalize.translate('LabelPlayerViews'),
                        value: `${extraInfo.Width}x${extraInfo.Height}`
                    }]
                });
                break;
            }
        }

        return Promise.resolve({
            categories
        });
    }
};

export default AvplayVideoPlayer;
