import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import * as htmlMediaHelper from '../../components/htmlMediaHelper';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { getIncludeCorsCredentials } from '../../scripts/settings/webSettings';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { MediaError } from 'types/mediaError';
import { audioNodeBus, createGainNode, initializeMasterAudio, masterAudioOutput } from 'components/audioEngine/master.logic';
import { hijackMediaElementForCrossfade, xDuration } from 'components/audioEngine/crossfader.logic';
import { scrollToActivePlaylistItem, triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';

function getDefaultProfile() {
    return profileBuilder({});
}

let fadeTimeout;
function fade(instance, elem, startingVolume) {
    if (masterAudioOutput.mixerNode && xDuration.enabled) {
        return new Promise(function (resolve) {
            instance._isFadingOut = true;

            hijackMediaElementForCrossfade();

            setTimeout(() => {
                instance._isFadingOut = false;
                resolve();
            }, xDuration.fadeOut * 1000);
        });
    }

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
        import('../../components/fetchhelper').then((fetchHelper) => {
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
                let normalizationGain;
                if (userSettings.selectAudioNormalization() == 'TrackGain') {
                    normalizationGain = options.item.NormalizationGain
                        ?? options.mediaSource.albumNormalizationGain;
                } else if (userSettings.selectAudioNormalization() == 'AlbumGain') {
                    normalizationGain =
                        options.mediaSource.albumNormalizationGain
                        ?? options.item.NormalizationGain;
                }

                audioNodeBus[0].gain.linearRampToValueAtTime(
                    0.01,
                    masterAudioOutput.audioContext.currentTime
                );

                if (normalizationGain) {
                    // Calculate the normalization gain
                    const gainValue = Math.pow(10, normalizationGain / 20);

                    // Set the final gain value
                    audioNodeBus[0].gain.exponentialRampToValueAtTime(
                        gainValue,
                        masterAudioOutput.audioContext.currentTime + (xDuration.sustain / 24)
                    );
                } else {
                    audioNodeBus[0].gain.exponentialRampToValueAtTime(
                        1,
                        masterAudioOutput.audioContext.currentTime + (xDuration.sustain / 24)
                    );
                }
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
        };

        function createMediaElement() {
            let elem = self._mediaElement;

            if (elem && elem.id === 'currentMediaElement') {
                return elem;
            }

            elem = document.querySelector('.mediaPlayerAudio');

            if (!elem) {
                elem = document.createElement('audio');
                elem.classList.add('mediaPlayerAudio');
                elem.id = 'currentMediaElement';
                elem.classList.add('hide');
                elem.preload = 'auto';

                document.body.appendChild(elem);
            }

            if (!xDuration.enabled) {
                elem.volume = htmlMediaHelper.getSavedVolume();
            }

            self._mediaElement = elem;

            addGainElement(elem);

            return elem;
        }

        function addGainElement(elem) {
            try {
                initializeMasterAudio(self.destroy);
                createGainNode(elem);
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
            }
        }

        function onVolumeChange() {
            if (!self._isFadingOut) {
                htmlMediaHelper.saveVolume(this.volume);
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
            triggerSongInfoDisplay();
            scrollToActivePlaylistItem();

            const elapsedTime = performance.now() - xDuration.t0; // Calculate the elapsed time
            console.log('unexpected audio gap in seconds: ', (elapsedTime / 1000) - xDuration.sustain);
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
        const audioCtx = masterAudioOutput.audioContext;
        const mediaElement = this._mediaElement;

        if (masterAudioOutput.mixerNode && audioCtx) {
            // Apply the makeup gain
            const gainValue = (val / 100);

            masterAudioOutput.mixerNode.gain.setTargetAtTime(
                gainValue * masterAudioOutput.makeupGain,
                audioCtx.currentTime + 0.25,
                0.2
            );
            masterAudioOutput.volume = Math.max(val, 1);
            let muteButton = document.querySelector('.buttonMute');
            if (!muteButton) muteButton = document.querySelector('.muteButton');
            if (muteButton) {
                const muteButtonIcon = muteButton?.querySelector('.material-icons');
                muteButtonIcon?.classList.remove('volume_off', 'volume_up');
                muteButtonIcon?.classList.add('volume_up');
            }

            const volumeSlider = document.querySelector('.nowPlayingVolumeSlider');
            if (volumeSlider && !volumeSlider.dragging) {
                volumeSlider.level = masterAudioOutput.volume;
            }
            masterAudioOutput.muted = false;
        } else if (mediaElement) {
            mediaElement.volume = Math.pow(val / 100, 3);
        }
    }

    getVolume() {
        const audioCtx = masterAudioOutput.audioContext;

        if (masterAudioOutput.mixerNode && audioCtx) {
            return Math.min(Math.round(masterAudioOutput.volume), 100);
        }

        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return Math.min(Math.round(Math.pow(mediaElement.volume, 1 / 3) * 100), 100);
        }
    }

    volumeUp() {
        const audioCtx = masterAudioOutput.audioContext;

        if (masterAudioOutput.mixerNode && audioCtx) {
            masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                this.getVolume() + 0.05,
                audioCtx.currentTime + 0.3
            );
            return;
        }
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        const audioCtx = masterAudioOutput.audioContext;

        if (masterAudioOutput.mixerNode && audioCtx) {
            masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                this.getVolume() - 0.05,
                audioCtx.currentTime + 0.3
            );
            return;
        }
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    setMute(mute) {
        const audioCtx = masterAudioOutput.audioContext;
        if (masterAudioOutput.mixerNode && audioCtx) {
            masterAudioOutput.mixerNode.gain.value = 0;
            masterAudioOutput.mixerNode.gain.cancelScheduledValues(audioCtx.currentTime);
            if (mute) {
                masterAudioOutput.mixerNode.gain.linearRampToValueAtTime(
                    (masterAudioOutput.volume / 100) * masterAudioOutput.makeupGain,
                    audioCtx.currentTime
                );
                masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                    0.02,
                    audioCtx.currentTime + 2
                );
            } else {
                masterAudioOutput.mixerNode.gain.linearRampToValueAtTime(
                    0.02,
                    audioCtx.currentTime
                );
                masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                    (masterAudioOutput.volume / 100) * masterAudioOutput.makeupGain,
                    audioCtx.currentTime + 2
                );
            }
            let muteButton = document.querySelector('.buttonMute');
            if (!muteButton) muteButton = document.querySelector('.muteButton');
            if (!muteButton) return;
            const muteButtonIcon = muteButton?.querySelector('.material-icons');
            muteButtonIcon?.classList.remove('volume_off', 'volume_up');
            muteButtonIcon?.classList.add(mute ? 'volume_off' : 'volume_up');
            masterAudioOutput.muted = mute;
            return;
        }
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.muted = mute;
        }
    }

    isMuted() {
        const audioCtx = masterAudioOutput.audioContext;

        if (masterAudioOutput.mixerNode && audioCtx) {
            return masterAudioOutput.muted;
        }
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
                    mediaElement.requestAirPlay().catch(function (err) {
                        console.error('Error requesting AirPlay', err);
                    });
                } else {
                    document.exitAirPLay().catch(function (err) {
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
