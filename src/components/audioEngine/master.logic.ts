import { getSavedVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import * as userSettings from '../../scripts/settings/userSettings';
import { setXDuration, xDuration } from './crossfader.logic';

type MasterAudioTypes = {
    mixerNode?: GainNode;
    buffered?: DelayNode
    makeupGain: number;
    muted: boolean;
    audioContext?: AudioContext;
    volume: number;
};

type AudioNodeBundle = {
    sourceNode: MediaElementAudioSourceNode;
    gainNode: GainNode;
    delayNode?: DelayNode;
    busRegistered: boolean;
};

const dbBoost = 2;

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

/**
 * Master audio output settings.
 * @type {Object}
 */
export const masterAudioOutput: MasterAudioTypes = {
    makeupGain: Math.pow(10, dbBoost / 20),
    muted: false,
    volume: applyDbReduction(100, dbBoost)
};

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

        // insert a  “brick-wall” limiter before destination
        const limiter = audioCtx.createDynamicsCompressor();
        // peaks above –1 dB will be instantly limited
        limiter.threshold.setValueAtTime(-1, audioCtx.currentTime);
        limiter.knee.setValueAtTime(0, audioCtx.currentTime);
        limiter.ratio.setValueAtTime(20, audioCtx.currentTime);
        limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);
        limiter.release.setValueAtTime(0.25, audioCtx.currentTime);

        // route: mixer → limiter → speakers
        masterAudioOutput.mixerNode.connect(limiter);
        limiter.connect(audioCtx.destination);

        masterAudioOutput.mixerNode.gain
            .setValueAtTime((masterAudioOutput.volume / 100) * masterAudioOutput.makeupGain, audioCtx.currentTime);
    }
}

type GainNodes = GainNode[];
type DelayNodes = DelayNode[];

export const audioNodeBus: GainNodes = [];
export const delayNodeBus: DelayNodes = [];
const elementNodeMap = new WeakMap<HTMLMediaElement, AudioNodeBundle>();

function createNodeBundle(elem: HTMLMediaElement, registerInBus = false, initialGain?: number) {
    if (!masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        console.log('MasterAudio is not initialized');
        return;
    }

    const existing = elementNodeMap.get(elem);
    if (existing) {
        if (initialGain !== undefined) {
            existing.gainNode.gain.setValueAtTime(initialGain, masterAudioOutput.audioContext.currentTime);
        }
        if (registerInBus && !existing.busRegistered) {
            audioNodeBus.unshift(existing.gainNode);
            existing.busRegistered = true;
        }
        return existing;
    }

    const gainNode = masterAudioOutput.audioContext.createGain();
    const gainValue = initialGain !== undefined ? initialGain : 0;
    gainNode.gain.setValueAtTime(gainValue, masterAudioOutput.audioContext.currentTime);

    const sourceNode = masterAudioOutput.audioContext.createMediaElementSource(elem);
    let delayNode: DelayNode | undefined;
    const shouldDelay = visualizerSettings.waveSurfer.enabled;

    if (registerInBus || shouldDelay) {
        delayNode = masterAudioOutput.audioContext.createDelay(1);
        delayNode.delayTime.value = shouldDelay ? 0.1 : 0;
        sourceNode.connect(delayNode);
        delayNode.connect(gainNode);
        if (registerInBus) {
            delayNodeBus.unshift(delayNode);
        }
    } else {
        sourceNode.connect(gainNode);
    }

    gainNode.connect(masterAudioOutput.mixerNode);

    const bundle = {
        sourceNode,
        gainNode,
        delayNode,
        busRegistered: false
    };
    elementNodeMap.set(elem, bundle);

    if (registerInBus) {
        audioNodeBus.unshift(gainNode);
        bundle.busRegistered = true;
    }

    return bundle;
}

export function ensureAudioNodeBundle(elem: HTMLMediaElement, options?: { initialGain?: number; registerInBus?: boolean }) {
    return createNodeBundle(elem, options?.registerInBus ?? false, options?.initialGain);
}

/**
 * Creates a gain node for the media element.
 * @param {HTMLMediaElement} elem - The media element.
 * @returns {GainNode|undefined} The created gain node, or undefined if not initialized.
 */
export function createGainNode(elem: HTMLMediaElement) {
    const bundle = createNodeBundle(elem, true);
    return bundle?.gainNode;
}

export function getAudioNodeBundle(elem: HTMLMediaElement) {
    return elementNodeMap.get(elem);
}

export function removeAudioNodeBundle(elem: HTMLMediaElement) {
    const bundle = elementNodeMap.get(elem);
    if (!bundle) return;

    const gainIndex = audioNodeBus.indexOf(bundle.gainNode);
    if (gainIndex !== -1) {
        audioNodeBus.splice(gainIndex, 1);
    }

    if (bundle.delayNode) {
        const delayIndex = delayNodeBus.indexOf(bundle.delayNode);
        if (delayIndex !== -1) {
            delayNodeBus.splice(delayIndex, 1);
        }
    }

    bundle.gainNode.disconnect();
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

    const audioCtx = masterAudioOutput.audioContext;
    const gainNode = audioNodeBus[0].gain;
    const gainValue = normalizationGain ? Math.pow(10, normalizationGain / 20) : 1;

    gainNode.cancelScheduledValues(audioCtx.currentTime);
    gainNode.linearRampToValueAtTime(0.01, audioCtx.currentTime);
    gainNode.exponentialRampToValueAtTime(
        gainValue,
        audioCtx.currentTime + (xDuration.sustain / 24)
    );
}
