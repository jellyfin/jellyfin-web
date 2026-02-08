import { AppFeature } from 'constants/appFeature';
import { PluginType } from 'constants/pluginType';
import { MediaError } from 'types/mediaError';

import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import * as htmlMediaHelper from '../../components/htmlMediaHelper';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { getIncludeCorsCredentials } from '../../scripts/settings/webSettings';
import Events from '../../utils/events.ts';

function getDefaultProfile() {
    return profileBuilder({});
}

let fadeTimeout;
function fade(instance, elem, startingVolume) {
    instance._isFadingOut = true;

    // Need to record the starting volume on each pass rather than querying elem.volume
    // This is due to iOS safari not allowing volume changes and always returning the system volume value
    const newVolume = Math.max(0, startingVolume - 0.15);
    console.debug('fading volume to ' + newVolume);
    elem.volume = newVolume;

    if (newVolume <= 0) {
        instance._isFadingOut = false;
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        cancelFadeTimeout();
        fadeTimeout = setTimeout(function () {
            fade(instance, elem, newVolume).then(resolve, reject);
        }, 100);
    });
}

function cancelFadeTimeout() {
    const timeout = fadeTimeout;
    if (timeout) {
        clearTimeout(timeout);
        fadeTimeout = null;
    }
}

function supportsFade() {
    // Not working on tizen.
    // We could possibly enable on other tv's, but all smart tv browsers tend to be pretty primitive
    return !browser.tv;
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

function enableHlsPlayer(url, item, mediaSource, mediaType) {
    if (!htmlMediaHelper.enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType)) {
        return Promise.reject();
    }

    if (url.indexOf('.m3u8') !== -1) {
        return Promise.resolve();
    }

    // issue head request to get content type
    return new Promise(function (resolve, reject) {
        import('../../utils/fetch').then((fetchHelper) => {
            fetchHelper.ajax({
                url: url,
                type: 'HEAD'
            }).then(function (response) {
                const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
                if (contentType === 'application/vnd.apple.mpegurl' || contentType === 'application/x-mpegurl') {
                    resolve();
                } else {
                    reject();
                }
            }, reject);
        });
    });
}

class HtmlAudioPlayer {
    constructor() {
        const self = this;

        self.name = 'Html Audio Player';
        self.type = PluginType.MediaPlayer;
        self.id = 'htmlaudioplayer';

        // Let any players created by plugins take priority
        self.priority = 1;

        // Reduced-gap playback state
        self._nextMediaElement = null;
        self._nextPlayOptions = null;
        self._isPreloadingNext = false;
        self._gaplessEnabled = false;
        self._nextGainNode = null;
        self._nextNormalizationGain = null;

        self.play = function (options) {
            self._started = false;
            self._timeUpdated = false;
            self._currentTime = null;

            const elem = createMediaElement();

            return setCurrentSrc(elem, options);
        };

        function setCurrentSrc(elem, options) {
            unBindEvents(elem);
            bindEvents(elem);

            let val = options.url;
            console.debug('playing url: ' + val);
            import('../../scripts/settings/userSettings').then((userSettings) => {
                if (browser.iOS) {
                    // createMediaElementSource breaks playbackRate and pitch on iOS WebKit
                    return;
                }

                let normalizationGain;
                if (userSettings.selectAudioNormalization() == 'TrackGain') {
                    normalizationGain = options.item.NormalizationGain
                        ?? options.mediaSource.albumNormalizationGain;
                } else if (userSettings.selectAudioNormalization() == 'AlbumGain') {
                    normalizationGain =
                        options.mediaSource.albumNormalizationGain
                        ?? options.item.NormalizationGain;
                } else {
                    console.debug('normalization disabled');
                    return;
                }

                if (!self.gainNode) {
                    addGainElement(elem);
                    if (!self.gainNode) return;
                }

                if (normalizationGain) {
                    self.normalizationGain = Math.pow(10, normalizationGain / 20);
                    self.gainNode.gain.value = self.normalizationGain;
                } else {
                    self.gainNode.gain.value = 1;
                    self.normalizationGain = 1;
                }
                if (browser.safari) {
                    // Gain value is absolute in Safari. Add volume from the slider
                    self.gainNode.gain.value *= elem.volume;
                }
                console.debug('gain: ' + self.normalizationGain);

                self.setPreloadNextTrack(userSettings.enableReducedGapAudio());
            }).catch((err) => {
                console.error('Failed to add/change gainNode', err);
            });

            // Convert to seconds
            const seconds = (options.playerStartPositionTicks || 0) / 10000000;
            if (seconds) {
                val += '#t=' + seconds;
            }

            htmlMediaHelper.destroyHlsPlayer(self);

            self._currentPlayOptions = options;

            const crossOrigin = htmlMediaHelper.getCrossOriginValue(options.mediaSource);
            if (crossOrigin) {
                elem.crossOrigin = crossOrigin;
            }

            // This avoids the AudioContext being suspended when Safari is put into background
            if ('audioSession' in navigator) {
                navigator.audioSession.type = 'playback';
            }

            return enableHlsPlayer(val, options.item, options.mediaSource, 'Audio').then(function () {
                return new Promise(function (resolve, reject) {
                    requireHlsPlayer(async () => {
                        const includeCorsCredentials = await getIncludeCorsCredentials();

                        const hls = new Hls({
                            manifestLoadingTimeOut: 20000,
                            xhrSetup: function (xhr) {
                                xhr.withCredentials = includeCorsCredentials;
                            }
                        });
                        hls.loadSource(val);
                        hls.attachMedia(elem);

                        htmlMediaHelper.bindEventsToHlsPlayer(self, hls, elem, onError, resolve, reject);

                        self._hlsPlayer = hls;

                        self._currentSrc = val;
                    });
                });
            }, async () => {
                elem.autoplay = true;

                const includeCorsCredentials = await getIncludeCorsCredentials();
                if (includeCorsCredentials) {
                    // Safari will not send cookies without this
                    elem.crossOrigin = 'use-credentials';
                }

                return htmlMediaHelper.applySrc(elem, val, options).then(function () {
                    self._currentSrc = val;

                    return htmlMediaHelper.playWithPromise(elem, onError);
                });
            });
        }

        function bindEvents(elem) {
            elem.addEventListener('timeupdate', onTimeUpdate);
            elem.addEventListener('ended', onEnded);
            elem.addEventListener('volumechange', onVolumeChange);
            elem.addEventListener('pause', onPause);
            elem.addEventListener('playing', onPlaying);
            elem.addEventListener('play', onPlay);
            elem.addEventListener('waiting', onWaiting);
        }

        function unBindEvents(elem) {
            elem.removeEventListener('timeupdate', onTimeUpdate);
            elem.removeEventListener('ended', onEnded);
            elem.removeEventListener('volumechange', onVolumeChange);
            elem.removeEventListener('pause', onPause);
            elem.removeEventListener('playing', onPlaying);
            elem.removeEventListener('play', onPlay);
            elem.removeEventListener('waiting', onWaiting);
            elem.removeEventListener('error', onError); // bound in htmlMediaHelper
        }

        self.stop = function (destroyPlayer) {
            cancelFadeTimeout();

            const elem = self._mediaElement;
            const src = self._currentSrc;

            if (elem && src) {
                if (!destroyPlayer || !supportsFade()) {
                    elem.pause();

                    htmlMediaHelper.onEndedInternal(self, elem, onError);

                    if (destroyPlayer) {
                        self.destroy();
                    }
                    return Promise.resolve();
                }

                const originalVolume = elem.volume;

                return fade(self, elem, elem.volume).then(function () {
                    elem.pause();
                    elem.volume = originalVolume;

                    htmlMediaHelper.onEndedInternal(self, elem, onError);

                    if (destroyPlayer) {
                        self.destroy();
                    }
                });
            }
            return Promise.resolve();
        };

        self.destroy = function () {
            unBindEvents(self._mediaElement);
            htmlMediaHelper.resetSrc(self._mediaElement);
            self.clearNextSource();
        };

        function createMediaElement() {
            let elem = self._mediaElement;

            if (elem) {
                return elem;
            }

            elem = document.querySelector('.mediaPlayerAudio');

            if (!elem) {
                elem = document.createElement('audio');
                elem.classList.add('mediaPlayerAudio');
                elem.classList.add('hide');

                document.body.appendChild(elem);
            }

            // TODO: Move volume control to PlaybackManager. Player should just be a wrapper that translates commands into API calls.
            if (!appHost.supports(AppFeature.PhysicalVolumeControl)) {
                elem.volume = htmlMediaHelper.getSavedVolume();
            }

            self._mediaElement = elem;

            return elem;
        }

        function addGainElement(elem) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext; /* eslint-disable-line compat/compat */

                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaElementSource(elem);

                const gainNode = audioCtx.createGain();

                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                self.gainNode = gainNode;
            } catch (e) {
                console.error('Web Audio API is not supported in this browser', e);
            }
        }

        function onEnded() {
            htmlMediaHelper.onEndedInternal(self, this, onError);
        }

        function onTimeUpdate() {
            // Get the player position + the transcoding offset
            const time = this.currentTime;

            // Don't trigger events after user stop
            if (!self._isFadingOut) {
                self._currentTime = time;
                Events.trigger(self, 'timeupdate');

                // Preload next track when approaching the end (8 seconds before)
                if (self._gaplessEnabled && !self._isPreloadingNext && this.duration > 0) {
                    const timeRemaining = this.duration - time;
                    if (timeRemaining > 0 && timeRemaining <= 8) {
                        console.debug(`[REDUCED-GAP][TRIGGER] ${timeRemaining.toFixed(1)}s remaining — triggering preload`);
                        self._preloadNextQueuedTrack();
                    }
                }
            }
        }

        function onVolumeChange() {
            if (!self._isFadingOut) {
                htmlMediaHelper.saveVolume(this.volume);
                if (browser.safari && self.gainNode) {
                    self.gainNode.gain.value = this.volume * self.normalizationGain;
                }
                Events.trigger(self, 'volumechange');
            }
        }

        function onPlaying(e) {
            if (!self._started) {
                self._started = true;
                this.removeAttribute('controls');

                htmlMediaHelper.seekOnPlaybackStart(self, e.target, self._currentPlayOptions.playerStartPositionTicks);
            }
            Events.trigger(self, 'playing');
        }

        function onPlay() {
            Events.trigger(self, 'unpause');
        }

        function onPause() {
            Events.trigger(self, 'pause');
        }

        function onWaiting() {
            Events.trigger(self, 'waiting');
        }

        function onError() {
            const errorCode = this.error ? (this.error.code || 0) : 0;
            const errorMessage = this.error ? (this.error.message || '') : '';
            console.error('media element error: ' + errorCode.toString() + ' ' + errorMessage);

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
                    if (self._hlsPlayer) {
                        htmlMediaHelper.handleHlsJsMediaError(self);
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

            htmlMediaHelper.onErrorInternal(self, type);
        }

        self._preloadNextQueuedTrack = function() {
            if (self._isPreloadingNext || !self._gaplessEnabled) {
                return;
            }

            self._isPreloadingNext = true;

            console.debug('[REDUCED-GAP][TRIGGER] Time threshold reached — requesting next track info from PlaybackManager');
            Events.trigger(self, 'preloadnextqueuedtrack');
        };

        self.setNextSource = function(options) {
            if (!options || !self._gaplessEnabled) {
                return Promise.resolve();
            }

            console.debug('[REDUCED-GAP][PRELOAD] Starting preload for next track', options.item?.Name);
            self._nextPlayOptions = options;

            const elem = self._createSecondaryMediaElement();
            elem.dataset.playlistItemId = options.item?.PlaylistItemId ?? '';

            // Eagerly resolve normalization gain so the gain node is wired before the switch.
            const normalizationSetup = import('../../scripts/settings/userSettings').then((userSettings) => {
                let normalizationGain;
                if (userSettings.selectAudioNormalization() == 'TrackGain') {
                    normalizationGain = options.item.NormalizationGain
                        ?? options.mediaSource?.albumNormalizationGain;
                } else if (userSettings.selectAudioNormalization() == 'AlbumGain') {
                    normalizationGain = options.mediaSource?.albumNormalizationGain
                        ?? options.item.NormalizationGain;
                }

                if (normalizationGain) {
                    // Create a dedicated AudioContext for the next element so it is ready to play
                    // immediately on switch without going through addGainElement at transition time.
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        const audioCtx = new AudioContext();
                        const source = audioCtx.createMediaElementSource(elem);
                        const gainNode = audioCtx.createGain();
                        source.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        const gain = Math.pow(10, normalizationGain / 20);
                        gainNode.gain.value = browser.safari ? gain * elem.volume : gain;
                        self._nextGainNode = gainNode;
                        self._nextNormalizationGain = gain;
                        console.debug('[REDUCED-GAP][PRELOAD] Gain node created for next track', { normalizationGain, gain });
                    } catch (e) {
                        console.error('[REDUCED-GAP][PRELOAD] Failed to create gain node for next track', e);
                    }
                } else {
                    console.debug('[REDUCED-GAP][PRELOAD] No normalization gain for next track — skipping gain node');
                }
            }).catch((err) => {
                console.error('[REDUCED-GAP][PRELOAD] Failed to setup normalization for next track', err);
            });

            return Promise.all([self._setNextSrc(elem, options), normalizationSetup]).then(() => {
                // Pre-bake the audio pipeline: play then immediately pause so the browser
                // initializes the decoder and audio hardware path. This eliminates the
                // startup latency that would otherwise appear at the moment of the real switch.
                const desiredVolume = elem.volume;
                elem.volume = 0;
                return elem.play().then(() => {
                    elem.pause();
                    elem.currentTime = 0;
                    elem.volume = desiredVolume;
                }).catch((err) => {
                    // Pre-bake failure is non-fatal; playback will still work, just with more latency.
                    console.warn('[REDUCED-GAP][PREBAKE] Could not pre-bake next track pipeline', err);
                });
            });
        };

        self._setNextSrc = function(elem, options) {
            const val = options.url;
            console.debug('Preloading URL: ' + val);

            const crossOrigin = htmlMediaHelper.getCrossOriginValue(options.mediaSource);
            if (crossOrigin) {
                elem.crossOrigin = crossOrigin;
            }

            return enableHlsPlayer(val, options.item, options.mediaSource, 'Audio').then(function () {
                return new Promise(function (resolve) {
                    requireHlsPlayer(async () => {
                        const includeCorsCredentials = await getIncludeCorsCredentials();

                        const hls = new Hls({
                            manifestLoadingTimeOut: 20000,
                            xhrSetup: function (xhr) {
                                xhr.withCredentials = includeCorsCredentials;
                            }
                        });
                        hls.loadSource(val);
                        hls.attachMedia(elem);

                        self._nextHlsPlayer = hls;
                        resolve();
                    });
                });
            }, async () => {
                const includeCorsCredentials = await getIncludeCorsCredentials();
                if (includeCorsCredentials) {
                    elem.crossOrigin = 'use-credentials';
                }

                return htmlMediaHelper.applySrc(elem, val, options).then(function () {
                    // Preload the audio
                    elem.load();
                });
            });
        };

        self._createSecondaryMediaElement = function() {
            if (self._nextMediaElement) {
                return self._nextMediaElement;
            }

            const elem = document.createElement('audio');
            elem.preload = 'auto';
            elem.classList.add('mediaPlayerAudioNext');
            elem.classList.add('hide');
            document.body.appendChild(elem);

            if (!appHost.supports(AppFeature.PhysicalVolumeControl)) {
                elem.volume = htmlMediaHelper.getSavedVolume();
            }

            self._nextMediaElement = elem;
            return elem;
        };

        // Returns the PlaylistItemId stamped on the preloaded element, or null if none is preloaded.
        // Used by PlaybackManager.onPlaybackStopped to decide whether to activate the preloaded track.
        self.getPreloadedItemId = function() {
            return self._nextMediaElement?.dataset.playlistItemId || null;
        };

        self.activatePreloadedTrack = function() {
            const nextItem = self._nextPlayOptions?.item;
            const nextMediaSource = self._nextPlayOptions?.mediaSource;

            // Capture old element refs before swapping — teardown happens after new element starts.
            const oldElement = self._mediaElement;
            const oldHlsPlayer = self._hlsPlayer;

            // Unbind events from old element now to prevent double-firing during overlap.
            if (oldElement) {
                unBindEvents(oldElement);
            }

            // Promote next track to current.
            self._mediaElement = self._nextMediaElement;
            self._hlsPlayer = self._nextHlsPlayer;
            self._currentPlayOptions = self._nextPlayOptions;
            self._currentSrc = self._nextPlayOptions?.url;

            // Apply pre-built gain node; fall back to addGainElement if pre-bake didn't run.
            if (self._nextGainNode) {
                self.gainNode = self._nextGainNode;
                self.normalizationGain = self._nextNormalizationGain ?? 1;
            } else {
                self.gainNode = null;
                self.normalizationGain = 1;
            }

            // Reset next track state.
            self._nextMediaElement = null;
            self._nextHlsPlayer = null;
            self._nextPlayOptions = null;
            self._nextGainNode = null;
            self._nextNormalizationGain = null;
            self._isPreloadingNext = false;

            // Reset playback state for the new track.
            self._started = false;
            self._timeUpdated = false;
            self._currentTime = null;

            // Bind events to the new current element before starting.
            bindEvents(self._mediaElement);

            // Start the new element immediately — it was pre-baked so latency should be minimal.
            console.debug('[REDUCED-GAP][SWITCH] Playing next track', nextItem?.Name);
            return self._mediaElement.play().then(() => {
                console.debug('[REDUCED-GAP][SWITCH] Reduced-gap transition complete', nextItem?.Name);
                self._started = true;
                Events.trigger(self, 'playing');

                // Tear down the old element only after the new one is audibly playing.
                if (oldElement) {
                    htmlMediaHelper.resetSrc(oldElement);
                    oldElement.remove();
                }
                if (oldHlsPlayer) {
                    htmlMediaHelper.destroyHlsPlayer({ _hlsPlayer: oldHlsPlayer });
                }
                console.debug('[REDUCED-GAP][SWITCH] Old track element cleaned up');

                // Resolve with the item/mediaSource so the PlaybackManager can wire up stream info.
                return { item: nextItem, mediaSource: nextMediaSource };
            });
        };

        self.setPreloadNextTrack = function(toggle) {
            console.debug(`[REDUCED-GAP][SETTING] Reduced-gap audio playback: ${toggle ? 'enabled' : 'disabled'}`);
            self._gaplessEnabled = toggle;
            if (!toggle) {
                self.clearNextSource();
            }
        };

        // Public API for the PlaybackManager to discard a stale preloaded track.
        self.clearNextSource = function() {
            if (self._nextMediaElement) {
                htmlMediaHelper.resetSrc(self._nextMediaElement);
                self._nextMediaElement.remove();
                self._nextMediaElement = null;
            }

            if (self._nextHlsPlayer) {
                htmlMediaHelper.destroyHlsPlayer({ _hlsPlayer: self._nextHlsPlayer });
                self._nextHlsPlayer = null;
            }

            self._nextPlayOptions = null;
            self._nextGainNode = null;
            self._nextNormalizationGain = null;
            self._isPreloadingNext = false;
        };
    }

    currentSrc() {
        return this._currentSrc;
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'audio';
    }

    getDeviceProfile(item) {
        if (appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item);
        }

        return getDefaultProfile();
    }

    toggleAirPlay() {
        return this.setAirPlayEnabled(!this.isAirPlayEnabled());
    }

    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            if (val != null) {
                mediaElement.currentTime = val / 1000;
                return;
            }

            const currentTime = this._currentTime;
            if (currentTime) {
                return currentTime * 1000;
            }

            return (mediaElement.currentTime || 0) * 1000;
        }
    }

    duration() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const duration = mediaElement.duration;
            if (htmlMediaHelper.isValidDuration(duration)) {
                return duration * 1000;
            }
        }

        return null;
    }

    seekable() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const seekable = mediaElement.seekable;
            if (seekable?.length) {
                let start = seekable.start(0);
                let end = seekable.end(0);

                if (!htmlMediaHelper.isValidDuration(start)) {
                    start = 0;
                }
                if (!htmlMediaHelper.isValidDuration(end)) {
                    end = 0;
                }

                return (end - start) > 0;
            }

            return false;
        }
    }

    getBufferedRanges() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return htmlMediaHelper.getBufferedRanges(this, mediaElement);
        }

        return [];
    }

    pause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    // This is a retry after error
    resume() {
        this.unpause();
    }

    unpause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    paused() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.paused;
        }

        return false;
    }

    setPlaybackRate(value) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.playbackRate = value;
        }
    }

    getPlaybackRate() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.playbackRate;
        }
        return null;
    }

    setVolume(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const linearVolume = Math.pow(val / 100, 3);
            mediaElement.volume = linearVolume;

            // Keep the preloaded next element in sync so volume is correct at switch time.
            if (this._nextMediaElement) {
                this._nextMediaElement.volume = linearVolume;
            }
        }
    }

    getVolume() {
        const mediaElement = this._mediaElement;
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
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.muted = mute;
        }
    }

    isMuted() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.muted;
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
        const mediaElement = this._mediaElement;

        if (mediaElement) {
            if (document.AirPlayEnabled) {
                if (isEnabled) {
                    mediaElement.requestAirPlay().catch(function(err) {
                        console.error('Error requesting AirPlay', err);
                    });
                } else {
                    document.exitAirPLay().catch(function(err) {
                        console.error('Error exiting AirPlay', err);
                    });
                }
            } else {
                mediaElement.webkitShowPlaybackTargetPicker();
            }
        }
    }

    supports(feature) {
        if (!supportedFeatures) {
            supportedFeatures = getSupportedFeatures();
        }

        return supportedFeatures.indexOf(feature) !== -1;
    }
}

let supportedFeatures;

function getSupportedFeatures() {
    const list = [];
    const audio = document.createElement('audio');

    if (typeof audio.playbackRate === 'number') {
        list.push('PlaybackRate');
    }

    if (browser.safari) {
        list.push('AirPlay');
    }

    return list;
}

export default HtmlAudioPlayer;
