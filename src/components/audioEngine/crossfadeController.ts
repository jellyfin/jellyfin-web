/**
 * Crossfade Controller
 *
 * Manages track preloading for crossfade and peak analysis.
 * Records latency measurements for network latency compensation.
 * Supports streaming (metadata-only) and full preload modes.
 */

import { getEffectiveLatency } from '../../store/preferencesStore';
import { logger } from '../../utils/logger';
import { recordNetworkLatency } from '../../utils/networkLatencyMonitor';
import * as htmlMediaHelper from '../htmlMediaHelper';
import {
    ensureAudioNodeBundle,
    getAudioNodeBundle,
    masterAudioOutput,
    removeAudioNodeBundle
} from './master.logic';

export type PreloadStrategy = 'streaming' | 'full';

type PreloadedTrack = {
    itemId: string;
    url: string;
    element: HTMLAudioElement;
    gainNode: GainNode;
    targetGain: number;
    ready: boolean;
    token: number;
    purpose: 'crossfade' | 'analysis';
    strategy: PreloadStrategy;
};

export type PreloadPurpose = 'crossfade' | 'analysis';

export type PreloadOptions = {
    itemId: string;
    url: string;
    crossOrigin?: string | null;
    volume: number;
    muted: boolean;
    normalizationGainDb?: number;
    timeoutMs: number;
    purpose: PreloadPurpose;
    strategy?: PreloadStrategy;
};

let preloadState: PreloadedTrack | null = null;
let preloadToken = 0;
let preloadPromise: Promise<boolean> | null = null;
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
        logger.warn(
            '[Crossfade] Error during element cleanup',
            { component: 'CrossfadeController' },
            error as Error
        );
    }
}

function waitForReady(
    element: HTMLMediaElement,
    timeoutMs: number,
    token: number,
    abortSignal?: AbortSignal
) {
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

export async function preloadNextTrack(options: PreloadOptions) {
    const startTime = performance.now();

    if (!options.url) {
        return false;
    }

    if (!masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        logger.warn('[Crossfade] Audio engine not initialized', { component: 'CrossfadeController' });
        return false;
    }

    const strategy = options.strategy ?? 'full';

    if (preloadState) {
        if (
            preloadState.itemId === options.itemId &&
            preloadState.url === options.url &&
            preloadState.purpose === options.purpose &&
            preloadState.strategy === strategy
        ) {
            return preloadState.ready;
        }
        // Strategy changed - clear both state and promise to force new preload
        clearPreloadedElement();
        preloadPromise = null;
    }

    if (preloadPromise) {
        return preloadPromise;
    }

    preloadToken += 1;
    const token = preloadToken;

    const abortController = new AbortController();
    const networkTimeoutMs = options.timeoutMs || 15000;

    const isStreaming = strategy === 'streaming';
    const effectiveTimeoutMs = isStreaming ? Math.min(networkTimeoutMs, 5000) : networkTimeoutMs;

    const element = document.createElement('audio');
    element.preload = isStreaming ? 'metadata' : 'auto';
    element.classList.add('hide');
    element.setAttribute('data-crossfade-preload', 'true');
    element.setAttribute('data-crossfade-purpose', options.purpose);
    element.setAttribute('data-preload-strategy', strategy);

    if (options.crossOrigin) {
        element.crossOrigin = options.crossOrigin;
    }

    element.volume = options.volume;
    element.muted = options.muted;
    element.src = options.url;

    document.body.appendChild(element);

    preloadState = {
        itemId: options.itemId,
        url: options.url,
        element,
        gainNode: {} as GainNode,
        targetGain: 1,
        ready: false,
        token,
        purpose: options.purpose,
        strategy
    };

    if (options.purpose === 'crossfade') {
        const targetGain = options.normalizationGainDb
            ? 10 ** (options.normalizationGainDb / 20)
            : 1;
        const bundle = ensureAudioNodeBundle(element, { initialNormalizationGain: 0 });

        if (!bundle) {
            element.remove();
            return false;
        }

        preloadState.gainNode = bundle.crossfadeGainNode;
        preloadState.targetGain = targetGain;
    }

    const networkTimeoutId = setTimeout(() => {
        if (preloadState?.token === token) {
            logger.warn(`[Crossfade] Network timeout for preload: ${options.itemId}`, {
                component: 'CrossfadeController',
                purpose: options.purpose,
                strategy
            });

            if (options.purpose === 'crossfade') {
                const endTime = performance.now();
                recordNetworkLatency(false, endTime - startTime);
            }

            abortController.abort();
            clearPreloadedElement();
        }
    }, effectiveTimeoutMs);

    const clearNetworkTimeout = () => clearTimeout(networkTimeoutId);

    element.load();

    preloadPromise = waitForReady(element, effectiveTimeoutMs, token, abortController.signal)
        .then((ready) => {
            clearNetworkTimeout();

            if (!preloadState || preloadState.token !== token) {
                return false;
            }

            if (options.purpose === 'crossfade' && ready) {
                const endTime = performance.now();
                recordNetworkLatency(true, endTime - startTime);
            }

            preloadState.ready = ready;

            if (!ready) {
                clearPreloadedElement();
            }

            return ready;
        })
        .catch((err) => {
            clearNetworkTimeout();

            if (abortController.signal.aborted) {
                logger.warn(`[Crossfade] Preload aborted due to timeout: ${options.itemId}`, {
                    component: 'CrossfadeController',
                    purpose: options.purpose
                });

                if (options.purpose === 'crossfade') {
                    recordNetworkLatency(false, networkTimeoutMs);
                }
            } else if (options.purpose === 'crossfade') {
                recordNetworkLatency(false, performance.now() - startTime);
            }

            clearPreloadedElement();
            return false;
        });

    if (!isStreaming) {
        element.play().catch(() => {});
    }

    return preloadPromise;
}

export function startCrossfade(options: {
    fromElement: HTMLMediaElement;
    durationSeconds?: number;
}) {
    if (!preloadState || !preloadState.ready || preloadState.purpose !== 'crossfade') {
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

    const effectiveDuration = options.durationSeconds ?? getEffectiveLatency() + 5;
    const duration = Math.max(effectiveDuration, 0);

    return audioCtx
        .resume()
        .catch((err: unknown) => {
            logger.warn(
                '[Crossfade] AudioContext.resume() failed',
                { component: 'CrossfadeController' },
                err as Error
            );
            clearPreloadedElement();
            return Promise.reject(err);
        })
        .then(() => {
            if (audioCtx.state !== 'running') {
                logger.warn(
                    `[Crossfade] AudioContext not running after resume, state: ${audioCtx.state}`,
                    {
                        component: 'CrossfadeController'
                    }
                );
                clearPreloadedElement();
                return Promise.reject(new Error('AudioContext not running'));
            }
            return htmlMediaHelper
                .playWithPromise(preloaded.element, () => {})
                .catch((err: unknown) => {
                    logger.error(
                        '[Crossfade] playWithPromise failed',
                        { component: 'CrossfadeController' },
                        err as Error
                    );
                    return Promise.reject(err);
                });
        })
        .then(() => {
            if (preloaded.element.paused) {
                clearPreloadedElement();
                return false;
            }

            const now = audioCtx.currentTime;
            const fromGain = fromBundle.crossfadeGainNode as unknown as {
                gain: {
                    cancelScheduledValues(t: number): void;
                    setValueAtTime(v: number, t: number): void;
                    linearRampToValueAtTime(v: number, t: number): void;
                    value: number;
                };
            };
            const toGain = preloaded.gainNode as unknown as {
                gain: {
                    cancelScheduledValues(t: number): void;
                    setValueAtTime(v: number, t: number): void;
                    linearRampToValueAtTime(v: number, t: number): void;
                };
            };
            const targetGain = preloaded.targetGain;

            fromGain.gain.cancelScheduledValues(now);
            toGain.gain.cancelScheduledValues(now);

            if (duration === 0) {
                fromGain.gain.setValueAtTime(0.001, now);
                toGain.gain.setValueAtTime(targetGain, now);
            } else {
                fromGain.gain.setValueAtTime(fromGain.gain.value, now);
                fromGain.gain.linearRampToValueAtTime(0.001, now + duration);

                toGain.gain.setValueAtTime(0.001, now);
                toGain.gain.linearRampToValueAtTime(targetGain, now + duration);
            }

            options.fromElement.addEventListener(
                'ended',
                () => {
                    safeCleanupElement(options.fromElement);
                },
                { once: true }
            );

            return true;
        })
        .catch((err) => {
            logger.error(
                '[Crossfade] crossfade error',
                { component: 'CrossfadeController' },
                err as Error
            );
            clearPreloadedElement();
            return false;
        });
}

export function consumePreloadedTrack(options: {
    itemId?: string;
    url?: string;
    purpose?: PreloadPurpose;
}) {
    if (!preloadState) return null;

    if (options.itemId && preloadState.itemId !== options.itemId) {
        return null;
    }

    if (options.url && preloadState.url !== options.url) {
        return null;
    }

    if (options.purpose && preloadState.purpose !== options.purpose) {
        return null;
    }

    const element = preloadState.element;
    preloadState = null;
    preloadPromise = null;
    return element;
}

export function getPreloadState() {
    return preloadState;
}

export function isPreloadReady(itemId: string): boolean {
    return preloadState?.itemId === itemId && preloadState?.ready === true;
}

export function clearPreloadForItem(itemId: string): void {
    if (preloadState?.itemId === itemId) {
        clearPreloadedElement();
    }
}
