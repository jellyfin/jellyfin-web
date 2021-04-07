import { Events } from 'jellyfin-apiclient';
import * as htmlMediaHelper from '../../components/htmlMediaHelper';

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function createApi() {
    await loadScript('qrc:///qtwebchannel/qwebchannel.js');
    const channel = await new Promise((resolve) => {
        /*global QWebChannel */
        new QWebChannel(window.qt.webChannelTransport, resolve);
    });
    return channel.objects;
}

async function getApi() {
    if (window.apiPromise) {
        return await window.apiPromise;
    }

    window.apiPromise = createApi();
    return await window.apiPromise;
}

let fadeTimeout;
function fade(instance, elem, startingVolume) {
    instance._isFadingOut = true;

    // Need to record the starting volume on each pass rather than querying elem.volume
    // This is due to iOS safari not allowing volume changes and always returning the system volume value
    const newVolume = Math.max(0, startingVolume - 15);
    console.debug('fading volume to ' + newVolume);
    instance.api.player.setVolume(newVolume);

    if (newVolume <= 0) {
        instance._isFadingOut = false;
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        cancelFadeTimeout();
        fadeTimeout = setTimeout(function () {
            fade(instance, null, newVolume).then(resolve, reject);
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

class HtmlAudioPlayer {
    constructor() {
        const self = this;

        self.name = 'Html Audio Player';
        self.type = 'mediaplayer';
        self.id = 'htmlaudioplayer';
        self.useServerPlaybackInfoForAudio = true;
        self.mustDestroy = true;

        self._duration = undefined;
        self._currentTime = undefined;
        self._paused = false;
        self._volume = htmlMediaHelper.getSavedVolume() * 100;
        self._playRate = 1;

        self.api = undefined;

        self.ensureApi = async () => {
            if (!self.api) {
                self.api = await getApi();
            }
        };

        self.play = async (options) => {
            self._started = false;
            self._timeUpdated = false;
            self._currentTime = null;
            self._duration = undefined;

            await self.ensureApi();
            const player = self.api.player;
            player.playing.connect(onPlaying);
            player.positionUpdate.connect(onTimeUpdate);
            player.finished.connect(onEnded);
            player.updateDuration.connect(onDuration);
            player.error.connect(onError);
            player.paused.connect(onPause);

            return await setCurrentSrc(options);
        };

        function setCurrentSrc(options) {
            return new Promise((resolve) => {
                const val = options.url;
                self._currentSrc = val;
                console.debug('playing url: ' + val);

                // Convert to seconds
                const ms = (options.playerStartPositionTicks || 0) / 10000;
                self._currentPlayOptions = options;

                self.api.player.load(val,
                    { startMilliseconds: ms, autoplay: true },
                    {type: 'music', headers: {'User-Agent': 'JellyfinMediaPlayer'}, frameRate: 0, media: {}},
                    '#1',
                    '',
                    resolve);
            });
        }

        self.onEndedInternal = () => {
            const stopInfo = {
                src: self._currentSrc
            };

            Events.trigger(self, 'stopped', [stopInfo]);

            self._currentTime = null;
            self._currentSrc = null;
            self._currentPlayOptions = null;
        };

        self.stop = async (destroyPlayer) => {
            cancelFadeTimeout();

            const src = self._currentSrc;

            if (src) {
                const originalVolume = self._volume;

                await self.ensureApi();
                return await fade(self, null, self._volume).then(function () {
                    self.pause();
                    self.setVolume(originalVolume, false);

                    self.onEndedInternal();

                    if (destroyPlayer) {
                        self.destroy();
                    }
                });
            }
            return;
        };

        self.destroy = async () => {
            await self.ensureApi();
            self.api.player.stop();

            const player = self.api.player;
            player.playing.disconnect(onPlaying);
            player.positionUpdate.disconnect(onTimeUpdate);
            player.finished.disconnect(onEnded);
            self._duration = undefined;
            player.updateDuration.disconnect(onDuration);
            player.error.disconnect(onError);
            player.paused.disconnect(onPause);
        };

        function onDuration(duration) {
            self._duration = duration;
        }

        function onEnded() {
            self.onEndedInternal();
        }

        function onTimeUpdate(time) {
            // Don't trigger events after user stop
            if (!self._isFadingOut) {
                self._currentTime = time;
                Events.trigger(self, 'timeupdate');
            }
        }

        function onPlaying() {
            if (!self._started) {
                self._started = true;
            }

            self.setPlaybackRate(1);
            self.setMute(false);

            if (self._paused) {
                self._paused = false;
                Events.trigger(self, 'unpause');
            }

            Events.trigger(self, 'playing');
        }

        function onPause() {
            self._paused = true;
            Events.trigger(self, 'pause');
        }

        function onError(error) {
            console.error(`media element error: ${error}`);

            htmlMediaHelper.onErrorInternal(self, 'mediadecodeerror');
        }
    }

    currentSrc() {
        return this._currentSrc;
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'audio';
    }

    getDeviceProfile() {
        return Promise.resolve({
            'Name': 'Jellyfin Media Player',
            'MusicStreamingTranscodingBitrate': 1280000,
            'TimelineOffsetSeconds': 5,
            'TranscodingProfiles': [
                {'Type': 'Audio'}
            ],
            'DirectPlayProfiles': [{'Type': 'Audio'}],
            'ResponseProfiles': [],
            'ContainerProfiles': [],
            'CodecProfiles': [],
            'SubtitleProfiles': []
        });
    }

    currentTime(val) {
        if (val != null) {
            this.ensureApi().then(() => {
                this.api.player.seekTo(val);
            });
            return;
        }

        return this._currentTime;
    }

    async currentTimeAsync() {
        await this.ensureApi();
        return await new Promise((resolve) => {
            this.api.player.getPosition(resolve);
        });
    }

    duration() {
        if (this._duration) {
            return this._duration;
        }

        return null;
    }

    seekable() {
        return Boolean(this._duration);
    }

    getBufferedRanges() {
        return [];
    }

    async pause() {
        await this.ensureApi();
        this.api.player.pause();
    }

    // This is a retry after error
    async resume() {
        await this.ensureApi();
        this._paused = false;
        this.api.player.play();
    }

    async unpause() {
        await this.ensureApi();
        this.api.player.play();
    }

    paused() {
        return this._paused;
    }

    async setPlaybackRate(value) {
        this._playRate = value;
        await this.ensureApi();
        this.api.player.setPlaybackRate(value * 1000);
    }

    getPlaybackRate() {
        return this._playRate;
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
        }];
    }

    async setVolume(val, save = true) {
        this._volume = val;
        if (save) {
            htmlMediaHelper.saveVolume((val || 100) / 100);
            Events.trigger(this, 'volumechange');
        }
        await this.ensureApi();
        this.api.player.setVolume(val);
    }

    getVolume() {
        return this._volume;
    }

    volumeUp() {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    async setMute(mute) {
        this._muted = mute;
        await this.ensureApi();
        this.api.player.setMuted(mute);
    }

    isMuted() {
        return this._muted;
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
    return ['PlaybackRate'];
}

export default HtmlAudioPlayer;
