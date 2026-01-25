import { escapeHtml } from '../../utils/html';
import { debounce } from '../../utils/lodashUtils';
import fullscreen from '../../utils/fullscreen';

import { useCustomSubtitles } from 'apps/stable/features/playback/utils/subtitleStyles';
import subtitleAppearanceHelper from '../../components/subtitlesettings/subtitleappearancehelper';
import { AppFeature } from '../../constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from '../../scripts/settings/userSettings';
import { MediaError } from '../../types/mediaError';

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
import { logger } from '../../utils/logger';

import {
    resolveUrl,
    tryRemoveElement,
    zoomIn,
    normalizeTrackEventText,
    getMediaStreamVideoTracks,
    getMediaStreamAudioTracks,
    getMediaStreamTextTracks,
    getTextTrackUrl,
    requireHlsPlayer,
    enableNativeTrackSupport
} from './indexModules';

const PRIMARY_TEXT_TRACK_INDEX = 0;
const SECONDARY_TEXT_TRACK_INDEX = 1;

declare const Hls: any;
declare const Windows: any;

export class HtmlVideoPlayer {
    name: string;
    type: any = PluginType.MediaPlayer;
    id: string = 'htmlvideoplayer';
    priority: number = 1;
    isLocalPlayer: boolean = true;
    isFetching: boolean = false;

    private videoDialog: HTMLDivElement | null = null;
    private subtitleTrackIndexToSetOnPlaying: number = -1;
    private secondarySubtitleTrackIndexToSetOnPlaying: number = -1;
    private audioTrackIndexToSetOnPlaying: number | null = null;
    private currentAssRenderer: any = null;
    private currentPgsRenderer: any = null;
    private customTrackIndex: number = -1;
    private customSecondaryTrackIndex: number = -1;
    private showTrackOffset: boolean = false;
    private currentTrackOffset: number = 0;
    private secondaryTrackOffset: number = 0;
    private videoSubtitlesElem: HTMLElement | null = null;
    private videoSecondarySubtitlesElem: HTMLElement | null = null;
    private currentTrackEvents: any[] | null = null;
    private currentSecondaryTrackEvents: any[] | null = null;
    private supportedFeatures: string[] | null = null;
    private mediaElement: HTMLVideoElement | null = null;
    private fetchQueue: number = 0;
    private currentSrcString?: string;
    private started: boolean = false;
    private timeUpdated: boolean = false;
    private currentTimeValue: number | null = null;

    _flvPlayer: any;
    _hlsPlayer: any;
    _castPlayer: any;
    _currentPlayOptions: any;
    private lastProfile: any;
    private forcedFullscreen: boolean = false;

    constructor() {
        this.name = browser.edgeUwp ? 'Windows Video Player' : 'Html Video Player';
    }

    currentSrc() {
        return this.currentSrcString;
    }

    private incrementFetchQueue() {
        if (this.fetchQueue <= 0) {
            this.isFetching = true;
            Events.trigger(this, 'beginFetch');
        }
        this.fetchQueue++;
    }

    private decrementFetchQueue() {
        this.fetchQueue--;
        if (this.fetchQueue <= 0) {
            this.isFetching = false;
            Events.trigger(this, 'endFetch');
        }
    }

    private updateVideoUrl(streamInfo: any): Promise<void> {
        const { mediaSource, item } = streamInfo;
        if (
            mediaSource &&
            item &&
            !mediaSource.RunTimeTicks &&
            isHls(mediaSource) &&
            streamInfo.playMethod === 'Transcode' &&
            (browser.iOS || browser.osx)
        ) {
            const hlsPlaylistUrl = streamInfo.url.replace('master.m3u8', 'live.m3u8');
            loading.show();
            return ServerConnections.getApiClient(item.ServerId)
                .ajax({ type: 'GET', url: hlsPlaylistUrl })
                .then(
                    () => {
                        loading.hide();
                        streamInfo.url = hlsPlaylistUrl;
                    },
                    () => {
                        loading.hide();
                    }
                );
        }
        return Promise.resolve();
    }

    async play(options: any) {
        this.started = false;
        this.timeUpdated = false;
        this.currentTimeValue = null;
        if (options.resetSubtitleOffset !== false) this.resetSubtitleOffset();
        const elem = await this.createMediaElement(options);
        this.applyAspectRatio(options.aspectRatio || this.getAspectRatio());
        await this.updateVideoUrl(options);
        return this.setCurrentSrc(elem, options);
    }

    private setSrcWithFlvJs(elem: HTMLVideoElement, _options: any, url: string) {
        return import('flv.js').then(({ default: flvjs }: any) => {
            const flvPlayer = flvjs.createPlayer({ type: 'flv', url }, { seekType: 'range', lazyLoad: false });
            flvPlayer.attachMediaElement(elem);
            flvPlayer.load();
            this._flvPlayer = flvPlayer;
            this.currentSrcString = url;
            return flvPlayer.play();
        });
    }

    private setSrcWithHlsJs(elem: HTMLVideoElement, options: any, url: string) {
        return new Promise<void>((resolve, reject) => {
            requireHlsPlayer(async () => {
                let maxBufferLength = 30;
                if (
                    (browser.chrome || browser.edgeChromium || browser.firefox) &&
                    (playbackManager as any).getMaxStreamingBitrate(this) >= 25000000
                ) {
                    maxBufferLength = 6;
                }
                const includeCorsCredentials = await getIncludeCorsCredentials();
                const hls = new Hls({
                    startPosition: options.playerStartPositionTicks / 10000000,
                    manifestLoadingTimeOut: 20000,
                    maxBufferLength,
                    maxMaxBufferLength: maxBufferLength,
                    videoPreference: { preferHDR: true },
                    xhrSetup(xhr: any) {
                        xhr.withCredentials = includeCorsCredentials;
                    }
                });
                hls.loadSource(url);
                hls.attachMedia(elem);
                bindEventsToHlsPlayer(this, hls, elem, this.onError, resolve, reject);
                this._hlsPlayer = hls;
                this.currentSrcString = url;
            });
        });
    }

    private async setCurrentSrc(elem: HTMLVideoElement, options: any) {
        elem.removeEventListener('error', this.onError);
        let val = options.url;
        const seconds = (options.playerStartPositionTicks || 0) / 10000000;
        if (seconds) val += `#t=${seconds}`;

        destroyHlsPlayer(this);
        destroyFlvPlayer(this);
        destroyCastPlayer(this);

        let secondaryTrackValid = true;
        this.subtitleTrackIndexToSetOnPlaying = options.mediaSource.DefaultSubtitleStreamIndex ?? -1;
        if (this.subtitleTrackIndexToSetOnPlaying >= 0) {
            const initialSubtitleStream = options.mediaSource.MediaStreams[this.subtitleTrackIndexToSetOnPlaying];
            if (!initialSubtitleStream || initialSubtitleStream.DeliveryMethod === 'Encode') {
                this.subtitleTrackIndexToSetOnPlaying = -1;
                secondaryTrackValid = false;
            }
            if (
                initialSubtitleStream &&
                !(playbackManager as any).trackHasSecondarySubtitleSupport(initialSubtitleStream, this)
            ) {
                secondaryTrackValid = false;
            }
        } else {
            secondaryTrackValid = false;
        }

        this.audioTrackIndexToSetOnPlaying =
            options.playMethod === 'Transcode' ? null : options.mediaSource.DefaultAudioStreamIndex;
        this._currentPlayOptions = options;

        if (secondaryTrackValid) {
            this.secondarySubtitleTrackIndexToSetOnPlaying =
                options.mediaSource.DefaultSecondarySubtitleStreamIndex ?? -1;
            if (this.secondarySubtitleTrackIndexToSetOnPlaying >= 0) {
                const initialSecondarySubtitleStream =
                    options.mediaSource.MediaStreams[this.secondarySubtitleTrackIndexToSetOnPlaying];
                if (
                    !initialSecondarySubtitleStream ||
                    !(playbackManager as any).trackHasSecondarySubtitleSupport(initialSecondarySubtitleStream, this)
                ) {
                    this.secondarySubtitleTrackIndexToSetOnPlaying = -1;
                }
            }
        } else {
            this.secondarySubtitleTrackIndexToSetOnPlaying = -1;
        }

        const crossOrigin = getCrossOriginValue(options.mediaSource);
        if (crossOrigin) elem.crossOrigin = crossOrigin;

        if (enableHlsJsPlayerForCodecs(options.mediaSource, 'Video') && isHls(options.mediaSource)) {
            return this.setSrcWithHlsJs(elem, options, val);
        } else if (options.playMethod !== 'Transcode' && options.mediaSource.Container?.toUpperCase() === 'FLV') {
            return this.setSrcWithFlvJs(elem, options, val);
        } else {
            elem.autoplay = true;
            const includeCorsCredentials = await getIncludeCorsCredentials();
            if (includeCorsCredentials) elem.crossOrigin = 'use-credentials';
            return applySrc(elem, val, options).then(() => {
                this.currentSrcString = val;
                return playWithPromise(elem, this.onError);
            });
        }
    }

    setSubtitleStreamIndex(index: number) {
        this.setCurrentTrackElement(index, PRIMARY_TEXT_TRACK_INDEX);
    }
    setSecondarySubtitleStreamIndex(index: number) {
        this.setCurrentTrackElement(index, SECONDARY_TEXT_TRACK_INDEX);
    }

    resetSubtitleOffset() {
        this.currentTrackOffset = 0;
        this.secondaryTrackOffset = 0;
        this.showTrackOffset = false;
    }

    enableShowingSubtitleOffset() {
        this.showTrackOffset = true;
    }
    disableShowingSubtitleOffset() {
        this.showTrackOffset = false;
    }
    isShowingSubtitleOffsetEnabled() {
        return this.showTrackOffset;
    }

    private getTextTracks() {
        return this.mediaElement ? Array.from(this.mediaElement.textTracks).filter(t => t.mode === 'showing') : null;
    }

    setSubtitleOffset = debounce((offset: string) => {
        const offsetValue = parseFloat(offset);
        if (this.currentAssRenderer) {
            this.updateCurrentTrackOffset(offsetValue);
            this.currentAssRenderer.timeOffset =
                (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + offsetValue;
        } else if (this.currentPgsRenderer) {
            this.updateCurrentTrackOffset(offsetValue);
            this.currentPgsRenderer.timeOffset =
                (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + offsetValue;
        } else {
            const tracks = this.getTextTracks();
            if (tracks?.length) {
                tracks.forEach((t, i) => this.setTextTrackSubtitleOffset(t, offsetValue, i));
            } else if (this.currentTrackEvents || this.currentSecondaryTrackEvents) {
                if (this.currentTrackEvents)
                    this.setTrackEventsSubtitleOffset(this.currentTrackEvents, offsetValue, PRIMARY_TEXT_TRACK_INDEX);
                if (this.currentSecondaryTrackEvents)
                    this.setTrackEventsSubtitleOffset(
                        this.currentSecondaryTrackEvents,
                        offsetValue,
                        SECONDARY_TEXT_TRACK_INDEX
                    );
            }
        }
    }, 100);

    private updateCurrentTrackOffset(offsetValue: number, currentTrackIndex = PRIMARY_TEXT_TRACK_INDEX) {
        let offsetToCompare = this.isSecondaryTrack(currentTrackIndex)
            ? this.secondaryTrackOffset
            : this.currentTrackOffset;
        let relativeOffset = offsetValue - offsetToCompare;
        if (this.isSecondaryTrack(currentTrackIndex)) this.secondaryTrackOffset = offsetValue;
        else this.currentTrackOffset = offsetValue;
        return relativeOffset;
    }

    private setTextTrackSubtitleOffset(currentTrack: TextTrack, offsetValue: number, currentTrackIndex: number) {
        if (currentTrack.cues) {
            const relativeOffset = this.updateCurrentTrackOffset(offsetValue, currentTrackIndex);
            if (relativeOffset === 0) return;
            if (browser.firefox && currentTrack.activeCues) currentTrack.mode = 'hidden';
            Array.from(currentTrack.cues).forEach(cue => {
                cue.startTime -= relativeOffset;
                cue.endTime -= relativeOffset;
            });
            if (browser.firefox && currentTrack.activeCues) {
                currentTrack.mode = 'disabled';
                setTimeout(() => {
                    currentTrack.mode = 'showing';
                }, 0);
            }
        }
    }

    private setTrackEventsSubtitleOffset(trackEvents: any[], offsetValue: number, currentTrackIndex: number) {
        const relativeOffset = this.updateCurrentTrackOffset(offsetValue, currentTrackIndex) * 1e7;
        if (relativeOffset === 0) return;
        trackEvents.forEach(e => {
            e.StartPositionTicks -= relativeOffset;
            e.EndPositionTicks -= relativeOffset;
        });
    }

    getSubtitleOffset() {
        return this.currentTrackOffset;
    }
    isPrimaryTrack(idx: number) {
        return idx === PRIMARY_TEXT_TRACK_INDEX;
    }
    isSecondaryTrack(idx: number) {
        return idx === SECONDARY_TEXT_TRACK_INDEX;
    }

    private isAudioStreamSupported(stream: any, deviceProfile: any, container: string) {
        const codec = (stream.Codec || '').toLowerCase();
        if (!codec || !deviceProfile) return true;
        return (deviceProfile.DirectPlayProfiles || []).some(
            (p: any) =>
                p.Type === 'Video' &&
                includesAny((p.Container || '').toLowerCase(), container) &&
                includesAny((p.AudioCodec || '').toLowerCase(), codec)
        );
    }

    private getSupportedAudioStreams() {
        const mediaSource = this._currentPlayOptions.mediaSource;
        const container = mediaSource.Container.toLowerCase();
        return getMediaStreamAudioTracks(mediaSource).filter(s =>
            this.isAudioStreamSupported(s, this.lastProfile, container)
        );
    }

    setAudioStreamIndex(index: number) {
        const streams = this.getSupportedAudioStreams();
        if (streams.length < 2 || !this.mediaElement) return;
        const audioIndex = streams.findIndex(s => s.Index === index);
        if (audioIndex === -1) return;
        const elemTracks = (this.mediaElement as any).audioTracks || [];
        Array.from(elemTracks).forEach((t: any, i) => {
            t.enabled = i === audioIndex;
        });
    }

    stop(destroyPlayer: boolean): Promise<void> {
        if (this.mediaElement) {
            if (this.currentSrcString) this.mediaElement.pause();
            onEndedInternal(this, this.mediaElement, this.onError);
        }
        this.destroyCustomTrack(this.mediaElement);
        if (destroyPlayer) this.destroy();
        return Promise.resolve();
    }

    destroy() {
        (this.setSubtitleOffset as any).cancel();
        destroyHlsPlayer(this);
        destroyFlvPlayer(this);
        setBackdropTransparency(TRANSPARENCY_LEVEL.None);
        document.body.classList.remove('hide-scroll');
        if (this.mediaElement) {
            const el = this.mediaElement;
            this.mediaElement = null;
            this.destroyCustomTrack(el);
            el.removeEventListener('timeupdate', this.onTimeUpdate);
            el.removeEventListener('ended', this.onEnded);
            el.removeEventListener('volumechange', this.onVolumeChange);
            el.removeEventListener('pause', this.onPause);
            el.removeEventListener('playing', this.onPlaying);
            el.removeEventListener('play', this.onPlay);
            el.removeEventListener('click', this.onClick);
            el.removeEventListener('dblclick', this.onDblClick);
            el.removeEventListener('waiting', this.onWaiting);
            el.removeEventListener('error', this.onError);
            resetSrc(el);
            el.parentNode?.removeChild(el);
        }
        if (this.videoDialog) {
            this.videoDialog.parentNode?.removeChild(this.videoDialog);
            this.videoDialog = null;
        }
        if (fullscreen.isEnabled) fullscreen.exit();
    }

    onEnded = (e: any) => {
        this.destroyCustomTrack(e.target);
        onEndedInternal(this, e.target, this.onError);
    };

    onTimeUpdate = (e: any) => {
        const elem = e.target as HTMLVideoElement;
        if (elem.currentTime && !this.timeUpdated) {
            this.timeUpdated = true;
            this.ensureValidVideo(elem);
        }
        this.currentTimeValue = elem.currentTime;
        if (this._currentPlayOptions) {
            this.updateSubtitleText(
                elem.currentTime * 1000 + (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000
            );
        }
        Events.trigger(this, 'timeupdate');
    };

    onVolumeChange = (e: any) => {
        saveVolume(e.target.volume);
        Events.trigger(this, 'volumechange');
    };

    private onStartedAndNavigatedToOsd() {
        this.setCurrentTrackElement(this.subtitleTrackIndexToSetOnPlaying, PRIMARY_TEXT_TRACK_INDEX);
        if (this.audioTrackIndexToSetOnPlaying != null && this.canSetAudioStreamIndex()) {
            this.setAudioStreamIndex(this.audioTrackIndexToSetOnPlaying);
        }
        if (this.secondarySubtitleTrackIndexToSetOnPlaying >= 0) {
            setTimeout(() => this.setSecondarySubtitleStreamIndex(this.secondarySubtitleTrackIndexToSetOnPlaying), 0);
        }
    }

    onPlaying = (e: any) => {
        if (!this.started) {
            this.started = true;
            e.target.removeAttribute('controls');
            loading.hide();
            seekOnPlaybackStart(this, e.target, this._currentPlayOptions.playerStartPositionTicks, () => {
                if (this.currentAssRenderer) {
                    this.currentAssRenderer.timeOffset =
                        (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000 + this.currentTrackOffset;
                    this.currentAssRenderer.resize();
                    this.currentAssRenderer.resetRenderAheadCache(false);
                }
            });
            if (this._currentPlayOptions.fullscreen) {
                appRouter.showVideoOsd().then(() => {
                    this.videoDialog?.classList.remove('videoPlayerContainer-onTop');
                    this.onStartedAndNavigatedToOsd();
                });
            } else {
                setBackdropTransparency(TRANSPARENCY_LEVEL.Backdrop);
                this.videoDialog?.classList.remove('videoPlayerContainer-onTop');
                this.onStartedAndNavigatedToOsd();
            }
        }
        Events.trigger(this, 'playing');
    };

    onPlay = () => Events.trigger(this, 'unpause');
    onClick = () => Events.trigger(this, 'click');
    onDblClick = () => Events.trigger(this, 'dblclick');
    onPause = () => Events.trigger(this, 'pause');
    onWaiting = () => Events.trigger(this, 'waiting');

    onError = (e: any) => {
        const elem = e.target as HTMLVideoElement;
        const code = elem.error?.code || 0;
        if (code === 1) return;
        let type = MediaError.MEDIA_NOT_SUPPORTED;
        if (code === 2) type = MediaError.NETWORK_ERROR;
        else if (code === 3) {
            if (this._hlsPlayer) {
                handleHlsJsMediaError(this);
                return;
            }
            type = MediaError.MEDIA_DECODE_ERROR;
        }
        onErrorInternal(this, type);
    };

    private ensureValidVideo(elem: HTMLVideoElement) {
        if (elem === this.mediaElement && elem.videoWidth === 0 && elem.videoHeight === 0) {
            if (!this._currentPlayOptions?.mediaSource || this._currentPlayOptions.mediaSource.RunTimeTicks) {
                onErrorInternal(this, MediaError.NO_MEDIA_ERROR);
            }
        }
    }

    private destroyCustomTrack(videoElement: HTMLVideoElement | null, targetTrackIndex?: number) {
        if (this.isPrimaryTrack(targetTrackIndex ?? -1)) {
            if (this.videoSubtitlesElem) {
                tryRemoveElement(this.videoSubtitlesElem);
                this.videoSubtitlesElem = null;
            }
        } else if (this.isSecondaryTrack(targetTrackIndex ?? -1)) {
            if (this.videoSecondarySubtitlesElem) {
                tryRemoveElement(this.videoSecondarySubtitlesElem);
                this.videoSecondarySubtitlesElem = null;
            }
        } else if (this.videoSubtitlesElem) {
            const container = this.videoSubtitlesElem.parentNode as HTMLElement;
            if (container) tryRemoveElement(container);
            this.videoSubtitlesElem = null;
            this.videoSecondarySubtitlesElem = null;
        }

        if (videoElement) {
            const tracks = videoElement.textTracks || [];
            for (let i = 0; i < tracks.length; i++) {
                if (targetTrackIndex != null && i !== targetTrackIndex) continue;
                if (tracks[i].label.includes('manualTrack')) tracks[i].mode = 'disabled';
            }
        }

        if (this.isPrimaryTrack(targetTrackIndex ?? -1)) {
            this.customTrackIndex = -1;
            this.currentTrackEvents = null;
        } else if (this.isSecondaryTrack(targetTrackIndex ?? -1)) {
            this.customSecondaryTrackIndex = -1;
            this.currentSecondaryTrackEvents = null;
        } else {
            this.customTrackIndex = -1;
            this.customSecondaryTrackIndex = -1;
            this.currentTrackEvents = null;
            this.currentSecondaryTrackEvents = null;
        }

        this.currentAssRenderer?.dispose();
        this.currentAssRenderer = null;
        this.currentPgsRenderer?.dispose();
        this.currentPgsRenderer = null;
    }

    private async fetchSubtitles(track: any, item: any) {
        if (window.Windows && itemHelper.isLocalItem(item)) {
            const storageFile = await Windows.Storage.StorageFile.getFileFromPathAsync(track.Path);
            const text = await Windows.Storage.FileIO.readTextAsync(storageFile);
            return JSON.parse(text);
        }
        this.incrementFetchQueue();
        try {
            const res = await fetch(getTextTrackUrl(track, item, '.js'));
            if (!res.ok) throw new Error('Fetch failed');
            return res.json();
        } finally {
            this.decrementFetchQueue();
        }
    }

    private setCurrentTrackElement(streamIndex: number, targetTextTrackIndex: number) {
        const tracks = getMediaStreamTextTracks(this._currentPlayOptions.mediaSource);
        let track = streamIndex === -1 ? null : tracks.find(t => t.Index === streamIndex);

        // Simplified session handling for transcode/direct check
        const isDirect = this._currentPlayOptions.playMethod === 'DirectPlay';
        const p =
            !isDirect && appSettings.alwaysBurnInSubtitleWhenTranscoding()
                ? ServerConnections.getApiClient(this._currentPlayOptions.item.ServerId)
                      .getSessions({ deviceId: ServerConnections.currentApiClient().deviceId() })
                      .then((s: any) => s[0] || {})
                : Promise.resolve({});

        p.then((s: any) => {
            if (!s.TranscodingInfo || s.TranscodingInfo.IsVideoDirect) {
                tracks.forEach(t => {
                    t.DeliveryMethod = t.realDeliveryMethod ?? t.DeliveryMethod;
                });
                this.setTrackForDisplay(this.mediaElement!, track, targetTextTrackIndex);
                if (enableNativeTrackSupport(this._currentPlayOptions.mediaSource, track)) {
                    if (streamIndex !== -1) this.setCueAppearance();
                }
            } else {
                tracks.forEach(t => {
                    t.realDeliveryMethod = t.DeliveryMethod;
                    t.DeliveryMethod = 'Encode';
                });
                this.setTrackForDisplay(this.mediaElement!, null, -1);
            }
        });
    }

    private setTrackForDisplay(videoElement: HTMLVideoElement, track: any, targetTextTrackIndex: number) {
        if (!track) {
            this.destroyCustomTrack(
                videoElement,
                this.isSecondaryTrack(targetTextTrackIndex) ? targetTextTrackIndex : undefined
            );
            return;
        }
        if (
            (this.isSecondaryTrack(targetTextTrackIndex) ? this.customSecondaryTrackIndex : this.customTrackIndex) ===
            track.Index
        )
            return;
        this.resetSubtitleOffset();
        this.destroyCustomTrack(videoElement, targetTextTrackIndex);
        if (this.isSecondaryTrack(targetTextTrackIndex)) this.customSecondaryTrackIndex = track.Index;
        else this.customTrackIndex = track.Index;
        this.renderTracksEvents(videoElement, track, this._currentPlayOptions.item, targetTextTrackIndex);
    }

    private renderTracksEvents(videoElement: HTMLVideoElement, track: any, item: any, targetTextTrackIndex: number) {
        if (!itemHelper.isLocalItem(item) || track.IsExternal) {
            const fmt = (track.Codec || '').toLowerCase();
            if (fmt === 'ssa' || fmt === 'ass') {
                this.renderSsaAss(videoElement, track, item);
                return;
            }
            if (fmt === 'pgssub') {
                this.renderPgs(videoElement, track, item);
                return;
            }
            if (useCustomSubtitles(userSettings)) {
                this.renderSubtitlesWithCustomElement(videoElement, track, item, targetTextTrackIndex);
                return;
            }
        }

        let trackElement: TextTrack;
        if (
            videoElement.textTracks &&
            videoElement.textTracks.length > (this.isSecondaryTrack(targetTextTrackIndex) ? 1 : 0)
        ) {
            trackElement = videoElement.textTracks[targetTextTrackIndex];
            try {
                trackElement.mode = 'showing';
                while (trackElement.cues?.length) trackElement.removeCue(trackElement.cues[0]);
            } catch (e) {}
            trackElement.mode = 'disabled';
        } else {
            trackElement = videoElement.addTextTrack('subtitles', 'manualTrack', 'und');
        }

        this.fetchSubtitles(track, item).then(data => {
            const cueLine = parseInt(userSettings.getSubtitleAppearanceSettings().verticalPosition, 10);
            for (const ev of data.TrackEvents) {
                const TrackCue = (window as any).VTTCue || (window as any).TextTrackCue;
                const text = normalizeTrackEventText(ev.Text, false);
                const cue = new TrackCue(ev.StartPositionTicks / 10000000, ev.EndPositionTicks / 10000000, text);
                if (cue.line === 'auto') {
                    if (cueLine < 0) cue.line = cueLine - (text.match(/\n/g) || []).length;
                    else cue.line = cueLine;
                }
                trackElement.addCue(cue);
            }
            trackElement.mode = 'showing';
        });
    }

    private renderSsaAss(videoElement: HTMLVideoElement, track: any, item: any) {
        const supportedFonts = [
            'application/vnd.ms-opentype',
            'application/x-truetype-font',
            'font/otf',
            'font/ttf',
            'font/woff',
            'font/woff2'
        ];
        const availableFonts: string[] = [];
        const apiClient = ServerConnections.getApiClient(item);
        (this._currentPlayOptions.mediaSource.MediaAttachments || []).forEach((i: any) => {
            if (supportedFonts.includes(i.MimeType)) availableFonts.push(apiClient.getUrl(i.DeliveryUrl));
        });

        import('@jellyfin/libass-wasm').then(({ default: SubtitlesOctopus }: any) => {
            const videoStream = getMediaStreamVideoTracks(this._currentPlayOptions.mediaSource)[0];
            const options = {
                video: videoElement,
                subUrl: getTextTrackUrl(track, item),
                fonts: availableFonts,
                workerUrl: `${appRouter.baseUrl()}/libraries/subtitles-octopus-worker.js`,
                legacyWorkerUrl: `${appRouter.baseUrl()}/libraries/subtitles-octopus-worker-legacy.js`,
                onError: () => {
                    this.currentAssRenderer = null;
                    setTimeout(() => {
                        onErrorInternal(this, MediaError.ASS_RENDER_ERROR);
                    }, 0);
                },
                timeOffset: (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000,
                renderMode: 'wasm-blend',
                targetFps: videoStream?.ReferenceFrameRate || 24,
                renderAhead: 90
            };

            apiClient.getNamedConfiguration('encoding').then((config: any) => {
                if (config.EnableFallbackFont) {
                    apiClient
                        .getJSON(apiClient.getUrl('/FallbackFont/Fonts', { ApiKey: apiClient.accessToken() }))
                        .then((fontFiles: any[] = []) => {
                            fontFiles.forEach(f =>
                                availableFonts.push(
                                    apiClient.getUrl(`/FallbackFont/Fonts/${encodeURIComponent(f.Name)}`, {
                                        ApiKey: apiClient.accessToken()
                                    })
                                )
                            );
                            this.currentAssRenderer = new SubtitlesOctopus(options);
                        });
                } else this.currentAssRenderer = new SubtitlesOctopus(options);
            });
        });
    }

    private renderPgs(videoElement: HTMLVideoElement, track: any, item: any) {
        import('libpgs').then((libpgs: any) => {
            this.currentPgsRenderer = new libpgs.PgsRenderer({
                video: videoElement,
                subUrl: getTextTrackUrl(track, item),
                workerUrl: `${appRouter.baseUrl()}/libraries/libpgs.worker.js`,
                timeOffset: (this._currentPlayOptions.transcodingOffsetTicks || 0) / 10000000,
                aspectRatio: this.getAspectRatio() === 'auto' ? 'contain' : this.getAspectRatio()
            });
        });
    }

    private renderSubtitlesWithCustomElement(
        videoElement: HTMLVideoElement,
        track: any,
        item: any,
        targetTextTrackIndex: number
    ) {
        this.fetchSubtitles(track, item).then(data => {
            const pos = parseInt(userSettings.getSubtitleAppearanceSettings().verticalPosition, 10);
            if (!this.videoSubtitlesElem && !this.isSecondaryTrack(targetTextTrackIndex)) {
                let container = document.querySelector('.videoSubtitles') as HTMLElement;
                if (!container) {
                    container = document.createElement('div');
                    container.classList.add('videoSubtitles');
                }
                const inner = document.createElement('div');
                inner.classList.add('videoSubtitlesInner');
                container.appendChild(inner);
                this.videoSubtitlesElem = inner;
                this.setSubtitleAppearance(container, inner);
                videoElement.parentNode?.appendChild(container);
                this.currentTrackEvents = data.TrackEvents;
            } else if (!this.videoSecondarySubtitlesElem && this.isSecondaryTrack(targetTextTrackIndex)) {
                const container = document.querySelector('.videoSubtitles') as HTMLElement;
                if (!container) return;
                const inner = document.createElement('div');
                inner.classList.add('videoSecondarySubtitlesInner');
                if (pos < 0) container.insertBefore(inner, container.firstChild);
                else container.appendChild(inner);
                this.videoSecondarySubtitlesElem = inner;
                this.setSubtitleAppearance(container, inner);
                this.currentSecondaryTrackEvents = data.TrackEvents;
            }
        });
    }

    private setSubtitleAppearance(elem: HTMLElement, innerElem: HTMLElement) {
        subtitleAppearanceHelper.applyStyles(
            { text: innerElem, window: elem },
            userSettings.getSubtitleAppearanceSettings()
        );
    }

    private setCueAppearance() {
        const id = `${this.id}-cuestyle`;
        let style = document.querySelector(`#${id}`) as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            document.head.appendChild(style);
        }
        const app = subtitleAppearanceHelper.getStyles(userSettings.getSubtitleAppearanceSettings());
        style.innerHTML = `.htmlvideoplayer::cue { ${app.text.map(s => (s.value ? `${s.name}:${s.value}!important;` : '')).join('')} }`;
    }

    private updateSubtitleText(timeMs: number) {
        [
            { evs: this.currentTrackEvents, el: this.videoSubtitlesElem },
            { evs: this.currentSecondaryTrackEvents, el: this.videoSecondarySubtitlesElem }
        ].forEach(target => {
            if (target.evs && target.el) {
                const ticks = timeMs * 10000;
                const ev = target.evs.find(e => e.StartPositionTicks <= ticks && e.EndPositionTicks >= ticks);
                if (ev?.Text) {
                    target.el.innerHTML = escapeHtml(normalizeTrackEventText(ev.Text, true)).replace(/\n/g, '<br>');
                    target.el.classList.remove('hide');
                } else target.el.classList.add('hide');
            }
        });
    }

    private async createMediaElement(options: any): Promise<HTMLVideoElement> {
        let dlg = document.querySelector('.videoPlayerContainer') as HTMLDivElement;
        if (!dlg) {
            await import('./style.scss');
            if (options.fullscreen) loading.show();
            dlg = document.createElement('div');
            dlg.setAttribute('dir', 'ltr');
            dlg.classList.add('videoPlayerContainer');
            if (options.fullscreen) dlg.classList.add('videoPlayerContainer-onTop');

            const video = document.createElement('video');
            video.className = 'htmlvideoplayer';
            video.preload = browser.web0s ? 'auto' : 'metadata';
            video.autoplay = true;
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('playsinline', '');
            if (!safeAppHost.supports(AppFeature.HtmlVideoAutoplay)) video.controls = true;
            if (!safeAppHost.supports(AppFeature.PhysicalVolumeControl)) video.volume = getSavedVolume();

            video.addEventListener('timeupdate', this.onTimeUpdate);
            video.addEventListener('ended', this.onEnded);
            video.addEventListener('volumechange', this.onVolumeChange);
            video.addEventListener('pause', this.onPause);
            video.addEventListener('playing', this.onPlaying);
            video.addEventListener('play', this.onPlay);
            video.addEventListener('click', this.onClick);
            video.addEventListener('dblclick', this.onDblClick);
            video.addEventListener('waiting', this.onWaiting);
            if (options.backdropUrl) video.poster = options.backdropUrl;

            dlg.appendChild(video);
            document.body.insertBefore(dlg, document.body.firstChild);
            this.videoDialog = dlg;
            this.mediaElement = video;

            if (options.fullscreen) {
                document.body.classList.add('hide-scroll');
                if (!window.NativeShell && browser.web0s && fullscreen.isEnabled) {
                    fullscreen.request().then(() => {
                        this.forcedFullscreen = true;
                    });
                }
                if (!browser.slow && browser.supportsCssAnimation) await zoomIn(dlg);
            }
            return video;
        }
        if (options.fullscreen) {
            document.body.classList.add('hide-scroll');
            if (!this.forcedFullscreen && !window.NativeShell && browser.web0s && fullscreen.isEnabled) {
                fullscreen.request().then(() => {
                    this.forcedFullscreen = true;
                });
            }
        }
        const video = dlg.querySelector('video') as HTMLVideoElement;
        if (options.backdropUrl) video.poster = options.backdropUrl;
        return video;
    }

    canPlayMediaType(type: string) {
        return (type || '').toLowerCase() === 'video';
    }
    supportsPlayMethod(method: string, item: any) {
        return (appHost as any)?.supportsPlayMethod ? (appHost as any).supportsPlayMethod(method, item) : true;
    }

    getDeviceProfile(item: any, options: any) {
        return HtmlVideoPlayer.getDeviceProfileInternal(item, options).then((p: any) => {
            this.lastProfile = p;
            return p;
        });
    }

    static getDeviceProfileInternal(item: any, options: any) {
        return (appHost as any)?.getDeviceProfile
            ? (appHost as any).getDeviceProfile(item, options)
            : profileBuilder({});
    }

    supports(feature: string) {
        if (!this.supportedFeatures) {
            const list = ['SetBrightness', 'SetAspectRatio', 'SecondarySubtitles'];
            const v = document.createElement('video');
            if (document.pictureInPictureEnabled || (v as any).webkitSupportsPresentationMode?.('picture-in-picture'))
                list.push('PictureInPicture');
            if (browser.safari || browser.iOS) list.push('AirPlay');
            if (typeof v.playbackRate === 'number') list.push('PlaybackRate');
            this.supportedFeatures = list;
        }
        return this.supportedFeatures.includes(feature);
    }

    currentTime(val?: number) {
        if (!this.mediaElement) return;
        if (val != null) {
            this.mediaElement.currentTime = val / 1000;
            return;
        }
        return (this.currentTimeValue || this.mediaElement.currentTime || 0) * 1000;
    }

    duration() {
        return this.mediaElement && isValidDuration(this.mediaElement.duration)
            ? this.mediaElement.duration * 1000
            : null;
    }
    canSetAudioStreamIndex() {
        return this.mediaElement ? canPlaySecondaryAudio(this.mediaElement) : false;
    }

    setBrightness(val: number) {
        if (this.mediaElement) {
            const v = Math.min(Math.max(val, 0), 100);
            const css = Math.max(20, v) >= 100 ? 'none' : Math.max(20, v) / 100;
            this.mediaElement.style.filter = `brightness(${css})`;
            (this.mediaElement as any).brightnessValue = v;
            Events.trigger(this, 'brightnesschange');
        }
    }

    getBrightness() {
        return (this.mediaElement as any)?.brightnessValue ?? 100;
    }
    pause() {
        this.mediaElement?.pause();
    }
    unpause() {
        this.mediaElement?.play();
    }
    paused() {
        return this.mediaElement?.paused ?? false;
    }
    setPlaybackRate(v: number) {
        if (this.mediaElement) this.mediaElement.playbackRate = v;
    }
    getPlaybackRate() {
        return this.mediaElement?.playbackRate ?? 1.0;
    }
    setVolume(v: number) {
        if (this.mediaElement) this.mediaElement.volume = Math.pow(v / 100, 3);
    }
    getVolume() {
        return this.mediaElement ? Math.min(Math.round(Math.pow(this.mediaElement.volume, 1 / 3) * 100), 100) : 100;
    }
    setMute(m: boolean) {
        if (this.mediaElement) this.mediaElement.muted = m;
    }
    isMuted() {
        return this.mediaElement?.muted ?? false;
    }

    private applyAspectRatio(val: string) {
        if (this.mediaElement) {
            if (val === 'auto') this.mediaElement.style.removeProperty('object-fit');
            else this.mediaElement.style.objectFit = val;
        }
        if (this.currentPgsRenderer) this.currentPgsRenderer.aspectRatio = val === 'auto' ? 'contain' : val;
    }

    setAspectRatio(val: string) {
        appSettings.aspectRatio(val);
        this.applyAspectRatio(val);
    }
    getAspectRatio() {
        return appSettings.aspectRatio() || 'auto';
    }

    getBufferedRanges() {
        return this.mediaElement ? getBufferedRanges(this, this.mediaElement) : [];
    }
}

export default HtmlVideoPlayer;
