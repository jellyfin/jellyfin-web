import * as htmlMediaHelper from '../htmlMediaHelper';
import { ensureAudioNodeBundle, getAudioNodeBundle, masterAudioOutput, removeAudioNodeBundle } from './master.logic';

type PreloadedTrack = {
    itemId: string;
    url: string;
    element: HTMLAudioElement;
    gainNode: GainNode;
    targetGain: number;
    ready: boolean;
    token: number;
};

type PreloadOptions = {
    itemId: string;
    url: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
    timeoutMs: number;
};

let preloadState: PreloadedTrack | null = null;
let preloadToken = 0;
let preloadPromise: Promise<boolean> | null = null;

function clearPreloadedElement() {
    if (!preloadState) return;

    const element = preloadState.element;
    removeAudioNodeBundle(element);
    element.remove();
    preloadState = null;
    preloadPromise = null;
}

function waitForReady(element: HTMLMediaElement, timeoutMs: number, token: number) {
    return new Promise<boolean>((resolve) => {
        let settled = false;
        let timeoutId: ReturnType<typeof setTimeout>;
        const cleanup = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            element.removeEventListener('canplay', onReady);
            element.removeEventListener('canplaythrough', onReady);
            element.removeEventListener('error', onError);
        };

        const onReady = () => {
            cleanup();
            resolve(preloadState?.token === token);
        };

        const onError = () => {
            cleanup();
            resolve(false);
        };

        timeoutId = setTimeout(() => {
            cleanup();
            resolve(false);
        }, timeoutMs);

        element.addEventListener('canplay', onReady, { once: true });
        element.addEventListener('canplaythrough', onReady, { once: true });
        element.addEventListener('error', onError, { once: true });

        if (timeoutMs <= 0) {
            onError();
        }
    });
}

export function resetPreloadedTrack() {
    clearPreloadedElement();
}

export function preloadNextTrack(options: PreloadOptions) {
    if (!masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        return Promise.resolve(false);
    }

    if (!options.url) {
        return Promise.resolve(false);
    }

    if (preloadState) {
        if (preloadState.itemId === options.itemId && preloadState.url === options.url) {
            return Promise.resolve(preloadState.ready);
        }
        clearPreloadedElement();
    }

    if (preloadPromise) {
        return preloadPromise;
    }
    preloadToken += 1;
    const token = preloadToken;

    const element = document.createElement('audio');
    element.preload = 'auto';
    element.classList.add('hide');
    element.setAttribute('data-crossfade-preload', 'true');

    if (options.crossOrigin) {
        element.crossOrigin = options.crossOrigin;
    }

    element.volume = options.volume;
    element.muted = options.muted;
    element.src = options.url;

    document.body.appendChild(element);

    const targetGain = options.normalizationGainDb ? Math.pow(10, options.normalizationGainDb / 20) : 1;
    const bundle = ensureAudioNodeBundle(element, { initialGain: 0 });
    if (!bundle) {
        element.remove();
        return Promise.resolve(false);
    }

    preloadState = {
        itemId: options.itemId,
        url: options.url,
        element,
        gainNode: bundle.gainNode,
        targetGain,
        ready: false,
        token
    };

    element.load();

    preloadPromise = waitForReady(element, options.timeoutMs, token).then((ready) => {
        if (!preloadState || preloadState.token !== token) {
            return false;
        }
        preloadState.ready = ready;
        if (!ready) {
            clearPreloadedElement();
        }
        return ready;
    });

    return preloadPromise;
}

export function startCrossfade(options: { fromElement: HTMLMediaElement; durationSeconds: number }) {
    if (!preloadState || !preloadState.ready) {
        return Promise.resolve(false);
    }

    if (!masterAudioOutput.audioContext) {
        clearPreloadedElement();
        return Promise.resolve(false);
    }

    const fromBundle = getAudioNodeBundle(options.fromElement);
    if (!fromBundle) {
        clearPreloadedElement();
        return Promise.resolve(false);
    }

    const audioCtx = masterAudioOutput.audioContext;
    const preloaded = preloadState;
    const duration = Math.max(options.durationSeconds, 0);

    return audioCtx.resume().catch(() => {
        return Promise.resolve();
    }).then(() => {
        return htmlMediaHelper.playWithPromise(preloaded.element, () => {
            // no-op error handler; fallback handled by paused check
        }).catch(() => {
            return Promise.reject();
        });
    }).then(() => {
        if (preloaded.element.paused) {
            clearPreloadedElement();
            return false;
        }

        const now = audioCtx.currentTime;
        const fromGain = fromBundle.gainNode.gain;
        const toGain = preloaded.gainNode.gain;
        const targetGain = preloaded.targetGain;

        fromGain.cancelScheduledValues(now);
        toGain.cancelScheduledValues(now);

        if (duration === 0) {
            fromGain.setValueAtTime(0.001, now);
            toGain.setValueAtTime(targetGain, now);
        } else {
            fromGain.setValueAtTime(fromGain.value, now);
            fromGain.linearRampToValueAtTime(0.001, now + duration);

            toGain.setValueAtTime(0.001, now);
            toGain.linearRampToValueAtTime(targetGain, now + duration);
        }

        options.fromElement.addEventListener('ended', () => {
            removeAudioNodeBundle(options.fromElement);
            options.fromElement.remove();
        }, { once: true });

        return true;
    }).catch(() => {
        clearPreloadedElement();
        return false;
    });
}

export function consumePreloadedTrack(options: { itemId?: string; url?: string }) {
    if (!preloadState) return null;

    if (options.itemId && preloadState.itemId !== options.itemId) {
        return null;
    }

    if (options.url && preloadState.url !== options.url) {
        return null;
    }

    const element = preloadState.element;
    preloadState = null;
    preloadPromise = null;
    return element;
}
