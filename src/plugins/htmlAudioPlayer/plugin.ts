import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import * as htmlMediaHelper from '../../components/htmlMediaHelper';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { getIncludeCorsCredentials } from '../../scripts/settings/webSettings';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { MediaError } from 'types/mediaError';
import { createGainNode, initializeMasterAudio, masterAudioOutput, rampPlaybackGain } from 'components/audioEngine/master.logic';
import { xDuration, cancelCrossfadeTimeouts } from 'components/audioEngine/crossfader.logic';
import { synchronizeVolumeUI } from 'components/audioEngine/audioUtils';
import { scrollToActivePlaylistItem, triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';

/**
 * Type definitions for HtmlAudioPlayer plugin
 */

interface AudioCapabilities {
    webAudio: boolean;
    crossfade: boolean;
    normalization: boolean;
}

interface PlayOptions {
    url: string;
    item?: any;
    mediaSource: MediaSource;
    playerStartPositionTicks?: number;
}

interface MediaSource {
    RunTimeTicks?: number;
    Container?: string;
    IsRemote?: boolean;
    albumNormalizationGain?: number;
}

interface Item {
    Id?: string;
    NormalizationGain?: number;
    MediaType?: string;
}

interface AudioCapabilitiesService {
    getCapabilities(): Promise<AudioCapabilities>;
}

interface AudioErrorHandlerService {
    handleError(error: any): void;
    createError(type: string, severity: string, source: string, message: string, error?: Error, context?: any): any;
    AudioErrorType?: any;
    AudioErrorSeverity?: any;
}

interface AudioUtilsModule {
    normalizeVolume(volume: number, source?: string): number;
}

interface DocumentWithAirPlay extends Document {
    AirPlayEnabled?: boolean;
    AirplayElement?: Element;
    exitAirPLay?(): Promise<void>;
}

interface HTMLAudioElementWithAirPlay extends HTMLAudioElement {
    requestAirPlay?(): Promise<void>;
    webkitShowPlaybackTargetPicker?(): void;
}

// Lazy loaded modules
let audioCapabilities: AudioCapabilitiesService | null = null;
let audioErrorHandler: AudioErrorHandlerService | null = null;
let audioUtils: AudioUtilsModule | null = null;
let audioCapabilitiesLoaded = false;
let audioErrorHandlerLoaded = false;
let audioUtilsLoaded = false;

/**
 * Lazy loading functions for audio components
 */
async function loadAudioCapabilities(): Promise<AudioCapabilitiesService> {
    if (!audioCapabilitiesLoaded) {
        const module = await import('components/audioEngine/audioCapabilities');
        audioCapabilities = module.default;
        audioCapabilitiesLoaded = true;
    }
    return audioCapabilities!;
}

async function loadAudioErrorHandler(): Promise<AudioErrorHandlerService> {
    if (!audioErrorHandlerLoaded) {
        const module = await import('components/audioEngine/audioErrorHandler');
        audioErrorHandler = module.default;
        const { AudioErrorType, AudioErrorSeverity } = await import('components/audioEngine/audioErrorHandler');
        (audioErrorHandler as any).AudioErrorType = AudioErrorType;
        (audioErrorHandler as any).AudioErrorSeverity = AudioErrorSeverity;
        audioErrorHandlerLoaded = true;
    }
    return audioErrorHandler as AudioErrorHandlerService;
}

async function loadAudioUtils(): Promise<AudioUtilsModule> {
    if (!audioUtilsLoaded) {
        const module = await import('components/audioEngine/audioUtils');
        audioUtils = module as AudioUtilsModule;
        audioUtilsLoaded = true;
    }
    return audioUtils!;
}

function getDefaultProfile() {
    return profileBuilder({});
}

let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

async function fade(instance: HtmlAudioPlayer, elem: HTMLAudioElement, startingVolume: number): Promise<void> {
    if (instance._hasWebAudio && masterAudioOutput.mixerNode && xDuration.enabled) {
        return new Promise((resolve) => {
            instance._isFadingOut = true;

            setTimeout(() => {
                instance._isFadingOut = false;
                resolve();
            }, xDuration.fadeOut * 1000);
        });
    }

    const newVolume = Math.max(0, startingVolume - 0.15);
    console.debug('fading volume to ' + newVolume);
    elem.volume = newVolume;

    if (newVolume <= 0) {
        instance._isFadingOut = false;
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        cancelFadeTimeout();
        fadeTimeout = setTimeout(() => {
            fade(instance, elem, newVolume).then(resolve, reject);
        }, 100);
    });
}

function cancelFadeTimeout(): void {
    if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        fadeTimeout = null;
    }
    cancelCrossfadeTimeouts();
}

function supportsFade(): boolean {
    return !browser.tv;
}

function requireHlsPlayer(callback: () => void): void {
    import('hls.js/dist/hls.js').then(({ default: hls }) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.backBufferLength = 90;
        (window as any).Hls = hls;
        callback();
    });
}

async function enableHlsPlayer(url: string, item: Item | undefined, mediaSource: MediaSource, mediaType: string): Promise<void> {
    if (!htmlMediaHelper.enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType)) {
        return Promise.reject();
    }

    if (url.indexOf('.m3u8') !== -1) {
        return Promise.resolve();
    }

    const normalizedUrl = url.toLowerCase();
    if (normalizedUrl.includes('transcodingprotocol=hls')) {
        return Promise.resolve();
    }
    if (normalizedUrl.includes('transcodingprotocol=http')) {
        return Promise.reject();
    }

    const directAudioExtensions = ['.flac', '.mp3', '.wav', '.ogg', '.aac', '.m4a', '.webm', '.opus'];
    const isDirectAudioUrl = directAudioExtensions.some(ext => normalizedUrl.endsWith(ext));
    const isDirectAudioStream = normalizedUrl.includes('/audio/') && normalizedUrl.includes('/stream');
    const container = mediaSource?.Container?.toLowerCase() || '';
    const isDirectAudioContainer = ['flac', 'mp3', 'wav', 'ogg', 'aac', 'm4a', 'webm', 'opus'].includes(container);

    if (isDirectAudioUrl || isDirectAudioStream || isDirectAudioContainer) {
        return Promise.reject();
    }

    return new Promise((resolve, reject) => {
        import('../../utils/fetch').then((fetchHelper: any) => {
            fetchHelper.ajax({
                url: url,
                type: 'HEAD'
            }).then((response: Response) => {
                const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
                if (contentType === 'application/vnd.apple.mpegurl' || contentType === 'application/x-mpegurl') {
                    resolve();
                } else {
                    reject();
                }
            }, () => {
                reject();
            });
        });
    });
}

class HtmlAudioPlayer {
    name: string = 'Html Audio Player';
    type: PluginType = PluginType.MediaPlayer;
    id: string = 'htmlaudioplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    _hasWebAudio: boolean = false;
    _supportsCrossfade: boolean = false;
    _supportsNormalization: boolean = false;
    _mediaElement: HTMLAudioElement | null = null;
    _currentPlayOptions: PlayOptions | null = null;
    _currentSrc: string | null = null;
    _started: boolean = false;
    _timeUpdated: boolean = false;
    _currentTime: number | null = null;
    _isFadingOut: boolean = false;
    _hlsPlayer: any = null;

    constructor() {
        const self = this;

        loadAudioCapabilities().then(audioCaps => {
            return audioCaps.getCapabilities();
        }).then(capabilities => {
            self._hasWebAudio = capabilities.webAudio;
            self._supportsCrossfade = capabilities.crossfade;
            self._supportsNormalization = capabilities.normalization;
        }).catch(error => {
            loadAudioErrorHandler().then(audioErr => {
                audioErr.handleError(
                    audioErr.createError(
                        audioErr.AudioErrorType.CAPABILITY_DETECTION_FAILED,
                        audioErr.AudioErrorSeverity.MEDIUM,
                        'HtmlAudioPlayer',
                        'Failed to detect audio capabilities',
                        error,
                        {}
                    )
                );
            }).catch(() => {
                console.warn('Failed to load audio error handler, using minimal capabilities');
            });
            self._hasWebAudio = false;
            self._supportsCrossfade = false;
            self._supportsNormalization = false;
        });
    }

    play = async (options: PlayOptions): Promise<void> => {
        this._started = false;
        this._timeUpdated = false;
        this._currentTime = null;

        const elem = this.createMediaElement();
        this.addGainElement(elem);

        return this.setCurrentSrc(elem, options);
    };

    private setCurrentSrc = async (elem: HTMLAudioElement, options: PlayOptions): Promise<void> => {
        this.unBindEvents(elem);
        this.bindEvents(elem);

        let val = options.url;
        console.debug('playing url: ' + val);

        try {
            const userSettings = await import('../../scripts/settings/userSettings');
            let normalizationGain: number | undefined;
            if (userSettings.selectAudioNormalization() === 'TrackGain') {
                normalizationGain = options.item?.NormalizationGain
                    ?? options.mediaSource?.albumNormalizationGain;
            } else if (userSettings.selectAudioNormalization() === 'AlbumGain') {
                normalizationGain =
                    options.mediaSource?.albumNormalizationGain
                    ?? options.item?.NormalizationGain;
            }

            if (this._hasWebAudio && this._supportsNormalization) {
                rampPlaybackGain(normalizationGain);
            }
        } catch (err) {
            console.error('Failed to apply normalization gain', err);
        }

        const seconds = (options.playerStartPositionTicks || 0) / 10000000;
        if (seconds) {
            val += '#t=' + seconds;
        }

        htmlMediaHelper.destroyHlsPlayer(this);

        this._currentPlayOptions = options;

        const crossOrigin = htmlMediaHelper.getCrossOriginValue(options.mediaSource);
        if (crossOrigin) {
            elem.crossOrigin = crossOrigin;
        }

        try {
            await enableHlsPlayer(val, options.item, options.mediaSource, 'Audio');
            return new Promise<void>((resolve, reject) => {
                try {
                    requireHlsPlayer(async () => {
                        try {
                            const includeCorsCredentials = await getIncludeCorsCredentials();

                            const hls = new (window as any).Hls({
                                manifestLoadingTimeOut: 20000,
                                xhrSetup: (xhr: XMLHttpRequest) => {
                                    xhr.withCredentials = includeCorsCredentials;
                                }
                            });

                            htmlMediaHelper.bindEventsToHlsPlayer(this, hls, elem, this.onError, resolve, reject);

                            hls.loadSource(val);
                            hls.attachMedia(elem);

                            this._hlsPlayer = hls;
                            this._currentSrc = val;
                        } catch (error) {
                            console.error('Error setting up HLS player:', error);
                            reject(error);
                        }
                    });
                } catch (error) {
                    console.error('Error in HLS setup:', error);
                    reject(error);
                }
            });
        } catch (_error) {
            elem.autoplay = true;

            const includeCorsCredentials = await getIncludeCorsCredentials();
            if (includeCorsCredentials) {
                elem.crossOrigin = 'use-credentials';
            }

            await htmlMediaHelper.applySrc(elem, val, options);
            this._currentSrc = val;

            return htmlMediaHelper.playWithPromise(elem, this.onError);
        }
    };

    private bindEvents = (elem: HTMLAudioElement): void => {
        elem.addEventListener('timeupdate', this.onTimeUpdate);
        elem.addEventListener('ended', this.onEnded);
        elem.addEventListener('volumechange', this.onVolumeChange);
        elem.addEventListener('pause', this.onPause);
        elem.addEventListener('playing', this.onPlaying);
        elem.addEventListener('play', this.onPlay);
        elem.addEventListener('waiting', this.onWaiting);
    };

    private unBindEvents = (elem: HTMLAudioElement): void => {
        elem.removeEventListener('timeupdate', this.onTimeUpdate);
        elem.removeEventListener('ended', this.onEnded);
        elem.removeEventListener('volumechange', this.onVolumeChange);
        elem.removeEventListener('pause', this.onPause);
        elem.removeEventListener('playing', this.onPlaying);
        elem.removeEventListener('play', this.onPlay);
        elem.removeEventListener('waiting', this.onWaiting);
        elem.removeEventListener('error', this.onError);
    };

    stop = async (destroyPlayer?: boolean): Promise<void> => {
        cancelFadeTimeout();

        const elem = this._mediaElement;
        const src = this._currentSrc;

        if (elem && src) {
            if (!destroyPlayer || !supportsFade()) {
                elem.pause();
                htmlMediaHelper.onEndedInternal(this, elem, this.onError);

                if (destroyPlayer) {
                    this.destroy();
                }
                return Promise.resolve();
            }

            const originalVolume = elem.volume;

            await fade(this, elem, elem.volume);
            elem.pause();
            elem.volume = originalVolume;

            htmlMediaHelper.onEndedInternal(this, elem, this.onError);

            if (destroyPlayer) {
                this.destroy();
            }
        }
        return Promise.resolve();
    };

    destroy = (): void => {
        if (this._mediaElement) {
            this.unBindEvents(this._mediaElement);
            htmlMediaHelper.resetSrc(this._mediaElement);
        }
    };

    private createMediaElement = (): HTMLAudioElement => {
        let elem = this._mediaElement;

        if (elem && elem.id === 'currentMediaElement' && document.body.contains(elem)) {
            this._mediaElement = elem;
            this.addGainElement(elem);
            return elem;
        }

        elem = document.querySelector('.mediaPlayerAudio') as HTMLAudioElement;

        if (!elem) {
            elem = document.createElement('audio');
            elem.classList.add('mediaPlayerAudio');
            elem.id = 'currentMediaElement';
            elem.classList.add('hide');
            elem.preload = 'auto';

            document.body.appendChild(elem);
        }

        if (!xDuration.enabled) {
            const savedVolume = htmlMediaHelper.getSavedVolume();
            elem.volume = typeof savedVolume === 'number' ? savedVolume : 1;
        }

        this._mediaElement = elem;

        this.addGainElement(elem);

        return elem;
    };

    private addGainElement = (elem: HTMLAudioElement): void => {
        if (this._hasWebAudio) {
            try {
                initializeMasterAudio(this.destroy);
                createGainNode(elem);
            } catch (e) {
                loadAudioErrorHandler().then(audioErr => {
                    audioErr.handleError(
                        audioErr.createError(
                            audioErr.AudioErrorType.AUDIO_CONTEXT_FAILED,
                            audioErr.AudioErrorSeverity.HIGH,
                            'HtmlAudioPlayer',
                            'Web Audio API initialization failed',
                            e as Error,
                            { mediaElement: elem }
                        )
                    );
                });
            }
        }
    };

    private onEnded = (): void => {
        htmlMediaHelper.onEndedInternal(this, this._mediaElement!, this.onError);
    };

    private onTimeUpdate = (): void => {
        if (!this._isFadingOut && this._mediaElement) {
            const time = this._mediaElement.currentTime;
            this._currentTime = time;
            Events.trigger(this, 'timeupdate');
        }
    };

    private onVolumeChange = (): void => {
        if (!this._isFadingOut && this._mediaElement) {
            htmlMediaHelper.saveVolume(this._mediaElement.volume);
            Events.trigger(this, 'volumechange');
        }
    };

    private onPlaying = (e: Event): void => {
        if (!this._started) {
            this._started = true;
            this._mediaElement?.removeAttribute('controls');

            if (this._currentPlayOptions) {
                htmlMediaHelper.seekOnPlaybackStart(this, e.target as HTMLAudioElement, this._currentPlayOptions.playerStartPositionTicks);
            }
        }
        Events.trigger(this, 'playing');
        triggerSongInfoDisplay();
        scrollToActivePlaylistItem();

        const xDurationT0 = (xDuration as any).t0 || 0;
        const xDurationSustain = (xDuration as any).sustain || 0;
        const elapsedTime = performance.now() - xDurationT0;
        const gapSeconds = (elapsedTime / 1000) - xDurationSustain;
        if (elapsedTime < 10000) {
            console.log('crossfade audio gap in seconds: ', gapSeconds);
        }
    };

    private onPlay = (): void => {
        Events.trigger(this, 'unpause');
    };

    private onPause = (): void => {
        Events.trigger(this, 'pause');
    };

    private onWaiting = (): void => {
        Events.trigger(this, 'waiting');
    };

    private onError = (): void => {
        const errorCode = this._mediaElement?.error?.code || 0;
        const errorMessage = this._mediaElement?.error?.message || '';
        console.error('media element error: ' + errorCode.toString() + ' ' + errorMessage);

        let type: string | undefined;

        switch (errorCode) {
            case 1:
                return;
            case 2:
                type = MediaError.NETWORK_ERROR;
                break;
            case 3:
                if (this._hlsPlayer) {
                    htmlMediaHelper.handleHlsJsMediaError(this);
                    return;
                } else {
                    type = MediaError.MEDIA_DECODE_ERROR;
                }
                break;
            case 4:
                type = MediaError.MEDIA_NOT_SUPPORTED;
                break;
            default:
                return;
        }

        if (type) {
            htmlMediaHelper.onErrorInternal(this, type);
        }
    };

    currentSrc(): string | null {
        return this._currentSrc;
    }

    canPlayMediaType(mediaType: string): boolean {
        return (mediaType || '').toLowerCase() === 'audio';
    }

    getDeviceProfile(item: any): any {
        if (appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item);
        }

        return getDefaultProfile();
    }

    toggleAirPlay(): void {
        this.setAirPlayEnabled(!this.isAirPlayEnabled());
    }

    currentTime(val?: number): number | void {
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

    duration(): number | null {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const duration = mediaElement.duration;
            if (htmlMediaHelper.isValidDuration(duration)) {
                return duration * 1000;
            }
        }

        return null;
    }

    seekable(): boolean {
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
        return false;
    }

    getBufferedRanges(): any[] {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return htmlMediaHelper.getBufferedRanges(this, mediaElement);
        }

        return [];
    }

    pause(): void {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    resume(): void {
        this.unpause();
    }

    unpause(): void {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    paused(): boolean {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.paused;
        }

        return false;
    }

    setPlaybackRate(value: number): void {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.playbackRate = value;
        }
    }

    getPlaybackRate(): number | null {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.playbackRate;
        }
        return null;
    }

    setVolume(val: number): void {
        const audioCtx = masterAudioOutput.audioContext;
        const mediaElement = this._mediaElement;

        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
            const gainValue = (val / 100);

            masterAudioOutput.mixerNode.gain.setTargetAtTime(
                gainValue * masterAudioOutput.makeupGain,
                audioCtx.currentTime + 0.25,
                0.2
            );
            masterAudioOutput.volume = Math.max(val, 1);

            let muteButton = document.querySelector('.buttonMute') as HTMLElement;
            if (!muteButton) muteButton = document.querySelector('.muteButton') as HTMLElement;
            if (muteButton) {
                const muteButtonIcon = muteButton?.querySelector('.material-icons') as HTMLElement;
                muteButtonIcon?.classList.remove('volume_off', 'volume_up');
                muteButtonIcon?.classList.add('volume_up');
            }

            const volumeSlider = document.querySelector('.nowPlayingVolumeSlider') as any;
            if (volumeSlider && !volumeSlider.dragging) {
                volumeSlider.level = masterAudioOutput.volume;
            }
            masterAudioOutput.muted = false;

            synchronizeVolumeUI();
        } else if (mediaElement) {
            loadAudioUtils().then(utils => {
                mediaElement.volume = utils.normalizeVolume(val, 'user');
            }).catch(() => {
                mediaElement.volume = Math.max(0, Math.min(1, val / 100));
            });
        }
    }

    getVolume(): number | undefined {
        const audioCtx = masterAudioOutput.audioContext;

        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
            return Math.min(Math.round(masterAudioOutput.volume), 100);
        }

        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return Math.min(Math.round(Math.pow(mediaElement.volume, 1 / 3) * 100), 100);
        }
    }

    volumeUp(): void {
        const audioCtx = masterAudioOutput.audioContext;

        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
            const currentVolume = this.getVolume() || 0;
            masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                currentVolume + 0.05,
                audioCtx.currentTime + 0.3
            );
            return;
        }
        const currentVolume = this.getVolume() || 0;
        this.setVolume(Math.min(currentVolume + 2, 100));
    }

    volumeDown(): void {
        const audioCtx = masterAudioOutput.audioContext;

        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
            const currentVolume = this.getVolume() || 0;
            masterAudioOutput.mixerNode.gain.exponentialRampToValueAtTime(
                currentVolume - 0.05,
                audioCtx.currentTime + 0.3
            );
            return;
        }
        const currentVolume = this.getVolume() || 0;
        this.setVolume(Math.max(currentVolume - 2, 0));
    }

    setMute(mute: boolean): void {
        const audioCtx = masterAudioOutput.audioContext;
        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
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
            let muteButton = document.querySelector('.buttonMute') as HTMLElement;
            if (!muteButton) muteButton = document.querySelector('.muteButton') as HTMLElement;
            if (!muteButton) return;
            const muteButtonIcon = muteButton?.querySelector('.material-icons') as HTMLElement;
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

    isMuted(): boolean {
        const audioCtx = masterAudioOutput.audioContext;

        if (this._hasWebAudio && masterAudioOutput.mixerNode && audioCtx) {
            return masterAudioOutput.muted;
        }
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.muted;
        }
        return false;
    }

    isAirPlayEnabled(): boolean {
        const docWithAirPlay = document as unknown as DocumentWithAirPlay;
        if (docWithAirPlay.AirPlayEnabled) {
            return !!docWithAirPlay.AirplayElement;
        }
        return false;
    }

    setAirPlayEnabled(isEnabled: boolean): void {
        const mediaElement = this._mediaElement as unknown as HTMLAudioElementWithAirPlay;
        const docWithAirPlay = document as unknown as DocumentWithAirPlay;

        if (mediaElement) {
            if (docWithAirPlay.AirPlayEnabled) {
                if (isEnabled) {
                    mediaElement.requestAirPlay?.().catch((err) => {
                        console.error('Error requesting AirPlay', err);
                    });
                } else {
                    docWithAirPlay.exitAirPLay?.().catch((err) => {
                        console.error('Error exiting AirPlay', err);
                    });
                }
            } else {
                mediaElement.webkitShowPlaybackTargetPicker?.();
            }
        }
    }

    supports(feature: string): boolean {
        if (!supportedFeatures) {
            supportedFeatures = getSupportedFeatures();
        }

        return supportedFeatures.indexOf(feature) !== -1;
    }
}

let supportedFeatures: string[] | undefined;

function getSupportedFeatures(): string[] {
    const list: string[] = [];
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
