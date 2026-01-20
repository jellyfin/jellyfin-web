import * as htmlMediaHelper from '../htmlMediaHelper';
import { ensureAudioNodeBundle, getAudioNodeBundle, masterAudioOutput, removeAudioNodeBundle } from './master.logic';
import { logger } from '../../utils/logger';

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

// Track elements being cleaned up to prevent double-cleanup
const cleanupGuard = new WeakSet<HTMLMediaElement>();

function clearPreloadedElement() {
    if (!preloadState) return;

    const element = preloadState.element;
    safeCleanupElement(element);
    preloadState = null;
    preloadPromise = null;
}

function safeCleanupElement(element: HTMLMediaElement): void {
    if (!element || cleanupGuard.has(element)) return;
    
    cleanupGuard.add(element);
    
    try {
        removeAudioNodeBundle(element);
        element.remove();
    } catch (error) {
        logger.warn('[Crossfade] Error during element cleanup', { component: 'CrossfadeController' }, error as Error);
    }
}

function waitForReady(element: HTMLMediaElement, timeoutMs: number, token: number, abortSignal?: AbortSignal) {
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
            abortSignal?.removeEventListener('abort', onAbort);
        };

        const onReady = () => {
            cleanup();
            resolve(preloadState?.token === token);
        };

        const onError = () => {
            cleanup();
            resolve(false);
        };

        const onAbort = () => {
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

        if (abortSignal?.aborted) {
            cleanup();
            resolve(false);
            return;
        }

        abortSignal?.addEventListener('abort', onAbort);

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

    // Create abort controller for network timeout
    const abortController = new AbortController();
    const networkTimeoutMs = options.timeoutMs || 15000; // 15 second default

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
    const bundle = ensureAudioNodeBundle(element, { initialNormalizationGain: 0 });
    if (!bundle) {
        element.remove();
        return Promise.resolve(false);
    }

    // Set up network timeout
    const networkTimeoutId = setTimeout(() => {
        if (preloadState?.token === token) {
            logger.warn(`[Crossfade] Network timeout for preload: ${options.itemId}`, { component: 'CrossfadeController' });
            abortController.abort();
            clearPreloadedElement();
        }
    }, networkTimeoutMs);

    // Clear timeout when element is ready or error occurs
    const clearNetworkTimeout = () => clearTimeout(networkTimeoutId);

    preloadState = {
        itemId: options.itemId,
        url: options.url,
        element,
        gainNode: bundle.crossfadeGainNode,
        targetGain,
        ready: false,
        token
    };

    element.load();

    preloadPromise = waitForReady(element, options.timeoutMs, token, abortController.signal).then((ready) => {
        clearNetworkTimeout();
        if (!preloadState || preloadState.token !== token) {
            return false;
        }
        preloadState.ready = ready;
        if (!ready) {
            clearPreloadedElement();
        }
        return ready;
    }).catch((err) => {
        clearNetworkTimeout();
        if (abortController.signal.aborted) {
            logger.warn(`[Crossfade] Preload aborted due to timeout: ${options.itemId}`, { component: 'CrossfadeController' });
        }
        clearPreloadedElement();
        return false;
    });

    // Start loading the media (trigger network fetch)
    element.play().catch(() => {
        // Ignore play errors - we just want to start loading
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

    return audioCtx.resume().catch((err: unknown) => {
        logger.warn('[Crossfade] AudioContext.resume() failed', { component: 'CrossfadeController' }, err as Error);
        clearPreloadedElement();
        return Promise.reject(err);
    }).then(() => {
        if (audioCtx.state !== 'running') {
            logger.warn(`[Crossfade] AudioContext not running after resume, state: ${audioCtx.state}`, { component: 'CrossfadeController' });
            clearPreloadedElement();
            return Promise.reject(new Error('AudioContext not running'));
        }
        return htmlMediaHelper.playWithPromise(preloaded.element, () => {
            // no-op error handler; fallback handled by paused check
        }).catch((err: unknown) => {
            logger.error('[Crossfade] playWithPromise failed', { component: 'CrossfadeController' }, err as Error);
            return Promise.reject(err);
        });
    }).then(() => {
        if (preloaded.element.paused) {
            clearPreloadedElement();
            return false;
        }

        const now = audioCtx.currentTime;
        const fromGain = fromBundle.crossfadeGainNode.gain;
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
            safeCleanupElement(options.fromElement);
        }, { once: true });

        return Promise.resolve(true);
    }).catch((err) => {
        logger.error('[Crossfade] crossfade error', { component: 'CrossfadeController' }, err as Error);
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
