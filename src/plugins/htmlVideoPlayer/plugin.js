import DOMPurify from 'dompurify';
import { debounce } from '../../utils/lodashUtils';
import Screenfull from 'screenfull';

import { useCustomSubtitles } from 'apps/stable/features/playback/utils/subtitleStyles';
import subtitleAppearanceHelper from 'components/subtitlesettings/subtitleappearancehelper';
import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import { MediaError } from 'types/mediaError';

import browser from '../../scripts/browser';
import appSettings from '../../scripts/settings/appSettings';
import { appHost, safeAppHost } from '../../components/apphost';
import loading from '../../components/loading/loading';
import dom from '../../utils/dom';
import { playbackManager } from '../../components/playback/playbackmanager';
import { appRouter } from '../../components/router/appRouter';
import {
    bindEventsToHlsPlayer,
    destroyHlsPlayer,
    destroyFlvPlayer,
    destroyCastPlayer,
    getCrossOriginValue,
    enableHlsJsPlayerForCodecs,
    applySrc,
    resetSrc,
    playWithPromise,
    onEndedInternal,
    saveVolume,
    seekOnPlaybackStart,
    onErrorInternal,
    handleHlsJsMediaError,
    getSavedVolume,
    isValidDuration,
    getBufferedRanges
} from '../../components/htmlMediaHelper';
import itemHelper from '../../components/itemHelper';
import globalize from '../../lib/globalize';
import profileBuilder, { canPlaySecondaryAudio } from '../../scripts/browserDeviceProfile';
import { getIncludeCorsCredentials } from '../../scripts/settings/webSettings';
import { setBackdropTransparency, TRANSPARENCY_LEVEL } from '../../components/backdrop/backdrop';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { includesAny } from '../../utils/container';
import { isHls } from '../../utils/mediaSource';

/**
 * Returns resolved URL.
 * @param {string} url - URL.
 * @returns {string} Resolved URL or `url` if resolving failed.
 */
function resolveUrl(url) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.onload = function () {
            resolve(xhr.responseURL || url);
        };
        xhr.onerror = function (e) {
            console.error(e);
            resolve(url);
        };
        xhr.send(null);
    });
}

function tryRemoveElement(elem) {
    const parentNode = elem.parentNode;
    if (parentNode) {
        // Seeing crashes in edge webview
        try {
            parentNode.removeChild(elem);
        } catch (err) {
            console.error(`error removing dialog element: ${err}`);
        }
    }
}

function enableNativeTrackSupport(mediaSource, track) {
    if (track?.DeliveryMethod === 'Embed') {
        return true;
    }

    if (browser.firefox && isHls(mediaSource)) {
        return false;
    }

    if (browser.ps4) {
        return false;
    }

    if (browser.web0s) {
        return false;
    }

    // Edge is randomly not rendering subtitles
    if (browser.edge) {
        return false;
    }

    if (browser.iOS && (browser.iosVersion || 10) < 10) {
        // works in the browser but not the native app
        return false;
    }

    if (track) {
        const format = (track.Codec || '').toLowerCase();
        if (format === 'ssa' || format === 'ass' || format === 'pgssub') {
            return false;
        }
    }

    return true;
}

function requireHlsPlayer(callback) {
    import('hls.js/dist/hls.js').then(({ default: hls }) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.liveBackBufferLength = 90;
        window.Hls = hls;
        callback();
    });
}

function getMediaStreamVideoTracks(mediaSource) {
    return mediaSource.MediaStreams.filter(function (s) {
        return s.Type === 'Video';
    });
}

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

function zoomIn(elem) {
    return new Promise(resolve => {
        const duration = 240;
        elem.style.animation = `htmlvideoplayer-zoomin ${duration}ms ease-in normal`;
        dom.addEventListener(elem, dom.whichAnimationEvent(), resolve, {
            once: true
        });
    });
}

function normalizeTrackEventText(text, useHtml) {
    const result = text
        .replace(/\\N/gi, '\n') // Correct newline characters
        .replace(/\r/gi, '') // Remove carriage return characters
        .replace(/{\\.*?}/gi, '') // Remove ass/ssa tags
        // Force LTR as the default direction
        .split('\n').map(val => `\u200E${val}`).join('\n');
    return useHtml ? result.replace(/\n/gi, '<br>') : result;
}

function getTextTrackUrl(track, item, format) {
    if (itemHelper.isLocalItem(item) && track.Path) {
        return track.Path;
    }

    let url = playbackManager.getSubtitleUrl(track, item.ServerId);
    if (format) {
        url = url.replace('.vtt', format);
    }

    return url;
}

function getDefaultProfile() {
    return profileBuilder({});
}

const PRIMARY_TEXT_TRACK_INDEX = 0;
const SECONDARY_TEXT_TRACK_INDEX = 1;

export class HtmlVideoPlayer {
    /**
     * @type {string}
     */
    name;
    /**
     * @type {string}
     */
    type = PluginType.MediaPlayer;
    /**
     * @type {string}
     */
    id = 'htmlvideoplayer';
    /**
     * Let any players created by plugins take priority
     *
     * @type {number}
     */
    priority = 1;
    /**
     * @type {boolean}
     */
    isFetching = false;
    /**
     * @type {HTMLDivElement | null | undefined}
     */
    #videoDialog;
    /**
     * @type {number | undefined}
     */
    #subtitleTrackIndexToSetOnPlaying;
    /**
     * @type {number | undefined}
     */
    #secondarySubtitleTrackIndexToSetOnPlaying;
    /**
     * @type {number | null}
     */
    #audioTrackIndexToSetOnPlaying;
    /**
     * @type {any | null | undefined}
     */
    #currentAssRenderer;
    /**
     * @type {any | null | undefined}
     */
    #currentPgsRenderer;
    /**
     * @type {number | undefined}
     */
    #customTrackIndex;
    /**
     * @type {number | undefined}
     */
    #customSecondaryTrackIndex;
    /**
     * @type {boolean | undefined}
     */
    #showTrackOffset;
    /**
     * @type {number | undefined}
     */
    #currentTrackOffset;
    /**
     * @type {HTMLElement | null | undefined}
     */
    #secondaryTrackOffset;
    /**
     * @type {HTMLElement | null | undefined}
     */
    #videoSubtitlesElem;
    /**
     * @type {HTMLElement | null | undefined}
     */
    #videoSecondarySubtitlesElem;
    /**
     * @type {any | null | undefined}
     */
    #currentTrackEvents;
    /**
     * @type {any | null | undefined}
     */
    #currentSecondaryTrackEvents;
    /**
     * @type {string[] | undefined}
     */
    #supportedFeatures;
    /**
     * @type {HTMLVideoElement | null | undefined}
     */
    #mediaElement;
    /**
     * @type {number}
     */
    #fetchQueue = 0;
    /**
     * @type {string | undefined}
     */
    #currentSrc;
    /**
     * @type {boolean | undefined}
     */
    #started;
    /**
     * @type {boolean | undefined}
     */
    #timeUpdated;
    /**
     * @type {number | null | undefined}
     */
    #currentTime;

    /**
     * @private (used in other files)
     * @type {any | undefined}
     */
    _flvPlayer;

    /**
     * @private (used in other files)
     * @type {any | undefined}
     */
    _hlsPlayer;
    /**
     * @private (used in other files)
     * @type {any | null | undefined}
     */
    _castPlayer;
    /**
     * @private (used in other files)
     * @type {any | undefined}
     */
    _currentPlayOptions;
    /**
     * @type {any | undefined}
     */
    #lastProfile;

    constructor() {
        if (browser.edgeUwp) {
            this.name = 'Windows Video Player';
        } else {
            this.name = 'Html Video Player';
        }
    }

    currentSrc() {
        return this.#currentSrc;
    }

    /**
     * @private
     */
    incrementFetchQueue() {
        if (this.#fetchQueue <= 0) {
            this.isFetching = true;
            Events.trigger(this, 'beginFetch');
        }

        this.#fetchQueue++;
    }

    /**
     * @private
     */
    decrementFetchQueue() {
        this.#fetchQueue--;

        if (this.#fetchQueue <= 0) {
            this.isFetching = false;
            Events.trigger(this, 'endFetch');
        }
    }

    /**
     * @private
     */
    updateVideoUrl(streamInfo) {
        const mediaSource = streamInfo.mediaSource;
        const item = streamInfo.item;

        // Huge hack alert. Safari doesn't seem to like if the segments aren't available right away when playback starts
        // This will start the transcoding process before actually feeding the video url into the player
        // Edit: Also seeing stalls from hls.js
        if (mediaSource && item && !mediaSource.RunTimeTicks && isHls(mediaSource) && streamInfo.playMethod === 'Transcode' && (browser.iOS || browser.osx)) {
            const hlsPlaylistUrl = streamInfo.url.replace('master.m3u8', 'live.m3u8');

            loading.show();

            console.debug(`prefetching hls playlist: ${hlsPlaylistUrl}`);

            return ServerConnections.getApiClient(item.ServerId).ajax({

                type: 'GET',
                url: hlsPlaylistUrl

            }).then(function () {
                console.debug(`completed prefetching hls playlist: ${hlsPlaylistUrl}`);

                loading.hide();
                streamInfo.url = hlsPlaylistUrl;
            }, function () {
                console.error(`error prefetching hls playlist: ${hlsPlaylistUrl}`);

                loading.hide();
            });
        } else {
            return Promise.resolve();
        }
    }

    async play(options) {
        this.#started = false;
        this.#timeUpdated = false;

        this.#currentTime = null;

        if (options.resetSubtitleOffset !== false) this.resetSubtitleOffset();

        const elem = await this.createMediaElement(options);
        this.#applyAspectRatio(options.aspectRatio || this.getAspectRatio());

        await this.updateVideoUrl(options);
        return this.setCurrentSrc(elem, options);
    }

    /**
     * @private
     */
    setSrcWithFlvJs(elem, options, url) {
        return import('flv.js').then(({ default: flvjs }) => {
            const flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: url
            },
            {
                seekType: 'range',
                lazyLoad: false
            });

            flvPlayer.attachMediaElement(elem);
            flvPlayer.load();

            this._flvPlayer = flvPlayer;

            // This is needed in setCurrentTrackElement
            this.#currentSrc = url;

            return flvPlayer.play();
        });
    }

    /**
     * @private
     */
    setSrcWithHlsJs(elem, options, url) {
        return new Promise((resolve, reject) => {
            requireHlsPlayer(async () => {
                let maxBufferLength = 30;

                // Some browsers cannot handle huge fragments in high bitrate.
                // This issue usually happens when using HWA encoders with a high bitrate setting.
                // Limit the BufferLength to 6s, it works fine when playing 4k 120Mbps over HLS on chrome.
                // https://github.com/video-dev/hls.js/issues/876
                if ((browser.chrome || browser.edgeChromium || browser.firefox) && playbackManager.getMaxStreamingBitrate(this) >= 25000000) {
                    maxBufferLength = 6;
                }

                const includeCorsCredentials = await getIncludeCorsCredentials();

                const hls = new Hls({
                    startPosition: options.playerStartPositionTicks / 10000000,
                    manifestLoadingTimeOut: 20000,
                    maxBufferLength: maxBufferLength,
                    maxMaxBufferLength: maxBufferLength,
                    videoPreference: { preferHDR: true },
                    xhrSetup(xhr) {
                        xhr.withCredentials = includeCorsCredentials;
                    }
                });
                hls.loadSource(url);
                hls.attachMedia(elem);

                bindEventsToHlsPlayer(this, hls, elem, this.onError, resolve, reject);

                this._hlsPlayer = hls;

                // This is needed in setCurrentTrackElement
                this.#currentSrc = url;
            });
        });
    }

    /**
     * @private
     */
    async setCurrentSrc(elem, options) {
        elem.removeEventListener('error', this.onError);

        let val = options.url;
        console.debug(`playing url: ${val}`);

        // Convert to seconds
        const seconds = (options.playerStartPositionTicks || 0) / 10000000;
        if (seconds) {
            val += `#t=${seconds}`;
        }

        destroyHlsPlayer(this);
        destroyFlvPlayer(this);
        destroyCastPlayer(this);

        let secondaryTrackValid = true;

        this.#subtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSubtitleStreamIndex == null ? -1 : options.mediaSource.DefaultSubtitleStreamIndex;
        if (this.#subtitleTrackIndexToSetOnPlaying != null && this.#subtitleTrackIndexToSetOnPlaying >= 0) {
            const initialSubtitleStream = options.mediaSource.MediaStreams[this.#subtitleTrackIndexToSetOnPlaying];
            if (!initialSubtitleStream || initialSubtitleStream.DeliveryMethod === 'Encode') {
                this.#subtitleTrackIndexToSetOnPlaying = -1;
                secondaryTrackValid = false;
            }
            // secondary track should not be shown if primary track is no longer a valid pair
            if (initialSubtitleStream && !playbackManager.trackHasSecondarySubtitleSupport(initialSubtitleStream, this)) {
                secondaryTrackValid = false;
            }
        } else {
            secondaryTrackValid = false;
        }

        this.#audioTrackIndexToSetOnPlaying = options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;

        this._currentPlayOptions = options;

        if (secondaryTrackValid) {
            this.#secondarySubtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSecondarySubtitleStreamIndex == null ? -1 : options.mediaSource.DefaultSecondarySubtitleStreamIndex;
            if (this.#secondarySubtitleTrackIndexToSetOnPlaying != null && this.#secondarySubtitleTrackIndexToSetOnPlaying >= 0) {
                const initialSecondarySubtitleStream = options.mediaSource.MediaStreams[this.#secondarySubtitleTrackIndexToSetOnPlaying];
                if (!initialSecondarySubtitleStream || !playbackManager.trackHasSecondarySubtitleSupport(initialSecondarySubtitleStream, this)) {
                    this.#secondarySubtitleTrackIndexToSetOnPlaying = -1;
                }
            }
        } else {
            this.#secondarySubtitleTrackIndexToSetOnPlaying = -1;
        }

        const crossOrigin = getCrossOriginValue(options.mediaSource);
        if (crossOrigin) {
            elem.crossOrigin = crossOrigin;
        }

        if (enableHlsJsPlayerForCodecs(options.mediaSource, 'Video') && isHls(options.mediaSource)) {
            return this.setSrcWithHlsJs(elem, options, val);
        } else if (options.playMethod !== 'Transcode' && options.mediaSource.Container?.toUpperCase() === 'FLV') {
            return this.setSrcWithFlvJs(elem, options, val);
        } else {
            elem.autoplay = true;

            const includeCorsCredentials = await getIncludeCorsCredentials();
            if (includeCorsCredentials) {
                // Safari will not send cookies without this
                elem.crossOrigin = 'use-credentials';
            }

            return applySrc(elem, val, options).then(() => {
                this.#currentSrc = val;

                return playWithPromise(elem, this.onError);
            });
        }
    }

    setSubtitleStreamIndex(index) {
        this.setCurrentTrackElement(index);
    }

    setSecondarySubtitleStreamIndex(index) {
        this.setCurrentTrackElement(index, SECONDARY_TEXT_TRACK_INDEX);
    }

    resetSubtitleOffset() {
        this.#currentTrackOffset = 0;
        this.#secondaryTrackOffset = 0;
        this.#showTrackOffset = false;
    }

    enableShowingSubtitleOffset() {
        this.#showTrackOffset = true;
    }

    disableShowingSubtitleOffset() {
        this.#showTrackOffset = false;
    }

    isShowingSubtitleOffsetEnabled() {
        return this.#showTrackOffset;
    }

    /**
     * @private
     */
    getTextTracks() {
        const videoElement = this.#mediaElement;
        if (videoElement) {
            return Array.from(videoElement.textTracks)
                .filter(function (trackElement) {
                    // get showing .vtt textTack
                    return trackElement.mode === 'showing';
                });
        } else {
            return null;
        }
    }

    setSubtitleOffset = debounce(this._setSubtitleOffset, 100);

    /**
     * @private
     */
    _setSubtitleOffset(offset) {
        const offsetValue = parseFloat(offset);

        // if .ass currently rendering
        if (this.#currentAssRenderer) {
            this.updateCurrentTrackOffset(offsetValue);
            this.#currentAssRenderer.timeOffset = (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + offsetValue;
        } else if (this.#currentPgsRenderer) {
            this.updateCurrentTrackOffset(offsetValue);
            this.#currentPgsRenderer.timeOffset = (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + offsetValue;
        } else {
            const trackElements = this.getTextTracks();
            // if .vtt currently rendering
            if (trackElements?.length > 0) {
                trackElements.forEach((trackElement, index) => {
                    this.setTextTrackSubtitleOffset(trackElement, offsetValue, index);
                });
            } else if (this.#currentTrackEvents || this.#currentSecondaryTrackEvents) {
                this.#currentTrackEvents && this.setTrackEventsSubtitleOffset(this.#currentTrackEvents, offsetValue, PRIMARY_TEXT_TRACK_INDEX);
                this.#currentSecondaryTrackEvents && this.setTrackEventsSubtitleOffset(this.#currentSecondaryTrackEvents, offsetValue, SECONDARY_TEXT_TRACK_INDEX);
            } else {
                console.debug('No available track, cannot apply offset: ', offsetValue);
            }
        }
    }

    /**
     * @private
     */
    updateCurrentTrackOffset(offsetValue, currentTrackIndex = PRIMARY_TEXT_TRACK_INDEX) {
        let offsetToCompare = this.#currentTrackOffset;
        if (this.isSecondaryTrack(currentTrackIndex)) {
            offsetToCompare = this.#secondaryTrackOffset;
        }

        let relativeOffset = offsetValue;
        const newTrackOffset = offsetValue;

        if (offsetToCompare) {
            relativeOffset -= offsetToCompare;
        }

        if (this.isSecondaryTrack(currentTrackIndex)) {
            this.#secondaryTrackOffset = newTrackOffset;
        } else {
            this.#currentTrackOffset = newTrackOffset;
        }

        // relative to currentTrackOffset
        return relativeOffset;
    }

    /**
     * @private
     * These browsers will not clear the existing active cue when setting an offset
     * for native TextTracks.
     * Any previous text tracks that are on the screen when the offset changes will remain next
     * to the new tracks until they reach the end time of the new offset's instance of the track.
     */
    requiresHidingActiveCuesOnOffsetChange() {
        return !!browser.firefox;
    }

    /**
     * @private
     */
    hideTextTrackWithActiveCues(currentTrack) {
        if (currentTrack.activeCues) {
            currentTrack.mode = 'hidden';
        }
    }

    /**
     * Forces the active cue to clear by disabling then re-enabling the track.
     * The track mode is reverted inside of a 0ms timeout to free up the track
     * and allow it to disable and clear the active cue.
     * @private
     */
    forceClearTextTrackActiveCues(currentTrack) {
        if (currentTrack.activeCues) {
            currentTrack.mode = 'disabled';
            setTimeout(() => {
                currentTrack.mode = 'showing';
            }, 0);
        }
    }

    /**
     * @private
     */
    setTextTrackSubtitleOffset(currentTrack, offsetValue, currentTrackIndex) {
        if (currentTrack.cues) {
            offsetValue = this.updateCurrentTrackOffset(offsetValue, currentTrackIndex);
            if (offsetValue === 0) {
                return;
            }

            const shouldClearActiveCues = this.requiresHidingActiveCuesOnOffsetChange();
            if (shouldClearActiveCues) {
                this.hideTextTrackWithActiveCues(currentTrack);
            }

            Array.from(currentTrack.cues)
                .forEach(function (cue) {
                    cue.startTime -= offsetValue;
                    cue.endTime -= offsetValue;
                });

            if (shouldClearActiveCues) {
                this.forceClearTextTrackActiveCues(currentTrack);
            }
        }
    }

    /**
     * @private
     */
    setTrackEventsSubtitleOffset(trackEvents, offsetValue, currentTrackIndex) {
        if (Array.isArray(trackEvents)) {
            offsetValue = this.updateCurrentTrackOffset(offsetValue, currentTrackIndex) * 1e7; // ticks
            if (offsetValue === 0) {
                return;
            }
            trackEvents.forEach(function (trackEvent) {
                trackEvent.StartPositionTicks -= offsetValue;
                trackEvent.EndPositionTicks -= offsetValue;
            });
        }
    }

    getSubtitleOffset() {
        return this.#currentTrackOffset;
    }

    isPrimaryTrack(textTrackIndex) {
        return textTrackIndex === PRIMARY_TEXT_TRACK_INDEX;
    }

    isSecondaryTrack(textTrackIndex) {
        return textTrackIndex === SECONDARY_TEXT_TRACK_INDEX;
    }

    /**
     * @private
     */
    isAudioStreamSupported(stream, deviceProfile, container) {
        const codec = (stream.Codec || '').toLowerCase();

        if (!codec) {
            return true;
        }

        if (!deviceProfile) {
            // This should never happen
            return true;
        }

        const profiles = deviceProfile.DirectPlayProfiles || [];

        return profiles.some(function (p) {
            return p.Type === 'Video'
                    && includesAny((p.Container || '').toLowerCase(), container)
                    && includesAny((p.AudioCodec || '').toLowerCase(), codec);
        });
    }

    /**
     * @private
     */
    getSupportedAudioStreams() {
        const profile = this.#lastProfile;

        const mediaSource = this._currentPlayOptions.mediaSource;
        const container = mediaSource.Container.toLowerCase();

        return getMediaStreamAudioTracks(mediaSource).filter((stream) => {
            return this.isAudioStreamSupported(stream, profile, container);
        });
    }

    setAudioStreamIndex(index) {
        const streams = this.getSupportedAudioStreams();

        if (streams.length < 2) {
            // If there's only one supported stream then trust that the player will handle it on it's own
            return;
        }

        let audioIndex = -1;

        for (const stream of streams) {
            audioIndex++;

            if (stream.Index === index) {
                break;
            }
        }

        if (audioIndex === -1) {
            return;
        }

        const elem = this.#mediaElement;
        if (!elem) {
            return;
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/audioTracks

        /**
         * @type {ArrayLike<any>|any[]}
         */
        const elemAudioTracks = elem.audioTracks || [];
        console.debug(`found ${elemAudioTracks.length} audio tracks`);

        for (const [i, audioTrack] of Array.from(elemAudioTracks).entries()) {
            if (audioIndex === i) {
                console.debug(`setting audio track ${i} to enabled`);
                audioTrack.enabled = true;
            } else {
                console.debug(`setting audio track ${i} to disabled`);
                audioTrack.enabled = false;
            }
        }
    }

    stop(destroyPlayer) {
        const elem = this.#mediaElement;
        const src = this.#currentSrc;

        if (elem) {
            if (src) {
                elem.pause();
            }

            onEndedInternal(this, elem, this.onError);
        }

        this.destroyCustomTrack(elem);

        if (destroyPlayer) {
            this.destroy();
        }

        return Promise.resolve();
    }

    destroy() {
        this.setSubtitleOffset.cancel();

        destroyHlsPlayer(this);
        destroyFlvPlayer(this);

        setBackdropTransparency(TRANSPARENCY_LEVEL.None);
        document.body.classList.remove('hide-scroll');

        const videoElement = this.#mediaElement;

        if (videoElement) {
            this.#mediaElement = null;

            this.destroyCustomTrack(videoElement);
            videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
            videoElement.removeEventListener('ended', this.onEnded);
            videoElement.removeEventListener('volumechange', this.onVolumeChange);
            videoElement.removeEventListener('pause', this.onPause);
            videoElement.removeEventListener('playing', this.onPlaying);
            videoElement.removeEventListener('play', this.onPlay);
            videoElement.removeEventListener('click', this.onClick);
            videoElement.removeEventListener('dblclick', this.onDblClick);
            videoElement.removeEventListener('waiting', this.onWaiting);
            videoElement.removeEventListener('error', this.onError); // bound in htmlMediaHelper

            resetSrc(videoElement);

            videoElement.parentNode.removeChild(videoElement);
        }

        const dlg = this.#videoDialog;
        if (dlg) {
            this.#videoDialog = null;
            dlg.parentNode.removeChild(dlg);
        }

        if (Screenfull.isEnabled) {
            Screenfull.exit();
        } else if (document.webkitIsFullScreen && document.webkitCancelFullscreen) {
            // iOS Safari
            document.webkitCancelFullscreen();
        }
    }

    /**
     * @private
     * @param e {Event} The event received from the `<video>` element
     */
    onEnded = (e) => {
        /**
         * @type {HTMLMediaElement}
         */
        const elem = e.target;
        this.destroyCustomTrack(elem);
        onEndedInternal(this, elem, this.onError);
    };

    /**
     * @private
     * @param e {Event} The event received from the `<video>` element
     */
    onTimeUpdate = (e) => {
        /**
         * @type {HTMLMediaElement}
         */
        const elem = e.target;
        // get the player position and the transcoding offset
        const time = elem.currentTime;

        if (time && !this.#timeUpdated) {
            this.#timeUpdated = true;
            this.ensureValidVideo(elem);
        }

        this.#currentTime = time;

        const currentPlayOptions = this._currentPlayOptions;
        // Not sure yet how this is coming up null since we never null it out, but it is causing app crashes
        if (currentPlayOptions) {
            let timeMs = time * 1000;
            timeMs += ((currentPlayOptions.transcodingOffsetTicks || 0) / 10000);
            this.updateSubtitleText(timeMs);
        }

        Events.trigger(this, 'timeupdate');
    };

    /**
     * @private
     * @param e {Event} The event received from the `<video>` element
     */
    onVolumeChange = (e) => {
        /**
         * @type {HTMLMediaElement}
         */
        const elem = e.target;
        saveVolume(elem.volume);
        Events.trigger(this, 'volumechange');
    };

    /**
     * @private
     */
    onNavigatedToOsd = () => {
        const dlg = this.#videoDialog;
        if (dlg) {
            dlg.classList.remove('videoPlayerContainer-onTop');

            this.onStartedAndNavigatedToOsd();
        }
    };

    /**
     * @private
     */
    onStartedAndNavigatedToOsd() {
        // If this causes a failure during navigation we end up in an awkward UI state
        this.setCurrentTrackElement(this.#subtitleTrackIndexToSetOnPlaying);

        if (this.#audioTrackIndexToSetOnPlaying != null && this.canSetAudioStreamIndex()) {
            this.setAudioStreamIndex(this.#audioTrackIndexToSetOnPlaying);
        }

        if (this.#secondarySubtitleTrackIndexToSetOnPlaying != null && this.#secondarySubtitleTrackIndexToSetOnPlaying >= 0) {
            /**
             * Using a 0ms timeout to set the secondary subtitles because of some weird race condition when
             * setting both primary and secondary tracks at the same time.
             * The `TextTrack` content and cues will somehow get mixed up and each track will play a mix of both languages.
             * Putting this in a timeout fixes it completely.
             */
            setTimeout(() => this.setSecondarySubtitleStreamIndex(this.#secondarySubtitleTrackIndexToSetOnPlaying), 0);
        }
    }

    /**
     * @private
     * @param e {Event} The event received from the `<video>` element
     */
    onPlaying = (e) => {
        /**
         * @type {HTMLMediaElement}
         */
        const elem = e.target;
        if (!this.#started) {
            this.#started = true;
            elem.removeAttribute('controls');

            loading.hide();

            seekOnPlaybackStart(this, e.target, this._currentPlayOptions.playerStartPositionTicks, () => {
                if (this.#currentAssRenderer) {
                    this.#currentAssRenderer.timeOffset = (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + this.#currentTrackOffset;
                    this.#currentAssRenderer.resize();
                    this.#currentAssRenderer.resetRenderAheadCache(false);
                }
            });

            if (this._currentPlayOptions.fullscreen) {
                appRouter.showVideoOsd().then(this.onNavigatedToOsd);
            } else {
                setBackdropTransparency(TRANSPARENCY_LEVEL.Backdrop);
                this.#videoDialog.classList.remove('videoPlayerContainer-onTop');

                this.onStartedAndNavigatedToOsd();
            }
        }
        Events.trigger(this, 'playing');
    };

    /**
     * @private
     */
    onPlay = () => {
        Events.trigger(this, 'unpause');
    };

    /**
     * @private
     */
    ensureValidVideo(elem) {
        if (elem !== this.#mediaElement) {
            return;
        }

        if (elem.videoWidth === 0 && elem.videoHeight === 0) {
            const mediaSource = this._currentPlayOptions?.mediaSource;

            // Only trigger this if there is media info
            // Avoid triggering in situations where it might not actually have a video stream (audio only live tv channel)
            if (!mediaSource || mediaSource.RunTimeTicks) {
                onErrorInternal(this, MediaError.NO_MEDIA_ERROR);
            }
        }
    }

    /**
     * @private
     */
    onClick = () => {
        Events.trigger(this, 'click');
    };

    /**
     * @private
     */
    onDblClick = () => {
        Events.trigger(this, 'dblclick');
    };

    /**
     * @private
     */
    onPause = () => {
        Events.trigger(this, 'pause');
    };

    onWaiting = () => {
        Events.trigger(this, 'waiting');
    };

    /**
     * @private
     * @param e {Event} The event received from the `<video>` element
     */
    onError = (e) => {
        /**
         * @type {HTMLMediaElement}
         */
        const elem = e.target;
        const errorCode = elem.error ? (elem.error.code || 0) : 0;
        const errorMessage = elem.error ? (elem.error.message || '') : '';
        console.error(`media element error: ${errorCode} ${errorMessage}`);

        let type;

        switch (errorCode) {
            case 1:
                // MEDIA_ERR_ABORTED
                // This will trigger when changing media while something is playing
                return;
            case 2:
                // MEDIA_ERR_NETWORK
                type = MediaError.NETWORK_ERROR;
                break;
            case 3:
                // MEDIA_ERR_DECODE
                if (this._hlsPlayer) {
                    handleHlsJsMediaError(this);
                    return;
                } else {
                    type = MediaError.MEDIA_DECODE_ERROR;
                }
                break;
            case 4:
                // MEDIA_ERR_SRC_NOT_SUPPORTED
                type = MediaError.MEDIA_NOT_SUPPORTED;
                break;
            default:
                // seeing cases where Edge is firing error events with no error code
                // example is start playing something, then immediately change src to something else
                return;
        }

        onErrorInternal(this, type);
    };

    /**
     * @private
     */
    destroyCustomRenderedTrackElements(targetTrackIndex) {
        if (this.isPrimaryTrack(targetTrackIndex)) {
            if (this.#videoSubtitlesElem) {
                tryRemoveElement(this.#videoSubtitlesElem);
                this.#videoSubtitlesElem = null;
            }
        } else if (this.isSecondaryTrack(targetTrackIndex)) {
            if (this.#videoSecondarySubtitlesElem) {
                tryRemoveElement(this.#videoSecondarySubtitlesElem);
                this.#videoSecondarySubtitlesElem = null;
            }
        } else if (this.#videoSubtitlesElem) {
            // destroy all
            const subtitlesContainer = this.#videoSubtitlesElem.parentNode;
            if (subtitlesContainer) {
                tryRemoveElement(subtitlesContainer);
            }
            this.#videoSubtitlesElem = null;
            this.#videoSecondarySubtitlesElem = null;
        }
    }

    /**
     * @private
     */
    destroyNativeTracks(videoElement, targetTrackIndex) {
        if (videoElement) {
            const destroySingleTrack = typeof targetTrackIndex === 'number';
            const allTracks = videoElement.textTracks || []; // get list of tracks
            for (let index = 0; index < allTracks.length; index++) {
                const track = allTracks[index];
                // Skip all other tracks if we are targeting just one
                if (destroySingleTrack && targetTrackIndex !== index) {
                    continue;
                }
                if (track.label.includes('manualTrack')) {
                    track.mode = 'disabled';
                }
            }
        }
    }

    /**
     * @private
     */
    destroyStoredTrackInfo(targetTrackIndex) {
        if (this.isPrimaryTrack(targetTrackIndex)) {
            this.#customTrackIndex = -1;
            this.#currentTrackEvents = null;
        } else if (this.isSecondaryTrack(targetTrackIndex)) {
            this.#customSecondaryTrackIndex = -1;
            this.#currentSecondaryTrackEvents = null;
        } else { // destroy all
            this.#customTrackIndex = -1;
            this.#customSecondaryTrackIndex = -1;
            this.#currentTrackEvents = null;
            this.#currentSecondaryTrackEvents = null;
        }
    }

    /**
     * @private
     */
    destroyCustomTrack(videoElement, targetTrackIndex) {
        this.destroyCustomRenderedTrackElements(targetTrackIndex);
        this.destroyNativeTracks(videoElement, targetTrackIndex);
        this.destroyStoredTrackInfo(targetTrackIndex);

        const octopus = this.#currentAssRenderer;
        if (octopus) {
            octopus.dispose();
        }
        this.#currentAssRenderer = null;

        const pgsRenderer = this.#currentPgsRenderer;
        if (pgsRenderer) {
            pgsRenderer.dispose();
        }
        this.#currentPgsRenderer = null;
    }

    /**
     * @private
     */
    fetchSubtitlesUwp(track) {
        return Windows.Storage.StorageFile.getFileFromPathAsync(track.Path).then(function (storageFile) {
            return Windows.Storage.FileIO.readTextAsync(storageFile);
        }).then(function (text) {
            return JSON.parse(text);
        });
    }

    /**
     * @private
     */
    async fetchSubtitles(track, item) {
        if (window.Windows && itemHelper.isLocalItem(item)) {
            return this.fetchSubtitlesUwp(track, item);
        }

        this.incrementFetchQueue();
        try {
            const response = await fetch(getTextTrackUrl(track, item, '.js'));

            if (!response.ok) {
                throw new Error(response);
            }

            return response.json();
        } finally {
            this.decrementFetchQueue();
        }
    }

    /**
     * @private
     */
    setTrackForDisplay(videoElement, track, targetTextTrackIndex = PRIMARY_TEXT_TRACK_INDEX) {
        if (!track) {
            // Destroy all tracks by passing undefined if there is no valid primary track
            this.destroyCustomTrack(videoElement, this.isSecondaryTrack(targetTextTrackIndex) ? targetTextTrackIndex : undefined);
            return;
        }

        let targetTrackIndex = this.#customTrackIndex;
        if (this.isSecondaryTrack(targetTextTrackIndex)) {
            targetTrackIndex = this.#customSecondaryTrackIndex;
        }

        // skip if already playing this track
        if (targetTrackIndex === track.Index) {
            return;
        }

        this.resetSubtitleOffset();
        const item = this._currentPlayOptions.item;

        this.destroyCustomTrack(videoElement, targetTextTrackIndex);

        if (this.isSecondaryTrack(targetTextTrackIndex)) {
            this.#customSecondaryTrackIndex = track.Index;
        } else {
            this.#customTrackIndex = track.Index;
        }
        this.renderTracksEvents(videoElement, track, item, targetTextTrackIndex);
    }

    /**
     * @private
     */
    renderSsaAss(videoElement, track, item) {
        const supportedFonts = ['application/vnd.ms-opentype', 'application/x-truetype-font', 'font/otf', 'font/ttf', 'font/woff', 'font/woff2'];
        const availableFonts = [];
        const attachments = this._currentPlayOptions.mediaSource.MediaAttachments || [];
        const apiClient = ServerConnections.getApiClient(item);
        attachments.forEach(i => {
            // we only require font files and ignore embedded media attachments like covers as there are cases where ffmpeg fails to extract those
            if (supportedFonts.includes(i.MimeType)) {
                // embedded font url
                availableFonts.push(apiClient.getUrl(i.DeliveryUrl));
            }
        });
        const fallbackFontList = apiClient.getUrl('/FallbackFont/Fonts', {
            ApiKey: apiClient.accessToken()
        });
        const htmlVideoPlayer = this;
        import('@jellyfin/libass-wasm').then(({ default: SubtitlesOctopus }) => {
            const mediaSource = this._currentPlayOptions.mediaSource;
            const videoStream = getMediaStreamVideoTracks(mediaSource)[0];

            const options = {
                video: videoElement,
                subUrl: getTextTrackUrl(track, item),
                fonts: availableFonts,
                workerUrl: `${appRouter.baseUrl()}/libraries/subtitles-octopus-worker.js`,
                legacyWorkerUrl: `${appRouter.baseUrl()}/libraries/subtitles-octopus-worker-legacy.js`,
                onError() {
                    // HACK: Clear JavascriptSubtitlesOctopus: it gets disposed when an error occurs
                    htmlVideoPlayer.#currentAssRenderer = null;

                    // HACK: Give JavascriptSubtitlesOctopus time to dispose itself
                    setTimeout(() => {
                        onErrorInternal(this, MediaError.ASS_RENDER_ERROR);
                    }, 0);
                },
                timeOffset: (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000,

                // new octopus options; override all, even defaults
                renderMode: 'wasm-blend',
                dropAllAnimations: false,
                libassMemoryLimit: 40,
                libassGlyphLimit: 40,
                targetFps: videoStream?.ReferenceFrameRate || 24,
                prescaleFactor: 0.8,
                prescaleHeightLimit: 1080,
                maxRenderHeight: 2160,
                resizeVariation: 0.2,
                renderAhead: 90
            };

            Promise.all([
                apiClient.getNamedConfiguration('encoding'),
                // Worker in Tizen 5 doesn't resolve relative path with async request
                resolveUrl(options.workerUrl),
                resolveUrl(options.legacyWorkerUrl)
            ]).then(([config, workerUrl, legacyWorkerUrl]) => {
                options.workerUrl = workerUrl;
                options.legacyWorkerUrl = legacyWorkerUrl;

                if (config.EnableFallbackFont) {
                    apiClient.getJSON(fallbackFontList).then((fontFiles = []) => {
                        fontFiles.forEach(font => {
                            const fontUrl = apiClient.getUrl(`/FallbackFont/Fonts/${encodeURIComponent(font.Name)}`, {
                                ApiKey: apiClient.accessToken()
                            });
                            availableFonts.push(fontUrl);
                        });
                        this.#currentAssRenderer = new SubtitlesOctopus(options);
                    });
                } else {
                    this.#currentAssRenderer = new SubtitlesOctopus(options);
                }
            });
        });
    }

    /**
     * @private
     */
    renderPgs(videoElement, track, item) {
        import('libpgs').then((libpgs) => {
            const aspectRatio = this.getAspectRatio() === 'auto' ? 'contain' : this.getAspectRatio();
            const options = {
                video: videoElement,
                subUrl: getTextTrackUrl(track, item),
                workerUrl: `${appRouter.baseUrl()}/libraries/libpgs.worker.js`,
                timeOffset: (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000,
                aspectRatio
            };
            this.#currentPgsRenderer = new libpgs.PgsRenderer(options);
        });
    }

    /**
     * @private
     */
    renderSubtitlesWithCustomElement(videoElement, track, item, targetTextTrackIndex) {
        this.fetchSubtitles(track, item).then((subtitleData) => {
            const subtitleAppearance = userSettings.getSubtitleAppearanceSettings();
            const subtitleVerticalPosition = parseInt(subtitleAppearance.verticalPosition, 10);

            if (!this.#videoSubtitlesElem && !this.isSecondaryTrack(targetTextTrackIndex)) {
                let subtitlesContainer = document.querySelector('.videoSubtitles');
                if (!subtitlesContainer) {
                    subtitlesContainer = document.createElement('div');
                    subtitlesContainer.classList.add('videoSubtitles');
                }
                const subtitlesElement = document.createElement('div');
                subtitlesElement.classList.add('videoSubtitlesInner');
                subtitlesContainer.appendChild(subtitlesElement);
                this.#videoSubtitlesElem = subtitlesElement;
                this.setSubtitleAppearance(subtitlesContainer, this.#videoSubtitlesElem);
                videoElement.parentNode.appendChild(subtitlesContainer);
                this.#currentTrackEvents = subtitleData.TrackEvents;
            } else if (!this.#videoSecondarySubtitlesElem && this.isSecondaryTrack(targetTextTrackIndex)) {
                const subtitlesContainer = document.querySelector('.videoSubtitles');
                if (!subtitlesContainer) return;
                const secondarySubtitlesElement = document.createElement('div');
                secondarySubtitlesElement.classList.add('videoSecondarySubtitlesInner');
                // determine the order of the subtitles
                if (subtitleVerticalPosition < 0) {
                    subtitlesContainer.insertBefore(secondarySubtitlesElement, subtitlesContainer.firstChild);
                } else {
                    subtitlesContainer.appendChild(secondarySubtitlesElement);
                }
                this.#videoSecondarySubtitlesElem = secondarySubtitlesElement;
                this.setSubtitleAppearance(subtitlesContainer, this.#videoSecondarySubtitlesElem);
                this.#currentSecondaryTrackEvents = subtitleData.TrackEvents;
            }
        });
    }

    /**
     * @private
     */
    setSubtitleAppearance(elem, innerElem) {
        subtitleAppearanceHelper.applyStyles({
            text: innerElem,
            window: elem
        }, userSettings.getSubtitleAppearanceSettings());
    }

    /**
     * @private
     */
    getCueCss(appearance, selector) {
        return `${selector}::cue {
                ${appearance.text.map((s) => s.value !== undefined && s.value !== '' ? `${s.name}:${s.value}!important;` : '').join('')}
            }`;
    }

    /**
     * @private
     */
    setCueAppearance() {
        const elementId = `${this.id}-cuestyle`;

        let styleElem = document.querySelector(`#${elementId}`);
        if (!styleElem) {
            styleElem = document.createElement('style');
            styleElem.id = elementId;
            document.getElementsByTagName('head')[0].appendChild(styleElem);
        }

        styleElem.innerHTML = this.getCueCss(subtitleAppearanceHelper.getStyles(userSettings.getSubtitleAppearanceSettings()), '.htmlvideoplayer');
    }

    /**
     * @private
     */
    async renderTracksEvents(videoElement, track, item, targetTextTrackIndex = PRIMARY_TEXT_TRACK_INDEX) {
        if (!itemHelper.isLocalItem(item) || track.IsExternal) {
            const format = (track.Codec || '').toLowerCase();
            if (format === 'ssa' || format === 'ass') {
                this.renderSsaAss(videoElement, track, item);
                return;
            }
            if (format === 'pgssub') {
                this.renderPgs(videoElement, track, item);
                return;
            }

            if (useCustomSubtitles(userSettings)) {
                this.renderSubtitlesWithCustomElement(videoElement, track, item, targetTextTrackIndex);
                return;
            }
        }

        let trackElement = null;
        const updatingTrack = videoElement.textTracks && videoElement.textTracks.length > (this.isSecondaryTrack(targetTextTrackIndex) ? 1 : 0);
        if (updatingTrack) {
            trackElement = videoElement.textTracks[targetTextTrackIndex];
            // This throws an error in IE, but is fine in chrome
            // In IE it's not necessary anyway because changing the src seems to be enough
            try {
                trackElement.mode = 'showing';
                while (trackElement.cues.length) {
                    trackElement.removeCue(trackElement.cues[0]);
                }
            } catch (e) {
                console.error('error removing cue from textTrack', e);
            }

            trackElement.mode = 'disabled';
        } else {
            // There is a function addTextTrack but no function for removeTextTrack
            // Therefore we add ONE element and replace its cue data
            trackElement = videoElement.addTextTrack('subtitles', 'manualTrack', 'und');
        }

        // download the track json
        this.fetchSubtitles(track, item).then(function (data) {
            console.debug(`downloaded ${data.TrackEvents.length} track events`);

            const subtitleAppearance = userSettings.getSubtitleAppearanceSettings();
            const cueLine = parseInt(subtitleAppearance.verticalPosition, 10);

            // add some cues to show the text
            // in safari, the cues need to be added before setting the track mode to showing
            for (const trackEvent of data.TrackEvents) {
                const TrackCue = window.VTTCue || window.TextTrackCue;
                const text = normalizeTrackEventText(trackEvent.Text, false);
                const cue = new TrackCue(trackEvent.StartPositionTicks / 10000000, trackEvent.EndPositionTicks / 10000000, text);

                if (cue.line === 'auto') {
                    if (cueLine < 0) {
                        const lineCount = (text.match(/\n/g) || []).length;
                        cue.line = cueLine - lineCount;
                    } else {
                        cue.line = cueLine;
                    }
                }

                trackElement.addCue(cue);
            }

            trackElement.mode = 'showing';
        });
    }

    /**
     * @private
     */
    updateSubtitleText(timeMs) {
        const allTrackEvents = [this.#currentTrackEvents, this.#currentSecondaryTrackEvents];
        const subtitleTextElements = [this.#videoSubtitlesElem, this.#videoSecondarySubtitlesElem];

        for (let i = 0; i < allTrackEvents.length; i++) {
            const trackEvents = allTrackEvents[i];
            const subtitleTextElement = subtitleTextElements[i];

            if (trackEvents && subtitleTextElement) {
                const ticks = timeMs * 10000;
                let selectedTrackEvent;
                for (const trackEvent of trackEvents) {
                    if (trackEvent.StartPositionTicks <= ticks && trackEvent.EndPositionTicks >= ticks) {
                        selectedTrackEvent = trackEvent;
                        break;
                    }
                }

                if (selectedTrackEvent?.Text) {
                    subtitleTextElement.innerHTML = DOMPurify.sanitize(
                        normalizeTrackEventText(selectedTrackEvent.Text, true));
                    subtitleTextElement.classList.remove('hide');
                } else {
                    subtitleTextElement.classList.add('hide');
                }
            }
        }
    }

    /**
     * @private
     */
    setCurrentTrackElement(streamIndex, targetTextTrackIndex) {
        console.debug(`setting new text track index to: ${streamIndex}`);

        const mediaStreamTextTracks = getMediaStreamTextTracks(this._currentPlayOptions.mediaSource);

        let track = streamIndex === -1 ? null : mediaStreamTextTracks.filter(function (t) {
            return t.Index === streamIndex;
        })[0];

        // This play method can only check if it is real direct play, and will mark Remux as Transcode as well
        const isDirectPlay = this._currentPlayOptions.playMethod === 'DirectPlay';
        const burnInWhenTranscoding = appSettings.alwaysBurnInSubtitleWhenTranscoding();

        let sessionPromise;
        if (!isDirectPlay && burnInWhenTranscoding) {
            const apiClient = ServerConnections.getApiClient(this._currentPlayOptions.item.ServerId);
            sessionPromise = apiClient.getSessions({
                deviceId: apiClient.deviceId()
            }).then(function (sessions) {
                return sessions[0] || {};
            }, function () {
                return Promise.resolve({});
            });
        } else {
            sessionPromise = Promise.resolve({});
        }

        const player = this;

        sessionPromise.then((s) => {
            if (!s.TranscodingInfo || s.TranscodingInfo.IsVideoDirect) {
                // restore recorded delivery method if any
                mediaStreamTextTracks.forEach((t) => {
                    t.DeliveryMethod = t.realDeliveryMethod ?? t.DeliveryMethod;
                });
                player.setTrackForDisplay(player.#mediaElement, track, targetTextTrackIndex);
                if (enableNativeTrackSupport(player._currentPlayOptions?.mediaSource, track)) {
                    if (streamIndex !== -1) {
                        player.setCueAppearance();
                    }
                } else {
                    // null these out to disable the player's native display (handled below)
                    streamIndex = -1;
                    track = null;
                }
            } else {
                // record the original delivery method and set all delivery method to encode
                // this is needed for subtitle track switching to properly reload the video stream
                mediaStreamTextTracks.forEach((t) => {
                    t.realDeliveryMethod = t.DeliveryMethod;
                    t.DeliveryMethod = 'Encode';
                });
                // unset stream when switching to transcode
                player.setTrackForDisplay(player.#mediaElement, null, -1);
            }
        });
    }

    /**
     * @private
     */
    createMediaElement(options) {
        const dlg = document.querySelector('.videoPlayerContainer');

        if (!dlg) {
            return import('./style.scss').then(() => {
                if (options.fullscreen) loading.show();

                const playerDlg = document.createElement('div');
                playerDlg.setAttribute('dir', 'ltr');
                playerDlg.classList.add('videoPlayerContainer');
                if (options.fullscreen) {
                    playerDlg.classList.add('videoPlayerContainer-onTop');
                }

                let html = '';
                const cssClass = 'htmlvideoplayer';

                // Can't autoplay in these browsers so we need to use the full controls, at least until playback starts
                if (!safeAppHost.supports(AppFeature.HtmlVideoAutoplay)) {
                    html += '<video class="' + cssClass + '" preload="metadata" autoplay="autoplay" controls="controls" webkit-playsinline playsinline>';
                } else if (browser.web0s) {
                    // in webOS, setting preload auto allows resuming videos
                    html += '<video class="' + cssClass + '" preload="auto" autoplay="autoplay" webkit-playsinline playsinline>';
                } else {
                    // Chrome 35 won't play with preload none
                    html += '<video class="' + cssClass + '" preload="metadata" autoplay="autoplay" webkit-playsinline playsinline>';
                }

                html += '</video>';

                playerDlg.innerHTML = html;
                const videoElement = playerDlg.querySelector('video');

                // TODO: Move volume control to PlaybackManager. Player should just be a wrapper that translates commands into API calls.
                if (!safeAppHost.supports(AppFeature.PhysicalVolumeControl)) {
                    videoElement.volume = getSavedVolume();
                }

                videoElement.addEventListener('timeupdate', this.onTimeUpdate);
                videoElement.addEventListener('ended', this.onEnded);
                videoElement.addEventListener('volumechange', this.onVolumeChange);
                videoElement.addEventListener('pause', this.onPause);
                videoElement.addEventListener('playing', this.onPlaying);
                videoElement.addEventListener('play', this.onPlay);
                videoElement.addEventListener('click', this.onClick);
                videoElement.addEventListener('dblclick', this.onDblClick);
                videoElement.addEventListener('waiting', this.onWaiting);
                if (options.backdropUrl) {
                    videoElement.poster = options.backdropUrl;
                }

                document.body.insertBefore(playerDlg, document.body.firstChild);
                this.#videoDialog = playerDlg;
                this.#mediaElement = videoElement;

                delete this.forcedFullscreen;

                if (options.fullscreen) {
                    // At this point, we must hide the scrollbar placeholder, so it's not being displayed while the item is being loaded
                    document.body.classList.add('hide-scroll');

                    // Enter fullscreen in the webOS browser to hide the top bar
                    if (!window.NativeShell && browser.web0s && Screenfull.isEnabled) {
                        Screenfull.request().then(() => {
                            this.forcedFullscreen = true;
                        });
                        return videoElement;
                    }

                    // don't animate on smart tv's, too slow
                    if (!browser.slow && browser.supportsCssAnimation()) {
                        return zoomIn(playerDlg).then(function () {
                            return videoElement;
                        });
                    }
                }

                return videoElement;
            });
        } else {
            if (options.fullscreen) {
                // we need to hide scrollbar when starting playback from page with animated background
                document.body.classList.add('hide-scroll');

                // Enter fullscreen in the webOS browser to hide the top bar
                if (!this.forcedFullscreen && !window.NativeShell && browser.web0s && Screenfull.isEnabled) {
                    Screenfull.request().then(() => {
                        this.forcedFullscreen = true;
                    });
                }
            }

            const videoElement = dlg.querySelector('video');
            if (options.backdropUrl) {
                // update backdrop image
                videoElement.poster = options.backdropUrl;
            }

            return Promise.resolve(videoElement);
        }
    }

    /**
     * @private
     */
    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'video';
    }

    /**
     * @private
     */
    supportsPlayMethod(playMethod, item) {
        if (appHost && appHost.supportsPlayMethod) {
            return appHost.supportsPlayMethod(playMethod, item);
        }

        return true;
    }

    /**
     * @private
     */
    getDeviceProfile(item, options) {
        return HtmlVideoPlayer.getDeviceProfileInternal(item, options).then((profile) => {
            this.#lastProfile = profile;
            return profile;
        });
    }

    /**
     * @private
     */
    static getDeviceProfileInternal(item, options) {
        if (appHost && appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item, options);
        }

        return getDefaultProfile();
    }

    /**
     * @private
     */
    static getSupportedFeatures() {
        const list = [];

        const video = document.createElement('video');
        if (
            // Check non-standard Safari PiP support
            typeof video.webkitSupportsPresentationMode === 'function' && video.webkitSupportsPresentationMode('picture-in-picture') && typeof video.webkitSetPresentationMode === 'function'
            // Check non-standard Windows PiP support
            || (window.Windows
                && Windows.UI.ViewManagement.ApplicationView.getForCurrentView()
                    .isViewModeSupported(Windows.UI.ViewManagement.ApplicationViewMode.compactOverlay))
            // Check standard PiP support
            || document.pictureInPictureEnabled
        ) {
            list.push('PictureInPicture');
        }

        if (browser.safari || browser.iOS || browser.iPad) {
            list.push('AirPlay');
        }

        if (typeof video.playbackRate === 'number') {
            list.push('PlaybackRate');
        }

        list.push('SetBrightness');
        list.push('SetAspectRatio');
        list.push('SecondarySubtitles');

        return list;
    }

    supports(feature) {
        if (!this.#supportedFeatures) {
            this.#supportedFeatures = HtmlVideoPlayer.getSupportedFeatures();
        }

        return this.#supportedFeatures.includes(feature);
    }

    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            if (val != null) {
                mediaElement.currentTime = val / 1000;
                return;
            }

            const currentTime = this.#currentTime;
            if (currentTime) {
                return currentTime * 1000;
            }

            return (mediaElement.currentTime || 0) * 1000;
        }
    }

    duration() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            const duration = mediaElement.duration;
            if (isValidDuration(duration)) {
                return duration * 1000;
            }
        }

        return null;
    }

    canSetAudioStreamIndex() {
        const video = this.#mediaElement;
        if (video) {
            return canPlaySecondaryAudio(video);
        }

        return false;
    }

    static onPictureInPictureError(err) {
        console.error(`Picture in picture error: ${err}`);
    }

    setPictureInPictureEnabled(isEnabled) {
        const video = this.#mediaElement;

        if (document.pictureInPictureEnabled) {
            if (video) {
                if (isEnabled) {
                    video.requestPictureInPicture().catch(HtmlVideoPlayer.onPictureInPictureError);
                } else {
                    document.exitPictureInPicture().catch(HtmlVideoPlayer.onPictureInPictureError);
                }
            }
        } else if (window.Windows) {
            this.isPip = isEnabled;
            if (isEnabled) {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().tryEnterViewModeAsync(Windows.UI.ViewManagement.ApplicationViewMode.compactOverlay);
            } else {
                Windows.UI.ViewManagement.ApplicationView.getForCurrentView().tryEnterViewModeAsync(Windows.UI.ViewManagement.ApplicationViewMode.default);
            }
        } else if (video?.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === 'function') {
            video.webkitSetPresentationMode(isEnabled ? 'picture-in-picture' : 'inline');
        }
    }

    isPictureInPictureEnabled() {
        if (document.pictureInPictureEnabled) {
            return !!document.pictureInPictureElement;
        } else if (window.Windows) {
            return this.isPip || false;
        } else {
            const video = this.#mediaElement;
            if (video) {
                return video.webkitPresentationMode === 'picture-in-picture';
            }
        }

        return false;
    }

    isAirPlayEnabled() {
        if (document.AirPlayEnabled) {
            return !!document.AirplayElement;
        }

        return false;
    }

    setAirPlayEnabled(isEnabled) {
        const video = this.#mediaElement;

        if (document.AirPlayEnabled) {
            if (video) {
                if (isEnabled) {
                    video.requestAirPlay().catch(function(err) {
                        console.error('Error requesting AirPlay', err);
                    });
                } else {
                    document.exitAirPLay().catch(function(err) {
                        console.error('Error exiting AirPlay', err);
                    });
                }
            }
        } else {
            video.webkitShowPlaybackTargetPicker();
        }
    }

    setBrightness(val) {
        const elem = this.#mediaElement;

        if (elem) {
            val = Math.max(0, val);
            val = Math.min(100, val);

            let rawValue = val;
            rawValue = Math.max(20, rawValue);

            const cssValue = rawValue >= 100 ? 'none' : (rawValue / 100);
            elem.style['-webkit-filter'] = `brightness(${cssValue})`;
            elem.style.filter = `brightness(${cssValue})`;
            elem.brightnessValue = val;
            Events.trigger(this, 'brightnesschange');
        }
    }

    getBrightness() {
        const elem = this.#mediaElement;
        if (elem) {
            const val = elem.brightnessValue;
            return val == null ? 100 : val;
        }
    }

    seekable() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            const seekable = mediaElement.seekable;
            if (seekable?.length) {
                let start = seekable.start(0);
                let end = seekable.end(0);

                if (!isValidDuration(start)) {
                    start = 0;
                }
                if (!isValidDuration(end)) {
                    end = 0;
                }

                return (end - start) > 0;
            }

            return false;
        }
    }

    pause() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    // This is a retry after error
    resume() {
        this.unpause();
    }

    unpause() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    paused() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            return mediaElement.paused;
        }

        return false;
    }

    setPlaybackRate(value) {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            mediaElement.playbackRate = value;
        }
    }

    getPlaybackRate() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            return mediaElement.playbackRate;
        }
        return null;
    }

    getSupportedPlaybackRates() {
        return [{
            name: '0.5x',
            id: 0.5
        }, {
            name: '0.75x',
            id: 0.75
        }, {
            name: '1x',
            id: 1.0
        }, {
            name: '1.25x',
            id: 1.25
        }, {
            name: '1.5x',
            id: 1.5
        }, {
            name: '1.75x',
            id: 1.75
        }, {
            name: '2x',
            id: 2.0
        }, {
            name: '2.5x',
            id: 2.5
        }, {
            name: '3x',
            id: 3.0
        }, {
            name: '3.5x',
            id: 3.5
        }, {
            name: '4.0x',
            id: 4.0
        }];
    }

    setVolume(val) {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            mediaElement.volume = Math.pow(val / 100, 3);
        }
    }

    getVolume() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            return Math.min(Math.round(Math.pow(mediaElement.volume, 1 / 3) * 100), 100);
        }
    }

    volumeUp() {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    setMute(mute) {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            mediaElement.muted = mute;
        }
    }

    isMuted() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            return mediaElement.muted;
        }
        return false;
    }

    #applyAspectRatio(val = this.getAspectRatio()) {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            if (val === 'auto') {
                mediaElement.style.removeProperty('object-fit');
            } else {
                mediaElement.style['object-fit'] = val;
            }
        }

        if (this.#currentPgsRenderer) {
            this.#currentPgsRenderer.aspectRatio = val === 'auto' ? 'contain' : val;
        }
    }

    setAspectRatio(val) {
        appSettings.aspectRatio(val);
        this.#applyAspectRatio(val);
    }

    getAspectRatio() {
        return appSettings.aspectRatio() || 'auto';
    }

    getSupportedAspectRatios() {
        return [{
            name: globalize.translate('Auto'),
            id: 'auto'
        }, {
            name: globalize.translate('AspectRatioCover'),
            id: 'cover'
        }, {
            name: globalize.translate('AspectRatioFill'),
            id: 'fill'
        }];
    }

    togglePictureInPicture() {
        return this.setPictureInPictureEnabled(!this.isPictureInPictureEnabled());
    }

    toggleAirPlay() {
        return this.setAirPlayEnabled(!this.isAirPlayEnabled());
    }

    getBufferedRanges() {
        const mediaElement = this.#mediaElement;
        if (mediaElement) {
            return getBufferedRanges(this, mediaElement);
        }

        return [];
    }

    getStats() {
        const mediaElement = this.#mediaElement;
        const playOptions = this._currentPlayOptions || [];

        const categories = [];

        if (!mediaElement) {
            return Promise.resolve({
                categories: categories
            });
        }

        const mediaCategory = {
            stats: [],
            type: 'media'
        };
        categories.push(mediaCategory);

        if (playOptions.url) {
            //  create an anchor element (note: no need to append this element to the document)
            let link = document.createElement('a');
            //  set href to any path
            link.setAttribute('href', playOptions.url);
            const protocol = (link.protocol || '').replace(':', '');

            if (protocol) {
                mediaCategory.stats.push({
                    label: globalize.translate('LabelProtocol'),
                    value: protocol
                });
            }

            link = null;
        }

        if (this._hlsPlayer) {
            mediaCategory.stats.push({
                label: globalize.translate('LabelStreamType'),
                value: 'HLS'
            });
        } else {
            mediaCategory.stats.push({
                label: globalize.translate('LabelStreamType'),
                value: 'Video'
            });
        }

        const videoCategory = {
            stats: [],
            type: 'video'
        };
        categories.push(videoCategory);

        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = mediaElement.getBoundingClientRect ? mediaElement.getBoundingClientRect() : {};
        let height = Math.round(rect.height * devicePixelRatio);
        let width = Math.round(rect.width * devicePixelRatio);

        // Don't show player dimensions on smart TVs because the app UI could be lower resolution than the video and this causes users to think there is a problem
        if (width && height && !browser.tv) {
            videoCategory.stats.push({
                label: globalize.translate('LabelPlayerDimensions'),
                value: `${width}x${height}`
            });
        }

        height = mediaElement.videoHeight;
        width = mediaElement.videoWidth;

        if (width && height) {
            videoCategory.stats.push({
                label: globalize.translate('LabelVideoResolution'),
                value: `${width}x${height}`
            });
        }

        if (mediaElement.getVideoPlaybackQuality) {
            const playbackQuality = mediaElement.getVideoPlaybackQuality();

            const droppedVideoFrames = playbackQuality.droppedVideoFrames || 0;
            videoCategory.stats.push({
                label: globalize.translate('LabelDroppedFrames'),
                value: droppedVideoFrames
            });

            const corruptedVideoFrames = playbackQuality.corruptedVideoFrames || 0;
            videoCategory.stats.push({
                label: globalize.translate('LabelCorruptedFrames'),
                value: corruptedVideoFrames
            });
        }

        const audioCategory = {
            stats: [],
            type: 'audio'
        };
        categories.push(audioCategory);

        const sinkId = mediaElement.sinkId;
        if (sinkId) {
            audioCategory.stats.push({
                label: 'Sink Id:',
                value: sinkId
            });
        }

        return Promise.resolve({
            categories: categories
        });
    }
}

export default HtmlVideoPlayer;
