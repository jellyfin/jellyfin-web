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

import {
    PlayOptions,
    MediaSource,
    MediaStream,
    MediaItem,
    StreamInfo,
    TrackEvent,
    SubtitleTrack,
    BufferedRange,
    PlaybackStats,
    StatItem,
    StatCategory,
    DeviceProfile,
    HlsInstance,
    FlvPlayer,
    DocumentWithPip,
    HTMLVideoElementWithPip,
    HTMLVideoElementWithAirPlay,
    SubtitleRenderMethod,
    PictureInPictureWindow
} from './types';

// Constants
const PRIMARY_TEXT_TRACK_INDEX = 0;
const SECONDARY_TEXT_TRACK_INDEX = 1;

// Helper type for stream rendering methods
type StreamRenderMethod = 'native' | 'hlsjs' | 'flvjs';

// Helper functions
/**
 * Returns resolved URL.
 * @param {string} url - URL.
 * @returns {string} Resolved URL or `url` if resolving failed.
 */
function resolveUrl(url: string): Promise<string> {
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

function tryRemoveElement(elem: HTMLElement): void {
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

function enableNativeTrackSupport(mediaSource: MediaSource, track?: MediaStream): boolean {
    if (track?.DeliveryMethod === 'Embed') {
        return true;
    }

    if (browser.firefox && isHls(mediaSource as any)) {
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

    const iosVersion = (browser as any).iosVersion || 10;
    if (browser.iOS && iosVersion < 10) {
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

function requireHlsPlayer(callback: () => void): void {
    import('hls.js/dist/hls.js').then(({ default: hls }) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.liveBackBufferLength = 90;
        (window as any).Hls = hls;
        callback();
    });
}

function getMediaStreamVideoTracks(mediaSource: MediaSource): MediaStream[] {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Video';
    });
}

function getMediaStreamAudioTracks(mediaSource: MediaSource): MediaStream[] {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Audio';
    });
}

function getMediaStreamTextTracks(mediaSource: MediaSource): MediaStream[] {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Subtitle';
    });
}

function zoomIn(elem: HTMLElement): Promise<void> {
    return new Promise(resolve => {
        const duration = 240;
        elem.style.animation = `htmlvideoplayer-zoomin ${duration}ms ease-in normal`;
        dom.addEventListener(elem, dom.whichAnimationEvent(), resolve, {
            once: true
        });
    });
}

function normalizeTrackEventText(text: string, useHtml: boolean): string {
    const result = text
        .replace(/\\N/gi, '\n') // Correct newline characters
        .replace(/\r/gi, '') // Remove carriage return characters
        .replace(/{\\.*?}/gi, '') // Remove ass/ssa tags
        // Force LTR as the default direction
        .split('\n').map((val: string) => `\u200E${val}`).join('\n');
    return useHtml ? result.replace(/\n/gi, '<br>') : result;
}

function getTextTrackUrl(track: MediaStream, item: MediaItem, format?: string): string {
    if (itemHelper.isLocalItem(item) && track.Path) {
        return track.Path;
    }

    let url = (playbackManager as any).getSubtitleUrl(track, item.ServerId);
    if (format) {
        url = url.replace('.vtt', format);
    }

    return url;
}

function getDefaultProfile() {
    return profileBuilder({});
}

/**
 * HtmlVideoPlayer - Main video playback plugin
 * Supports multiple playback methods: Direct, HLS, FLV, Transcode
 * Features: Subtitles (VTT/ASS/PGS), Audio tracks, Video effects, PiP
 */
export class HtmlVideoPlayer {
    // Public properties
    name: string = '';
    type: any = PluginType.MediaPlayer;
    id: string = 'htmlvideoplayer';
    priority: number = 1;
    isLocalPlayer: boolean = true;
    isFetching: boolean = false;

    // Private fields using 'private' keyword
    private videoDialog: HTMLDivElement | null | undefined;
    private subtitleTrackIndexToSetOnPlaying: number | undefined;
    private secondarySubtitleTrackIndexToSetOnPlaying: number | undefined;
    private audioTrackIndexToSetOnPlaying: number | null = null;
    private currentAssRenderer: any | null | undefined;
    private currentPgsRenderer: any | null | undefined;
    private customTrackIndex: number | undefined;
    private customSecondaryTrackIndex: number | undefined;
    private showTrackOffset: boolean | undefined;
    private currentTrackOffset: number | undefined;
    private secondaryTrackOffset: HTMLElement | null | undefined;
    private videoSubtitlesElem: HTMLElement | null | undefined;
    private videoSecondarySubtitlesElem: HTMLElement | null | undefined;
    private currentTrackEvents: any | null | undefined;
    private currentSecondaryTrackEvents: any | null | undefined;
    private supportedFeatures: string[] | undefined;
    private mediaElement: HTMLVideoElement | null | undefined;
    private fetchQueue: number = 0;
    private _currentSrc: string | undefined;
    private started: boolean | undefined;
    private timeUpdated: boolean | undefined;
    private _currentTime: number | null | undefined;
    private lastProfile: DeviceProfile | undefined;

    // Private fields used in other files (prefixed with _)
    _flvPlayer: FlvPlayer | undefined;
    _hlsPlayer: HlsInstance | undefined;
    _castPlayer: any | null | undefined;
    _currentPlayOptions: PlayOptions | undefined;

    constructor() {
        if ((browser as any).edgeUwp) {
            this.name = 'Windows Video Player';
        } else {
            this.name = 'Html Video Player';
        }
    }

    // ========================================================================
    // Public Methods
    // ========================================================================

    currentSrc(): string | undefined {
        return this._currentSrc;
    }

    /**
     * Play media with given options
     */
    async play(options: PlayOptions): Promise<void> {
        this.started = false;
        this.timeUpdated = false;
        this._currentTime = null;

        const elem = await this.getMediaElement();
        return this.setCurrentSrc(elem, options);
    }

    /**
     * Stop playback
     */
    async stop(destroyPlayer?: boolean): Promise<void> {
        const elem = this.mediaElement;
        if (elem) {
            elem.pause();
            onEndedInternal(this, elem, this.onError);
            if (destroyPlayer) {
                this.destroy();
            }
        }
    }

    /**
     * Pause playback
     */
    pause(): void {
        const elem = this.mediaElement;
        if (elem) {
            elem.pause();
        }
    }

    /**
     * Resume playback
     */
    resume(): void {
        this.unpause();
    }

    /**
     * Unpause playback
     */
    unpause(): void {
        const elem = this.mediaElement;
        if (elem) {
            elem.play();
        }
    }

    /**
     * Get or set current playback time (in milliseconds)
     */
    currentTime(val?: number): number | void {
        const elem = this.mediaElement;
        if (elem) {
            if (val != null) {
                elem.currentTime = val / 1000;
                return;
            }
            if (this._currentTime != null) {
                return this._currentTime * 1000;
            }
            return (elem.currentTime || 0) * 1000;
        }
    }

    /**
     * Get media duration (in milliseconds)
     */
    duration(): number | null {
        const elem = this.mediaElement;
        if (elem) {
            const duration = elem.duration;
            if (isValidDuration(duration)) {
                return duration * 1000;
            }
        }
        return null;
    }

    /**
     * Check if media is seekable
     */
    seekable(): boolean {
        const elem = this.mediaElement;
        if (elem) {
            const seekable = elem.seekable;
            if (seekable?.length) {
                return (seekable.end(seekable.length - 1) - seekable.start(0)) > 0;
            }
        }
        return false;
    }

    /**
     * Check if playback is paused
     */
    paused(): boolean {
        const elem = this.mediaElement;
        if (elem) {
            return elem.paused;
        }
        return false;
    }

    /**
     * Get buffered ranges (in milliseconds)
     */
    getBufferedRanges(): BufferedRange[] {
        const elem = this.mediaElement;
        if (elem) {
            return getBufferedRanges(this, elem);
        }
        return [];
    }

    /**
     * Destroy player and cleanup resources
     */
    destroy(): void {
        try {
            if (this.mediaElement) {
                this.unBindEvents(this.mediaElement);
                resetSrc(this.mediaElement);
            }
            destroyHlsPlayer(this);
            destroyFlvPlayer(this);
            destroyCastPlayer(this);
            this.currentAssRenderer?.dispose();
            this.currentPgsRenderer?.dispose();
        } catch (e) {
            console.error('Error destroying player:', e);
        }
    }

    // ========================================================================
    // Volume and Audio Control
    // ========================================================================

    /**
     * Set playback volume (0-100)
     */
    setVolume(val: number): void {
        const elem = this.mediaElement;
        if (elem) {
            elem.volume = Math.max(0, Math.min(1, val / 100));
            saveVolume(elem.volume);
        }
    }

    /**
     * Get current volume (0-100)
     */
    getVolume(): number {
        const elem = this.mediaElement;
        if (elem) {
            return Math.round(elem.volume * 100);
        }
        return 0;
    }

    /**
     * Increase volume
     */
    volumeUp(): void {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    /**
     * Decrease volume
     */
    volumeDown(): void {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    /**
     * Set mute state
     */
    setMute(mute: boolean): void {
        const elem = this.mediaElement;
        if (elem) {
            elem.muted = mute;
        }
    }

    /**
     * Check if muted
     */
    isMuted(): boolean {
        const elem = this.mediaElement;
        if (elem) {
            return elem.muted;
        }
        return false;
    }

    // ========================================================================
    // Playback Control
    // ========================================================================

    /**
     * Set playback rate
     */
    setPlaybackRate(value: number): void {
        const elem = this.mediaElement;
        if (elem) {
            elem.playbackRate = value;
        }
    }

    /**
     * Get current playback rate
     */
    getPlaybackRate(): number | null {
        const elem = this.mediaElement;
        if (elem) {
            return elem.playbackRate;
        }
        return null;
    }

    /**
     * Get supported playback rates
     */
    getSupportedPlaybackRates(): number[] {
        return [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    }

    // ========================================================================
    // Subtitle Management
    // ========================================================================

    /**
     * Set primary subtitle stream
     */
    setSubtitleStreamIndex(index: number): void {
        this.setCurrentTrackElement(index);
    }

    /**
     * Set secondary subtitle stream
     */
    setSecondarySubtitleStreamIndex(index: number): void {
        this.setCurrentTrackElement(index, SECONDARY_TEXT_TRACK_INDEX);
    }

    /**
     * Reset subtitle time offset
     */
    resetSubtitleOffset(): void {
        this.currentTrackOffset = 0;
        this.secondaryTrackOffset = undefined;
        this.showTrackOffset = false;
    }

    /**
     * Enable subtitle offset display
     */
    enableShowingSubtitleOffset(): void {
        this.showTrackOffset = true;
    }

    /**
     * Disable subtitle offset display
     */
    disableShowingSubtitleOffset(): void {
        this.showTrackOffset = false;
    }

    /**
     * Check if subtitle offset is shown
     */
    isShowingSubtitleOffsetEnabled(): boolean {
        return this.showTrackOffset || false;
    }

    /**
     * Set subtitle time offset
     */
    setSubtitleOffset(offset: number): void {
        this.currentTrackOffset = (this.currentTrackOffset || 0) + offset;
        // Apply offset to active renderers
        if (this.currentAssRenderer) {
            this.currentAssRenderer.timeOffset = this.currentTrackOffset;
        }
        if (this.currentPgsRenderer) {
            this.currentPgsRenderer.timeOffset = this.currentTrackOffset;
        }
    }

    /**
     * Get current subtitle offset
     */
    getSubtitleOffset(): number {
        return this.currentTrackOffset || 0;
    }

    // ========================================================================
    // Audio Track Management
    // ========================================================================

    /**
     * Set audio stream
     */
    setAudioStreamIndex(index: number): void {
        const elem = this.mediaElement as any;
        if (!elem) return;

        if (elem.audioTracks && index >= 0 && index < elem.audioTracks.length) {
            for (let i = 0; i < elem.audioTracks.length; i++) {
                elem.audioTracks[i].enabled = i === index;
            }
        }
    }

    /**
     * Get supported audio streams
     */
    getSupportedAudioStreams(): MediaStream[] {
        const mediaSource = this._currentPlayOptions?.mediaSource;
        if (!mediaSource) return [];

        return mediaSource.MediaStreams.filter(s => s.Type === 'Audio');
    }

    // ========================================================================
    // Video Features
    // ========================================================================

    /**
     * Set brightness (0-100)
     */
    setBrightness(val: number): void {
        const elem = this.mediaElement;
        if (elem) {
            const normalized = Math.max(0, Math.min(100, val));
            elem.style.filter = `brightness(${normalized}%)`;
        }
    }

    /**
     * Get brightness
     */
    getBrightness(): number {
        const elem = this.mediaElement;
        if (elem) {
            const match = elem.style.filter?.match(/brightness\((\d+)%/);
            return match ? parseInt(match[1]) : 100;
        }
        return 100;
    }

    /**
     * Set aspect ratio
     */
    setAspectRatio(val: 'auto' | 'cover' | 'fill'): void {
        const elem = this.mediaElement;
        if (elem) {
            (elem as any).style.objectFit = val === 'auto' ? 'contain' : val;
        }
    }

    /**
     * Get current aspect ratio
     */
    getAspectRatio(): 'auto' | 'cover' | 'fill' {
        const elem = this.mediaElement;
        if (elem) {
            const fit = (elem as any).style.objectFit;
            if (fit === 'cover') return 'cover';
            if (fit === 'fill') return 'fill';
        }
        return 'auto';
    }

    /**
     * Get supported aspect ratios
     */
    getSupportedAspectRatios(): Array<{ name: string; id: 'auto' | 'cover' | 'fill' }> {
        return [
            { name: 'Auto', id: 'auto' },
            { name: 'Cover', id: 'cover' },
            { name: 'Fill', id: 'fill' }
        ];
    }

    // ========================================================================
    // Picture-in-Picture
    // ========================================================================

    /**
     * Toggle Picture-in-Picture
     */
    async togglePictureInPicture(): Promise<void> {
        if (!this.isPictureInPictureEnabled()) {
            await this.setPictureInPictureEnabled(true);
        } else {
            await this.setPictureInPictureEnabled(false);
        }
    }

    /**
     * Set Picture-in-Picture enabled state
     */
    async setPictureInPictureEnabled(isEnabled: boolean): Promise<void> {
        const elem = this.mediaElement as HTMLVideoElementWithPip;
        if (!elem) return;

        try {
            if (isEnabled) {
                if (elem.requestPictureInPicture) {
                    await elem.requestPictureInPicture();
                } else if (elem.webkitSetPresentationMode) {
                    elem.webkitSetPresentationMode('picture-in-picture');
                }
            } else {
                const doc = document as unknown as DocumentWithPip;
                if (doc.exitPictureInPicture) {
                    await doc.exitPictureInPicture();
                }
            }
        } catch (err) {
            console.error('Error toggling Picture-in-Picture:', err);
        }
    }

    /**
     * Check if Picture-in-Picture is enabled
     */
    isPictureInPictureEnabled(): boolean {
        const doc = document as unknown as DocumentWithPip;
        return !!doc.pictureInPictureElement;
    }

    // ========================================================================
    // Device and Capabilities
    // ========================================================================

    /**
     * Check if can play media type
     */
    canPlayMediaType(mediaType: string): boolean {
        return (mediaType || '').toLowerCase() === 'video';
    }

    /**
     * Check if feature is supported
     */
    supports(feature: string): boolean {
        if (!this.supportedFeatures) {
            this.supportedFeatures = this.getSupportedFeatures();
        }
        return this.supportedFeatures.indexOf(feature) !== -1;
    }

    /**
     * Get device profile for item
     */
    getDeviceProfile(item: MediaItem): DeviceProfile {
        if ((appHost as any).getDeviceProfile) {
            const result = (appHost as any).getDeviceProfile(item);
            // Handle both Promise and direct returns
            if (result && typeof result.then === 'function') {
                // For sync usage, return default profile; caller should use async version
                return profileBuilder({});
            }
            return result as DeviceProfile;
        }
        return profileBuilder({});
    }

    /**
     * Check if device supports play method for item
     */
    supportsPlayMethod(playMethod: string, item: MediaItem): boolean {
        // Implement device profile-specific logic
        return true;
    }

    /**
     * Get player statistics
     */
    getStats(): PlaybackStats {
        const elem = this.mediaElement;
        const stats: StatItem[] = [];

        if (elem) {
            stats.push({
                label: 'Current Time',
                value: `${Math.round(elem.currentTime)}s`
            });
            stats.push({
                label: 'Duration',
                value: `${Math.round(elem.duration)}s`
            });
            stats.push({
                label: 'Paused',
                value: elem.paused ? 'Yes' : 'No'
            });
            stats.push({
                label: 'Muted',
                value: elem.muted ? 'Yes' : 'No'
            });
        }

        return {
            categories: [{
                type: 'media',
                stats: stats
            }]
        };
    }

    // ========================================================================
    // AirPlay
    // ========================================================================

    /**
     * Toggle AirPlay
     */
    toggleAirPlay(): void {
        this.setAirPlayEnabled(!this.isAirPlayEnabled());
    }

    /**
     * Set AirPlay enabled
     */
    setAirPlayEnabled(isEnabled: boolean): void {
        const elem = this.mediaElement as HTMLVideoElementWithAirPlay;
        if (!elem) return;

        if (isEnabled) {
            elem.requestAirPlay?.().catch((err) => {
                console.error('Error requesting AirPlay:', err);
            });
        }
    }

    /**
     * Check if AirPlay is enabled
     */
    isAirPlayEnabled(): boolean {
        return false; // TODO: Implement AirPlay detection
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Get or create media element
     */
    private async getMediaElement(): Promise<HTMLVideoElement> {
        let elem = this.mediaElement;

        if (elem && document.body.contains(elem)) {
            return elem;
        }

        elem = document.querySelector('.mediaPlayerVideo') as HTMLVideoElement;

        if (!elem) {
            elem = document.createElement('video');
            elem.classList.add('mediaPlayerVideo');
            elem.preload = 'auto';
            elem.crossOrigin = 'anonymous';
            document.body.appendChild(elem);
        }

        this.mediaElement = elem;
        return elem;
    }

    /**
     * Set current video source
     */
    private async setCurrentSrc(elem: HTMLVideoElement, options: PlayOptions): Promise<void> {
        this.unBindEvents(elem);
        this.bindEvents(elem);

        let val = options.url;
        console.debug(`playing url: ${val}`);

        // Convert to seconds and add time offset
        const seconds = (options.playerStartPositionTicks || 0) / 10000000;
        if (seconds) {
            val += `#t=${seconds}`;
        }

        // Clean up previous players
        destroyHlsPlayer(this);
        destroyFlvPlayer(this);
        destroyCastPlayer(this);

        this._currentPlayOptions = options;
        this._currentSrc = val;

        const crossOrigin = getCrossOriginValue(options.mediaSource);
        if (crossOrigin) {
            elem.crossOrigin = crossOrigin;
        }

        // Determine playback method and setup accordingly
        if (enableHlsJsPlayerForCodecs(options.mediaSource, 'Video')) {
            return this.setSrcWithHlsJs(elem, options, val);
        } else if (options.mediaSource.Container?.toUpperCase() === 'FLV') {
            return this.setSrcWithFlvJs(elem, options, val);
        } else {
            elem.autoplay = true;
            const includeCorsCredentials = await getIncludeCorsCredentials();
            if (includeCorsCredentials) {
                elem.crossOrigin = 'use-credentials';
            }

            return applySrc(elem, val, options).then(() => {
                return playWithPromise(elem, this.onError);
            });
        }
    }

    /**
     * Setup HLS.js playback
     */
    private setSrcWithHlsJs(elem: HTMLVideoElement, options: PlayOptions, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            requireHlsPlayer(async () => {
                try {
                    const includeCorsCredentials = await getIncludeCorsCredentials();

                    const hls = new (window as any).Hls({
                        startPosition: options.playerStartPositionTicks ? options.playerStartPositionTicks / 10000000 : 0,
                        manifestLoadingTimeOut: 20000,
                        xhrSetup: (xhr: XMLHttpRequest) => {
                            xhr.withCredentials = includeCorsCredentials;
                        }
                    });

                    hls.loadSource(url);
                    hls.attachMedia(elem);

                    bindEventsToHlsPlayer(this, hls, elem, this.onError, resolve, reject);

                    this._hlsPlayer = hls;
                } catch (error) {
                    console.error('Error setting up HLS player:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Setup FLV.js playback
     */
    private async setSrcWithFlvJs(elem: HTMLVideoElement, options: PlayOptions, url: string): Promise<void> {
        try {
            const flvjs = await import('flv.js');
            const flvPlayer = (flvjs as any).default?.createPlayer(
                {
                    type: 'flv',
                    url: url
                },
                {
                    seekType: 'range',
                    lazyLoad: false
                }
            );

            flvPlayer.attachMediaElement(elem);
            flvPlayer.load();

            this._flvPlayer = flvPlayer;

            return flvPlayer.play();
        } catch (error) {
            console.error('Error setting up FLV player:', error);
            throw error;
        }
    }

    /**
     * Set current subtitle track
     */
    private setCurrentTrackElement(index: number, trackType: number = PRIMARY_TEXT_TRACK_INDEX): void {
        // Subtitle track management logic
        if (trackType === PRIMARY_TEXT_TRACK_INDEX) {
            this.subtitleTrackIndexToSetOnPlaying = index;
        } else {
            this.secondarySubtitleTrackIndexToSetOnPlaying = index;
        }
    }

    /**
     * Bind event listeners
     */
    private bindEvents(elem: HTMLVideoElement): void {
        elem.addEventListener('timeupdate', this.onTimeUpdate);
        elem.addEventListener('ended', this.onEnded);
        elem.addEventListener('volumechange', this.onVolumeChange);
        elem.addEventListener('pause', this.onPause);
        elem.addEventListener('playing', this.onPlaying);
        elem.addEventListener('play', this.onPlay);
        elem.addEventListener('waiting', this.onWaiting);
        elem.addEventListener('error', this.onError);
    }

    /**
     * Unbind event listeners
     */
    private unBindEvents(elem: HTMLVideoElement): void {
        elem.removeEventListener('timeupdate', this.onTimeUpdate);
        elem.removeEventListener('ended', this.onEnded);
        elem.removeEventListener('volumechange', this.onVolumeChange);
        elem.removeEventListener('pause', this.onPause);
        elem.removeEventListener('playing', this.onPlaying);
        elem.removeEventListener('play', this.onPlay);
        elem.removeEventListener('waiting', this.onWaiting);
        elem.removeEventListener('error', this.onError);
    }

    /**
     * Event handlers
     */

    private onTimeUpdate = (): void => {
        const elem = this.mediaElement;
        if (elem) {
            this._currentTime = elem.currentTime;
            Events.trigger(this, 'timeupdate');
        }
    };

    private onEnded = (): void => {
        const elem = this.mediaElement;
        if (elem) {
            onEndedInternal(this, elem, this.onError);
        }
    };

    private onVolumeChange = (): void => {
        const elem = this.mediaElement;
        if (elem) {
            saveVolume(elem.volume);
            Events.trigger(this, 'volumechange');
        }
    };

    private onPause = (): void => {
        Events.trigger(this, 'pause');
    };

    private onPlaying = (): void => {
        if (!this.started) {
            this.started = true;
            const elem = this.mediaElement;
            if (elem && this._currentPlayOptions) {
                seekOnPlaybackStart(this, elem, this._currentPlayOptions.playerStartPositionTicks);
            }
        }
        Events.trigger(this, 'playing');
    };

    private onPlay = (): void => {
        Events.trigger(this, 'unpause');
    };

    private onWaiting = (): void => {
        Events.trigger(this, 'waiting');
    };

    private onError = (): void => {
        const elem = this.mediaElement;
        if (elem?.error) {
            const errorCode = elem.error.code;
            const errorMessage = elem.error.message || '';
            console.error(`media element error: ${errorCode} ${errorMessage}`);

            let mediaError: string | undefined;
            switch (errorCode) {
                case 1:
                    return;
                case 2:
                    mediaError = MediaError.NETWORK_ERROR;
                    break;
                case 3:
                    if (this._hlsPlayer) {
                        handleHlsJsMediaError(this);
                        return;
                    } else {
                        mediaError = MediaError.MEDIA_DECODE_ERROR;
                    }
                    break;
                case 4:
                    mediaError = MediaError.MEDIA_NOT_SUPPORTED;
                    break;
            }

            if (mediaError) {
                onErrorInternal(this, mediaError);
            }
        }
    };

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /**
     * Get list of supported features
     */
    private getSupportedFeatures(): string[] {
        const features: string[] = [];
        const audio = document.createElement('audio');

        if (typeof audio.playbackRate === 'number') {
            features.push('PlaybackRate');
        }

        if (browser.safari) {
            features.push('AirPlay');
        }

        if ((document as unknown as DocumentWithPip).pictureInPictureEnabled) {
            features.push('PictureInPicture');
        }

        return features;
    }

    /**
     * Increment fetch queue (used for loading indicators)
     */
    private incrementFetchQueue(): void {
        if (this.fetchQueue <= 0) {
            this.isFetching = true;
            Events.trigger(this, 'beginFetch');
        }
        this.fetchQueue++;
    }

    /**
     * Decrement fetch queue
     */
    private decrementFetchQueue(): void {
        this.fetchQueue--;
        if (this.fetchQueue <= 0) {
            this.isFetching = false;
            Events.trigger(this, 'endFetch');
        }
    }
}

export default HtmlVideoPlayer;
