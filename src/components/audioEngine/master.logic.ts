import { getSavedVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import * as userSettings from '../../scripts/settings/userSettings';
import { setXDuration } from './crossfader.logic';

type MasterAudioTypes = {
    mixerNode?: GainNode;
    buffered?: DelayNode
    makeupGain: number;
    muted: boolean;
    audioContext?: AudioContext;
    volume: number;
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

/**
 * Creates a buffer for the audio nodes.
 * @param {MediaElementAudioSourceNode} input - The input audio source node.
 * @param {GainNode} output - The output gain node.
 */
function createBuffer(input: MediaElementAudioSourceNode, output: GainNode) {
    if (!masterAudioOutput.audioContext) return;
    const delayedAudible = masterAudioOutput.audioContext.createDelay(1);

    if (visualizerSettings.waveSurfer.enabled) {
        delayedAudible.delayTime.value = 0.1;
    }

    delayNodeBus.unshift(delayedAudible);

    input.connect(delayNodeBus[0]);
    delayNodeBus[0].connect(output);
}

/**
 * Creates a gain node for the media element.
 * @param {HTMLMediaElement} elem - The media element.
 */
export function createGainNode(elem: HTMLMediaElement) {
    if (!masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        console.log('MasterAudio is not initialized');
        return;
    }

    const gainNode = masterAudioOutput.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, masterAudioOutput.audioContext.currentTime);
    audioNodeBus.unshift(gainNode);

    const source = masterAudioOutput.audioContext.createMediaElementSource(elem);
    createBuffer(source, audioNodeBus[0] );
    audioNodeBus[0].connect(masterAudioOutput.mixerNode);
}

