import { getSavedVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import * as userSettings from '../../scripts/settings/userSettings';
import { setXDuration, xDuration } from './crossfader.logic';
import audioErrorHandler, { AudioErrorType, AudioErrorSeverity } from './audioErrorHandler';
import { safeConnect, dBToLinear } from './audioUtils';

import { useAudioStore } from '../../store/audioStore';

type MasterAudioTypes = {
    mixerNode?: GainNode;
    biquadNode?: AudioNode;
    buffered?: DelayNode
    makeupGain: number;
    muted: boolean;
    audioContext?: AudioContext;
    volume: number;
};

type AudioNodeBundle = {
    sourceNode: MediaElementAudioSourceNode;
    normalizationGainNode: GainNode; // For track/album normalization
    crossfadeGainNode: GainNode; // For crossfading automation
    delayNode?: DelayNode;
    busRegistered: boolean;
    id?: string;
    isLocalPlayer?: boolean;
};

const dbBoost = 2;

/** Divisor for fade-in ramp duration (smaller = faster ramp) */
const FADE_IN_RAMP_DIVISOR = 24;

/**
 * Applies a decibel reduction to the original volume.
 * @param {number} originalVolume - The original volume.
 * @param {number} reductionDb - The reduction in decibels.
 * @returns {number} The reduced volume.
 */
function applyDbReduction(originalVolume: number, reductionDb: number) {
    const originalLinear = originalVolume / 100; // Convert the original volume to a linear scale of 0 to 1
    const newLinear = originalLinear * Math.pow(10, -reductionDb / 20);

    return newLinear * 100; // Convert back to a scale of 0 to 100
}

const _masterAudioState = {
    mixerNode: undefined as GainNode | undefined,
    biquadNode: undefined as AudioNode | undefined,
    audioContext: undefined as AudioContext | undefined,
    buffered: undefined as DelayNode | undefined,
};

/**
 * Master audio output settings.
 * Proxy object backed by Zustand store for reactive state.
 * @type {Object}
 */
export const masterAudioOutput = {
    get mixerNode() { return _masterAudioState.mixerNode; },
    set mixerNode(v: GainNode | undefined) { _masterAudioState.mixerNode = v; },

    get biquadNode() { return _masterAudioState.biquadNode; },
    set biquadNode(v: AudioNode | undefined) { _masterAudioState.biquadNode = v; },

    get audioContext() { return _masterAudioState.audioContext; },
    set audioContext(v: AudioContext | undefined) {
        _masterAudioState.audioContext = v;
        useAudioStore.getState().setIsReady(!!v);
    },

    get buffered() { return _masterAudioState.buffered; },
    set buffered(v: DelayNode | undefined) { _masterAudioState.buffered = v; },

    get volume() { return useAudioStore.getState().volume; },
    set volume(v: number) { useAudioStore.getState().setVolume(v); },

    get muted() { return useAudioStore.getState().muted; },
    set muted(v: boolean) { useAudioStore.getState().setMuted(v); },

    get makeupGain() { return useAudioStore.getState().makeupGain; },
    set makeupGain(v: number) { useAudioStore.getState().setMakeupGain(v); }
} as MasterAudioTypes;

// Load AudioWorklets for audio processing
async function loadAudioWorklets(audioContext: AudioContext) {
    // Skip AudioWorklet loading in environments where it might fail
    const isDevelopment = typeof import.meta.url === 'string' && (
        import.meta.url.startsWith('file://')
        || import.meta.url.includes('localhost')
        || import.meta.url.includes('127.0.0.1')
        || window.location.protocol === 'file:'
    );

    // Also skip if AudioWorklet is not supported
    if (isDevelopment || !audioContext.audioWorklet) {
        const reason = isDevelopment ?
            'development/local environment' :
            'AudioWorklet not supported in this browser';
        console.info(`AudioWorklet: Skipping loading (${reason}). Using Web Audio API fallbacks.`);
        return;
    }

    const worklets = [
        './limiterWorklet.js',
        './gainWorklet.js',
        './delayWorklet.js',
        './biquadWorklet.js'
    ];

    let loadedCount = 0;
    for (const worklet of worklets) {
        try {
            const workletUrl = new URL(worklet, import.meta.url);
            console.debug(`AudioWorklet: Loading ${worklet} from ${workletUrl.href}`);
            await audioContext.audioWorklet.addModule(workletUrl);
            console.debug(`AudioWorklet: Successfully loaded ${worklet}`);
            loadedCount++;
        } catch (error) {
            // Use centralized error handler
            audioErrorHandler.handleError(
                audioErrorHandler.createError(
                    AudioErrorType.AUDIO_WORKLET_LOAD_FAILED,
                    AudioErrorSeverity.LOW,
                    'AudioWorkletLoader',
                    `Failed to load ${worklet}`,
                    error instanceof Error ? error : undefined,
                    { worklet, workletUrl: new URL(worklet, import.meta.url).href }
                )
            );
        }
    }

    if (loadedCount > 0) {
        console.info(`AudioWorklet: Successfully loaded ${loadedCount}/${worklets.length} worklets`);
    } else {
        console.info('AudioWorklet: No worklets loaded, using Web Audio API fallbacks');
    }
}

/**
 * Unbind callback function.
 * Explicitly typed as a function with no parameters returning void.
 */
export let unbindCallback: () => void = () => {
    return;
};

/**
 * Gets the crossfade duration from user settings.
 * @returns {number} The crossfade duration.
 */
function getCrossfadeDuration(): number {
    return userSettings.crossfadeDuration(undefined);
}

/**
 * Initializes the master audio output.
 * @param {Function} unbind - The unbind callback function.
 */
export function initializeMasterAudio(unbind: () => void) {
    const savedDuration = getCrossfadeDuration();
    setXDuration(savedDuration);
    setVisualizerSettings(getSavedVisualizerSettings());

    unbindCallback = unbind;

    // Subscribe to store changes to update audio engine
    useAudioStore.subscribe(
        (state) => ({ volume: state.volume, muted: state.muted, makeupGain: state.makeupGain }),
        ({ volume, muted, makeupGain }) => {
            if (!masterAudioOutput.mixerNode || !masterAudioOutput.audioContext) return;
            
            const targetVolume = muted ? 0 : volume;
            const linearVolume = (targetVolume / 100) * makeupGain;
            
            // Smooth transition to prevent clicks
            masterAudioOutput.mixerNode.gain.cancelScheduledValues(masterAudioOutput.audioContext.currentTime);
            masterAudioOutput.mixerNode.gain.setTargetAtTime(
                linearVolume, 
                masterAudioOutput.audioContext.currentTime, 
                0.05 // 50ms time constant
            );
        }
    );

    const webAudioSupported = ('AudioContext' in window || 'webkitAudioContext' in window);

    if (!webAudioSupported) {
        console.log('WebAudio not supported');
        return;
    }
    // eslint-disable-next-line compat/compat, @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = masterAudioOutput.audioContext || new AudioContext();

    if (!masterAudioOutput.audioContext) masterAudioOutput.audioContext = audioCtx;

    if (!masterAudioOutput.mixerNode) {
        masterAudioOutput.mixerNode = audioCtx.createGain();
        masterAudioOutput.mixerNode.gain.setValueAtTime((masterAudioOutput.volume / 100) * masterAudioOutput.makeupGain, audioCtx.currentTime);

        // Attempt to load and use worklet limiter for multithreading
        loadAudioWorklets(audioCtx).catch(() => {}); // Load asynchronously

        try {
            masterAudioOutput.biquadNode = new AudioWorkletNode(audioCtx, 'biquad-processor');
        } catch {
            masterAudioOutput.biquadNode = audioCtx.createBiquadFilter();
        }

        let limiter: AudioNode;
        try {
            limiter = new AudioWorkletNode(audioCtx, 'limiter-processor');
            // Set parameters equivalent to DynamicsCompressor
            (limiter as AudioWorkletNode).parameters.get('threshold')?.setValueAtTime(0.8, audioCtx.currentTime);
            (limiter as AudioWorkletNode).parameters.get('ratio')?.setValueAtTime(20, audioCtx.currentTime);
            (limiter as AudioWorkletNode).parameters.get('attack')?.setValueAtTime(0.003, audioCtx.currentTime);
            (limiter as AudioWorkletNode).parameters.get('release')?.setValueAtTime(0.25, audioCtx.currentTime);
        } catch {
            // Fallback to DynamicsCompressor
            limiter = audioCtx.createDynamicsCompressor();
            (limiter as DynamicsCompressorNode).threshold.setValueAtTime(-1, audioCtx.currentTime);
            (limiter as DynamicsCompressorNode).knee.setValueAtTime(0, audioCtx.currentTime);
            (limiter as DynamicsCompressorNode).ratio.setValueAtTime(20, audioCtx.currentTime);
            (limiter as DynamicsCompressorNode).attack.setValueAtTime(0.003, audioCtx.currentTime);
            (limiter as DynamicsCompressorNode).release.setValueAtTime(0.25, audioCtx.currentTime);
        }

        safeConnect(masterAudioOutput.mixerNode, masterAudioOutput.biquadNode);
        safeConnect(masterAudioOutput.biquadNode, limiter);
        limiter.connect(audioCtx.destination);
    }
}

type GainNodes = GainNode[];
type DelayNodes = DelayNode[];

export const audioNodeBus: GainNodes = [];
export const delayNodeBus: DelayNodes = [];
const elementNodeMap = new WeakMap<HTMLMediaElement, AudioNodeBundle>();

// Track active normalization nodes for rampPlaybackGain targeting
const normalizationNodeMap = new WeakMap<GainNode, GainNode>();

function createNodeBundle(elem: HTMLMediaElement, registerInBus = false, initialNormalizationGain?: number) {
    if (!masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        console.log('MasterAudio is not initialized');
        return;
    }

    const existing = elementNodeMap.get(elem);
    if (existing) {
        if (initialNormalizationGain !== undefined) {
            existing.normalizationGainNode.gain.setValueAtTime(initialNormalizationGain, masterAudioOutput.audioContext.currentTime);
        }
        if (registerInBus && !existing.busRegistered) {
            audioNodeBus.unshift(existing.crossfadeGainNode);
            existing.busRegistered = true;
        }
        return existing;
    }

    // Create separate gain nodes for normalization and crossfading
    const normalizationGainNode = masterAudioOutput.audioContext.createGain();
    const crossfadeGainNode = masterAudioOutput.audioContext.createGain();

    // Default normalization to 1 (no change) if not specified
    const normalizationGainValue = initialNormalizationGain !== undefined ? initialNormalizationGain : 1;
    normalizationGainNode.gain.setValueAtTime(normalizationGainValue, masterAudioOutput.audioContext.currentTime);
    // Crossfade gain always starts at 1 (full volume)
    crossfadeGainNode.gain.setValueAtTime(1, masterAudioOutput.audioContext.currentTime);

    const sourceNode = masterAudioOutput.audioContext.createMediaElementSource(elem);
    let delayNode: DelayNode | undefined;
    const shouldDelay = visualizerSettings.waveSurfer.enabled;

    if (registerInBus || shouldDelay) {
        delayNode = masterAudioOutput.audioContext.createDelay(1);
        delayNode.delayTime.value = shouldDelay ? 0.1 : 0;
        sourceNode.connect(delayNode);
        delayNode.connect(normalizationGainNode);
        if (registerInBus) {
            delayNodeBus.unshift(delayNode);
        }
    } else {
        sourceNode.connect(normalizationGainNode);
    }

    // Chain: normalizationGainNode → crossfadeGainNode → masterMixer
    normalizationGainNode.connect(crossfadeGainNode);
    crossfadeGainNode.connect(masterAudioOutput.mixerNode);

    const bundle = {
        sourceNode,
        normalizationGainNode,
        crossfadeGainNode,
        delayNode,
        busRegistered: false
    };
    elementNodeMap.set(elem, bundle);

    // Track normalization node for crossfade gain node targeting
    normalizationNodeMap.set(crossfadeGainNode, normalizationGainNode);

    if (registerInBus) {
        audioNodeBus.unshift(crossfadeGainNode);
        bundle.busRegistered = true;
    }

    return bundle;
}

export function ensureAudioNodeBundle(elem: HTMLMediaElement, options?: { initialNormalizationGain?: number; registerInBus?: boolean }) {
    return createNodeBundle(elem, options?.registerInBus ?? false, options?.initialNormalizationGain);
}

/**
 * Creates a gain node for the media element.
 * @param {HTMLMediaElement} elem - The media element.
 * @returns {GainNode|undefined} The created gain node, or undefined if not initialized.
 */
export function createGainNode(elem: HTMLMediaElement) {
    const bundle = createNodeBundle(elem, true);
    return bundle?.crossfadeGainNode;
}

export function getAudioNodeBundle(elem: HTMLMediaElement) {
    return elementNodeMap.get(elem);
}

export function removeAudioNodeBundle(elem: HTMLMediaElement) {
    const bundle = elementNodeMap.get(elem);
    if (!bundle) return;

    const gainIndex = audioNodeBus.indexOf(bundle.crossfadeGainNode);
    if (gainIndex !== -1) {
        audioNodeBus.splice(gainIndex, 1);
    }

    if (bundle.delayNode) {
        const delayIndex = delayNodeBus.indexOf(bundle.delayNode);
        if (delayIndex !== -1) {
            delayNodeBus.splice(delayIndex, 1);
        }
    }

    // Clean up normalization node mapping
    normalizationNodeMap.delete(bundle.crossfadeGainNode);

    bundle.normalizationGainNode.disconnect();
    bundle.crossfadeGainNode.disconnect();
    bundle.sourceNode.disconnect();
    bundle.delayNode?.disconnect();
    elementNodeMap.delete(elem);
}

/**
 * Ramps the playback gain to the desired level while maintaining volume adjustments.
 * @param {number|undefined} normalizationGain - Gain in dB to apply for normalization.
 */
export function rampPlaybackGain(normalizationGain?: number) {
    if (!masterAudioOutput.audioContext || !audioNodeBus[0]) return;

    // Get the normalization node for the currently playing crossfade gain node
    const targetNormalizationNode = normalizationNodeMap.get(audioNodeBus[0]);

    if (!targetNormalizationNode) {
        console.warn('[RampPlaybackGain] Could not find normalization node for current playback');
        return;
    }

    const audioCtx = masterAudioOutput.audioContext;
    const gainValue = (normalizationGain !== undefined) ? dBToLinear(normalizationGain) : 1;

    targetNormalizationNode.gain.cancelScheduledValues(audioCtx.currentTime);

    targetNormalizationNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime);
    targetNormalizationNode.gain.exponentialRampToValueAtTime(
        gainValue,
        audioCtx.currentTime + (xDuration.sustain / FADE_IN_RAMP_DIVISOR)
    );
}
