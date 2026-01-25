import appSettings from '../scripts/settings/appSettings';
import browser from '../scripts/browser';
import Events from '../utils/events';
import { MediaError } from 'types/mediaError';
import { logger } from '../utils/logger';

export interface MediaSource {
    Id?: string;
    Path?: string;
    Protocol?: string;
    Container?: string;
    RunTimeTicks?: number;
    IsRemote?: boolean;
    IsLocal?: boolean;
    MediaStreams: MediaStream[];
}

export interface MediaStream {
    Type: string;
    Codec?: string;
    [key: string]: any;
}

export interface PlayOptions {
    url: string;
    item?: any;
    mediaSource?: MediaSource;
    playerStartPositionTicks?: number;
    transcodingOffsetTicks?: number;
}

export interface PlayerInstance {
    _hlsPlayer?: any;
    _flvPlayer?: any;
    _castPlayer?: any;
    _mediaElement?: HTMLMediaElement | null;
    _currentSrc?: string | null;
    _currentPlayOptions?: PlayOptions | null;
    _currentTime?: number | null;
    destroyCustomTrack?: (elem: any) => void;
    [key: string]: any;
}

declare const Hls: any;

export function getSavedVolume(): number {
    const val = appSettings.get('volume');
    return val ? parseFloat(val) : 1;
}

export function saveVolume(value: number): void {
    if (value) {
        appSettings.set('volume', value.toString());
    }
}

export function getCrossOriginValue(mediaSource?: MediaSource): string | null {
    if (!mediaSource || mediaSource.IsRemote) {
        return null;
    }

    return 'anonymous';
}

function canPlayNativeHls(): boolean {
    const media = document.createElement('video');

    return !!(
        media.canPlayType('application/x-mpegURL').replace(/no/, '') ||
        media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')
    );
}

export function enableHlsJsPlayerForCodecs(mediaSource: MediaSource, mediaType: string): boolean {
    // Workaround for VP9 HLS support on desktop Safari
    if (!browser.iOS && browser.safari && mediaSource.MediaStreams.some(x => x.Codec === 'vp9')) {
        return true;
    }
    return enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType);
}

export function enableHlsJsPlayer(runTimeTicks: number | undefined, mediaType: string): boolean {
    if (typeof window === 'undefined' || window.MediaSource == null) {
        return false;
    }

    if (browser.iOS) {
        return false;
    }

    if ((browser as any).web0sVersion >= 4) {
        return true;
    }

    if (browser.tizen || browser.web0s) {
        return false;
    }

    if (canPlayNativeHls()) {
        if ((browser as any).android && (mediaType === 'Audio' || mediaType === 'Video')) {
            return true;
        }

        if (browser.chrome || (browser as any).edgeChromium || (browser as any).opera) {
            return true;
        }

        if (runTimeTicks) {
            return false;
        }
    }

    return true;
}

let recoverDecodingErrorDate: number;
let recoverSwapAudioCodecDate: number;

export function handleHlsJsMediaError(instance: PlayerInstance, reject?: (error?: any) => void): void {
    const hlsPlayer = instance._hlsPlayer;

    if (!hlsPlayer) {
        return;
    }

    let now = Date.now();

    if (typeof window !== 'undefined' && window.performance) {
        now = performance.now();
    }

    if (!recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3000) {
        recoverDecodingErrorDate = now;
        logger.debug('Trying to recover media error', { component: 'HtmlMediaHelper' });
        hlsPlayer.recoverMediaError();
    } else if (!recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3000) {
        recoverSwapAudioCodecDate = now;
        logger.debug('Trying to swap audio codec and recover media error', { component: 'HtmlMediaHelper' });
        hlsPlayer.swapAudioCodec();
        hlsPlayer.recoverMediaError();
    } else {
        logger.error('Cannot recover, last media error recovery failed', { component: 'HtmlMediaHelper' });

        if (reject) {
            reject();
        } else {
            onErrorInternal(instance, MediaError.FATAL_HLS_ERROR);
        }
    }
}

export function onErrorInternal(instance: PlayerInstance, type: string): void {
    if (instance.destroyCustomTrack) {
        instance.destroyCustomTrack(instance._mediaElement);
    }

    Events.trigger(instance as any, 'error', [{ type }]);
}

export function isValidDuration(duration: number): boolean {
    return !!(
        duration &&
        !isNaN(duration) &&
        duration !== Number.POSITIVE_INFINITY &&
        duration !== Number.NEGATIVE_INFINITY
    );
}

function setCurrentTimeIfNeeded(element: HTMLMediaElement, seconds: number): void {
    if (Math.abs((element.currentTime || 0) - seconds) >= 1) {
        element.currentTime = seconds;
    }
}

export function seekOnPlaybackStart(
    instance: PlayerInstance,
    element: HTMLMediaElement,
    ticks?: number,
    onMediaReady?: () => void
): void {
    const seconds = (ticks || 0) / 10000000;

    if (seconds) {
        if (element.duration >= seconds) {
            setCurrentTimeIfNeeded(element, seconds);
            if (onMediaReady) onMediaReady();
        } else {
            const events = ['durationchange', 'loadeddata', 'play', 'loadedmetadata'];
            const onMediaChange = function (e: Event) {
                if (element.currentTime === 0 && element.duration >= seconds) {
                    logger.debug(`Seeking to ${seconds} on ${e.type} event`, { component: 'HtmlMediaHelper' });
                    setCurrentTimeIfNeeded(element, seconds);
                    events.forEach(name => {
                        element.removeEventListener(name, onMediaChange);
                    });
                    if (onMediaReady) onMediaReady();
                }
            };
            events.forEach(name => {
                element.addEventListener(name, onMediaChange);
            });
        }
    }
}

export function applySrc(elem: HTMLMediaElement, src: string, options: PlayOptions): Promise<void> {
    const windowAny = window as any;
    if (windowAny.Windows && options.mediaSource?.IsLocal) {
        return windowAny.Windows.Storage.StorageFile.getFileFromPathAsync(options.url).then((file: any) => {
            const playlist = new windowAny.Windows.Media.Playback.MediaPlaybackList();

            const source1 = windowAny.Windows.Media.Core.MediaSource.createFromStorageFile(file);
            const startTime = (options.playerStartPositionTicks || 0) / 10000;
            playlist.items.append(new windowAny.Windows.Media.Playback.MediaPlaybackItem(source1, startTime));
            elem.src = URL.createObjectURL(playlist);
            return Promise.resolve();
        });
    } else {
        elem.src = src;
    }

    return Promise.resolve();
}

export function resetSrc(elem: HTMLMediaElement): void {
    elem.src = '';
    elem.innerHTML = '';
    elem.removeAttribute('src');
}

function onSuccessfulPlay(elem: HTMLMediaElement, onErrorFn: (e: Event) => void): void {
    elem.addEventListener('error', onErrorFn);
}

export async function playWithPromise(elem: HTMLMediaElement, onErrorFn: (e: Event) => void): Promise<void> {
    try {
        try {
            const { masterAudioOutput } = await import('./audioEngine/master.logic');
            const { safeResumeAudioContext } = await import('./audioEngine/audioUtils');

            if (masterAudioOutput.audioContext) {
                await safeResumeAudioContext(masterAudioOutput.audioContext);
            }
        } catch (audioErr) {
            logger.warn(
                'Failed to prepare AudioContext before playback',
                { component: 'HtmlMediaHelper' },
                audioErr as Error
            );
        }

        return elem
            .play()
            .catch(e => {
                const errorName = (e.name || '').toLowerCase();
                if (errorName === 'notallowederror' || errorName === 'aborterror') {
                    logger.debug(`Playback interrupted (likely autoplay policy): ${errorName}`, {
                        component: 'HtmlMediaHelper'
                    });
                    return Promise.resolve();
                }
                logger.error('Media playback failed', { component: 'HtmlMediaHelper' }, e);
                return Promise.reject(e);
            })
            .then(() => {
                onSuccessfulPlay(elem, onErrorFn);
                return Promise.resolve();
            });
    } catch (err) {
        logger.error('Error calling elem.play()', { component: 'HtmlMediaHelper' }, err as Error);
        return Promise.reject(err);
    }
}

export function destroyCastPlayer(instance: PlayerInstance): void {
    const player = instance._castPlayer;
    if (player) {
        try {
            player.unload();
        } catch (err) {
            logger.error('Error destroying Cast player', { component: 'HtmlMediaHelper' }, err as Error);
        }

        instance._castPlayer = null;
    }
}

export function destroyHlsPlayer(instance: PlayerInstance): void {
    const player = instance._hlsPlayer;
    if (player) {
        try {
            player.destroy();
        } catch (err) {
            logger.error('Error destroying HLS player', { component: 'HtmlMediaHelper' }, err as Error);
        }

        instance._hlsPlayer = null;
    }
}

export function destroyFlvPlayer(instance: PlayerInstance): void {
    const player = instance._flvPlayer;
    if (player) {
        try {
            player.unload();
            player.detachMediaElement();
            player.destroy();
        } catch (err) {
            logger.error('Error destroying FLV player', { component: 'HtmlMediaHelper' }, err as Error);
        }

        instance._flvPlayer = null;
    }
}

export function bindEventsToHlsPlayer(
    instance: PlayerInstance,
    hls: any,
    elem: HTMLMediaElement,
    onErrorFn: (e: Event) => void,
    resolve: () => void,
    reject: (err?: any) => void
): void {
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        playWithPromise(elem, onErrorFn).then(resolve, () => {
            if (reject) {
                reject();
            }
        });
    });

    hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        logger.error(`HLS Error: Type: ${data.type} Details: ${data.details || ''} Fatal: ${data.fatal || false}`, {
            component: 'HtmlMediaHelper'
        });
        const isLoadFailure = [
            'manifestLoadError',
            'levelLoadError',
            'audioTrackLoadError',
            'fragLoadError',
            'keyLoadError'
        ].includes(data.details);
        const isNetworkDown =
            data.type === Hls.ErrorTypes.NETWORK_ERROR && (!data.response || data.response.code === 0);

        if (data.fatal && isNetworkDown && isLoadFailure) {
            hls.destroy();
            if (reject) {
                reject(MediaError.NETWORK_ERROR);
            } else {
                onErrorInternal(instance, MediaError.NETWORK_ERROR);
            }
            return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && data.response?.code && data.response.code >= 400) {
            hls.destroy();

            if (reject) {
                reject(MediaError.SERVER_ERROR);
            } else {
                onErrorInternal(instance, MediaError.SERVER_ERROR);
            }

            return;
        }

        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    if (data.response && data.response.code === 0) {
                        hls.destroy();
                        if (reject) {
                            reject(MediaError.NETWORK_ERROR);
                        } else {
                            onErrorInternal(instance, MediaError.NETWORK_ERROR);
                        }
                    } else {
                        hls.startLoad();
                    }
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    handleHlsJsMediaError(instance, reject);
                    break;
                default:
                    hls.destroy();
                    if (reject) {
                        const error = new Error(`Fatal HLS error: ${data.type} - ${data.details || 'unknown'}`);
                        reject(error);
                    } else {
                        onErrorInternal(instance, MediaError.FATAL_HLS_ERROR);
                    }
                    break;
            }
        }
    });
}

export function onEndedInternal(instance: PlayerInstance, elem: HTMLMediaElement, onErrorFn: (e: Event) => void): void {
    elem.removeEventListener('error', onErrorFn);

    resetSrc(elem);

    destroyHlsPlayer(instance);
    destroyFlvPlayer(instance);
    destroyCastPlayer(instance);

    const stopInfo = {
        src: instance._currentSrc
    };

    Events.trigger(instance as any, 'stopped', [stopInfo]);

    instance._currentTime = null;
    instance._currentSrc = null;
    instance._currentPlayOptions = null;
}

export function getBufferedRanges(instance: PlayerInstance, elem: HTMLMediaElement): { start: number; end: number }[] {
    const ranges = [];
    const seekable = elem.buffered;

    let offset: number | undefined;
    const currentPlayOptions = instance._currentPlayOptions;
    if (currentPlayOptions) {
        offset = currentPlayOptions.transcodingOffsetTicks;
    }

    offset = offset || 0;

    for (let i = 0, length = seekable.length; i < length; i++) {
        let start = seekable.start(i);
        let end = seekable.end(i);

        if (!isValidDuration(start)) {
            start = 0;
        }
        if (!isValidDuration(end)) {
            continue;
        }

        ranges.push({
            start: start * 10000000 + offset,
            end: end * 10000000 + offset
        });
    }

    return ranges;
}
