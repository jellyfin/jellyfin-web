import browser from '../../scripts/browser';
import { Events } from 'jellyfin-apiclient';
import loading from '../../components/loading/loading';
import { appRouter } from '../../components/appRouter';
import {
    saveVolume,
    getSavedVolume,
    onErrorInternal
} from '../../components/htmlMediaHelper';
import Screenfull from 'screenfull';
import globalize from '../../scripts/globalize';

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

/* eslint-disable indent */

    function getMediaStreamAudioTracks(mediaSource) {
        return mediaSource.MediaStreams.filter(function (s) {
            return s.Type === 'Audio';
        });
    }

    export class HtmlVideoPlayer {
        /**
         * @type {string}
         */
        name;
        /**
         * @type {string}
         */
        type = 'mediaplayer';
        /**
         * @type {string}
         */
        id = 'htmlvideoplayer';
        useFullSubtitleUrls = true;
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
         * @type {number | null}
         */
        #audioTrackIndexToSetOnPlaying;
        /**
         * @type {boolean | undefined}
         */
        #showTrackOffset;
        /**
         * @type {number | undefined}
         */
        #currentTrackOffset;
        /**
         * @type {string[] | undefined}
         */
        #supportedFeatures;
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
        _currentPlayOptions;
        /**
         * @type {any | undefined}
         */
        #lastProfile;
        /**
         * @type {number | undefined}
         */
        #duration;
        /**
         * @type {boolean}
         */
        #paused = false;
        /**
         * @type {int}
         */
        #volume = 100;
        /**
         * @type {boolean}
         */
        #muted = false;
        /**
         * @type {float}
         */
        #playRate = 1;
        #api = undefined;

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

        async ensureApi() {
            if (!this.#api) {
                this.#api = await getApi();
            }
        }

        async play(options) {
            this.#started = false;
            this.#timeUpdated = false;
            this.#currentTime = null;

            this.resetSubtitleOffset();
            loading.show();
            await this.ensureApi();
            this.#api.power.setScreensaverEnabled(false);
            const elem = await this.createMediaElement(options);
            return await this.setCurrentSrc(elem, options);
        }

        /**
         * @private
         */
        getSubtitleParam() {
            const options = this._currentPlayOptions;

            if (this.#subtitleTrackIndexToSetOnPlaying != null && this.#subtitleTrackIndexToSetOnPlaying >= 0) {
                const initialSubtitleStream = options.mediaSource.MediaStreams[this.#subtitleTrackIndexToSetOnPlaying];
                if (!initialSubtitleStream || initialSubtitleStream.DeliveryMethod === 'Encode') {
                    this.#subtitleTrackIndexToSetOnPlaying = -1;
                } else if (initialSubtitleStream.DeliveryMethod === 'External') {
                    return '#,' + initialSubtitleStream.DeliveryUrl;
                }
            }

            if (this.#subtitleTrackIndexToSetOnPlaying == -1 || this.#subtitleTrackIndexToSetOnPlaying == null) {
                return '';
            }

            return '#' + this.#subtitleTrackIndexToSetOnPlaying;
        }

        /**
         * @private
         */
        setCurrentSrc(elem, options) {
            return new Promise((resolve) => {
                const val = options.url;
                this.#currentSrc = val;
                console.debug(`playing url: ${val}`);

                // Convert to seconds
                const ms = (options.playerStartPositionTicks || 0) / 10000;
                this._currentPlayOptions = options;
                this.#subtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSubtitleStreamIndex == null ? -1 : options.mediaSource.DefaultSubtitleStreamIndex;
                this.#audioTrackIndexToSetOnPlaying = options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;

                const player = this.#api.player;
                player.load(val,
                    { startMilliseconds: ms, autoplay: true },
                    {type: 'video', headers: {'User-Agent': 'JellyfinMediaPlayer'}, frameRate: 0, media: {}},
                    (this.#audioTrackIndexToSetOnPlaying != null)
                     ? '#' + this.#audioTrackIndexToSetOnPlaying : '#1',
                    this.getSubtitleParam(),
                    resolve);
            });
        }

        async setSubtitleStreamIndex(index) {
            await this.ensureApi();
            this.#subtitleTrackIndexToSetOnPlaying = index;
            this.#api.player.setSubtitleStream(this.getSubtitleParam());
        }

        async resetSubtitleOffset() {
            await this.ensureApi();
            this.#currentTrackOffset = 0;
            this.#showTrackOffset = false;
            this.#api.player.setSubtitleDelay(0);
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

        async setSubtitleOffset(offset) {
            await this.ensureApi();
            const offsetValue = parseFloat(offset);
            this.#currentTrackOffset = offsetValue;
            this.#api.player.setSubtitleDelay(offset);
        }

        getSubtitleOffset() {
            return this.#currentTrackOffset;
        }

        /**
         * @private
         */
        isAudioStreamSupported() {
            return true;
        }

        /**
         * @private
         */
        getSupportedAudioStreams() {
            const profile = this.#lastProfile;

            return getMediaStreamAudioTracks(this._currentPlayOptions.mediaSource).filter((stream) => {
                return this.isAudioStreamSupported(stream, profile);
            });
        }

        async setAudioStreamIndex(index) {
            await this.ensureApi();
            this.#audioTrackIndexToSetOnPlaying = index;
            const streams = this.getSupportedAudioStreams();

            if (streams.length < 2) {
                // If there's only one supported stream then trust that the player will handle it on it's own
                return;
            }

            this.#api.player.setAudioStream(index != -1 ? '#' + index : '');
        }

        onEndedInternal() {
            const stopInfo = {
                src: this.#currentSrc
            };

            Events.trigger(this, 'stopped', [stopInfo]);

            this.#currentTime = null;
            this.#currentSrc = null;
            this._currentPlayOptions = null;
        }

        async stop(destroyPlayer) {
            await this.ensureApi();
            this.#api.player.stop();
            this.#api.power.setScreensaverEnabled(true);

            this.onEndedInternal();

            if (destroyPlayer) {
                this.destroy();
            }
            return;
        }

        async destroy() {
            await this.ensureApi();
            this.#api.player.stop();
            this.#api.power.setScreensaverEnabled(true);

            appRouter.setTransparency('none');
            document.body.classList.remove('hide-scroll');

            const player = this.#api.player;
            player.playing.disconnect(this.onPlaying);
            player.positionUpdate.disconnect(this.onTimeUpdate);
            player.finished.disconnect(this.onEnded);
            this.#duration = undefined;
            player.updateDuration.disconnect(this.onDuration);
            player.error.disconnect(this.onError);
            player.paused.disconnect(this.onPause);

            const dlg = this.#videoDialog;
            if (dlg) {
                this.#videoDialog = null;
                dlg.parentNode.removeChild(dlg);
            }

            if (Screenfull.isEnabled) {
                Screenfull.exit();
            } else {
                // iOS Safari
                if (document.webkitIsFullScreen && document.webkitCancelFullscreen) {
                    document.webkitCancelFullscreen();
                }
            }
        }

        /**
         * @private
         */
        onEnded = () => {
            this.onEndedInternal();
        };

        /**
         * @private
         */
        onTimeUpdate = (time) => {
            if (time && !this.#timeUpdated) {
                this.#timeUpdated = true;
            }

            this.#currentTime = time;
            Events.trigger(this, 'timeupdate');
        };

        /**
         * @private
         */
        onNavigatedToOsd = () => {
            const dlg = this.#videoDialog;
            if (dlg) {
                dlg.classList.remove('videoPlayerContainer-onTop');
            }
        };

        /**
         * @private
         */
        onPlaying = () => {
            if (!this.#started) {
                this.#started = true;

                loading.hide();

                const volume = getSavedVolume() * 100;
                if (volume != this.#volume) {
                    this.setVolume(volume, false);
                }

                this.setPlaybackRate(1);
                this.setMute(false);

                if (this._currentPlayOptions.fullscreen) {
                    appRouter.showVideoOsd().then(this.onNavigatedToOsd);
                } else {
                    appRouter.setTransparency('backdrop');
                    this.#videoDialog.classList.remove('videoPlayerContainer-onTop');
                }
            }

            if (this.#paused) {
                this.#paused = false;
                Events.trigger(this, 'unpause');
            }

            Events.trigger(this, 'playing');
        };

        /**
         * @private
         */
        onPause = () => {
            this.#paused = true;
            // For Syncplay ready notification
            Events.trigger(this, 'pause');
        };

        onWaiting = () => {
            Events.trigger(this, 'waiting');
        };

        /**
         * @private
         * @param e {Event} The event received from the `<video>` element
         */
        onError = (error) => {
            console.error(`media element error: ${error}`);

            onErrorInternal(this, 'mediadecodeerror');
        };

        /**
         * @private
         */
        createMediaElement(options) {
            const dlg = document.querySelector('.videoPlayerContainer');

            if (!dlg) {
                return import('./style.css').then(() => {
                    loading.show();

                    const dlg = document.createElement('div');

                    dlg.classList.add('videoPlayerContainer');

                    if (options.fullscreen) {
                        dlg.classList.add('videoPlayerContainer-onTop');
                    }

                    const html = '';

                    dlg.innerHTML = html;

                    document.body.insertBefore(dlg, document.body.firstChild);
                    this.#videoDialog = dlg;
                    const player = this.#api.player;
                    player.playing.connect(this.onPlaying);
                    player.positionUpdate.connect(this.onTimeUpdate);
                    player.finished.connect(this.onEnded);
                    player.updateDuration.connect(this.onDuration);
                    player.error.connect(this.onError);
                    player.paused.connect(this.onPause);

                    if (options.fullscreen) {
                        // At this point, we must hide the scrollbar placeholder, so it's not being displayed while the item is being loaded
                        document.body.classList.add('hide-scroll');
                    }
                });
            } else {
                // we need to hide scrollbar when starting playback from page with animated background
                if (options.fullscreen) {
                    document.body.classList.add('hide-scroll');
                }

                return Promise.resolve();
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
    supportsPlayMethod() {
        return true;
    }

    /**
     * @private
     */
    getDeviceProfile() {
        return Promise.resolve({
            'Name': 'Jellyfin Media Player',
            'MusicStreamingTranscodingBitrate': 1280000,
            'TimelineOffsetSeconds': 5,
            'TranscodingProfiles': [
                {'Type': 'Audio'},
                {
                    'Container': 'ts',
                    'Type': 'Video',
                    'Protocol': 'hls',
                    'AudioCodec': 'aac,mp3,ac3,opus,flac,vorbis',
                    'VideoCodec': 'h264,h265,hevc,mpeg4,mpeg2video',
                    'MaxAudioChannels': '6'
                },
                {'Container': 'jpeg', 'Type': 'Photo'}
            ],
            'DirectPlayProfiles': [{'Type': 'Video'}, {'Type': 'Audio'}, {'Type': 'Photo'}],
            'ResponseProfiles': [],
            'ContainerProfiles': [],
            'CodecProfiles': [],
            'SubtitleProfiles': [
                {'Format': 'srt', 'Method': 'External'},
                {'Format': 'srt', 'Method': 'Embed'},
                {'Format': 'ass', 'Method': 'External'},
                {'Format': 'ass', 'Method': 'Embed'},
                {'Format': 'sub', 'Method': 'Embed'},
                {'Format': 'sub', 'Method': 'External'},
                {'Format': 'ssa', 'Method': 'Embed'},
                {'Format': 'ssa', 'Method': 'External'},
                {'Format': 'smi', 'Method': 'Embed'},
                {'Format': 'smi', 'Method': 'External'},
                {'Format': 'pgssub', 'Method': 'Embed'},
                {'Format': 'dvdsub', 'Method': 'Embed'},
                {'Format': 'pgs', 'Method': 'Embed'}
            ]
        });
    }

    /**
     * @private
     */
    static getSupportedFeatures() {
        return ['PlaybackRate'];
    }

    supports(feature) {
        if (!this.#supportedFeatures) {
            this.#supportedFeatures = HtmlVideoPlayer.getSupportedFeatures();
        }

        return this.#supportedFeatures.includes(feature);
    }

    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        if (val != null) {
            this.ensureApi().then(() => {
                this.#api.player.seekTo(val);
            });
            return;
        }

        return this.#currentTime;
    }

    async currentTimeAsync() {
        await this.ensureApi();
        return await new Promise((resolve) => {
            this.#api.player.getPosition(resolve);
        });
    }

    onDuration = (duration) => {
        this.#duration = duration;
    };

    duration() {
        if (this.#duration) {
            return this.#duration;
        }

        return null;
    }

    canSetAudioStreamIndex() {
        return true;
    }

    static onPictureInPictureError(err) {
        console.error(`Picture in picture error: ${err}`);
    }

    setPictureInPictureEnabled() {}

    isPictureInPictureEnabled() {
        return false;
    }

    isAirPlayEnabled() {
        return false;
    }

    setAirPlayEnabled() {}

    setBrightness() {}

    getBrightness() {
        return 100;
    }

    seekable() {
        return Boolean(this.#duration);
    }

    async pause() {
        await this.ensureApi();
        this.#api.player.pause();
    }

    // This is a retry after error
    async resume() {
        await this.ensureApi();
        this.#paused = false;
        this.#api.player.play();
    }

    async unpause() {
        await this.ensureApi();
        this.#api.player.play();
    }

    paused() {
        return this.#paused;
    }

    async setPlaybackRate(value) {
        await this.ensureApi();
        this.#playRate = value;
        this.#api.player.setPlaybackRate(value * 1000);
    }

    getPlaybackRate() {
        return this.#playRate;
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
        this.#volume = val;
        if (save) {
            saveVolume((val || 100) / 100);
            Events.trigger(this, 'volumechange');
        }
        await this.ensureApi();
        this.#api.player.setVolume(val);
    }

    getVolume() {
        return this.#volume;
    }

    volumeUp() {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    async setMute(mute) {
        await this.ensureApi();
        this.#muted = mute;
        this.#api.player.setMuted(mute);
    }

    isMuted() {
        return this.#muted;
    }

    setAspectRatio() {
    }

    getAspectRatio() {
        return this._currentAspectRatio || 'auto';
    }

    getSupportedAspectRatios() {
        return [{
            name: globalize.translate('Auto'),
            id: 'auto'
        }];
    }

    togglePictureInPicture() {
    }

    toggleAirPlay() {
    }

    getBufferedRanges() {
        return [];
    }

    getStats() {
        const playOptions = this._currentPlayOptions || [];
        const categories = [];

        if (!this._currentPlayOptions) {
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

        mediaCategory.stats.push({
            label: globalize.translate('LabelStreamType'),
            value: 'Video'
        });

        const videoCategory = {
            stats: [],
            type: 'video'
        };
        categories.push(videoCategory);

        const audioCategory = {
            stats: [],
            type: 'audio'
        };
        categories.push(audioCategory);

        return Promise.resolve({
            categories: categories
        });
    }
    }
/* eslint-enable indent */

export default HtmlVideoPlayer;
