/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';
import { xDuration } from 'components/audioEngine/crossfader.logic';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
import { visualizerSettings } from './visualizers.logic';
// @ts-ignore
import isButterchurnSupported from 'butterchurn/lib/isSupported.min';
import { isVisible } from '../../utils/visibility';

let presetSwitchInterval: NodeJS.Timeout;

export const butterchurnInstance: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visualizer: any;
    nextPreset: () => void;
    destroy: () => void;
} = {
    visualizer: null,
    nextPreset: () => {
        // empty
    },
    destroy: () => {
        // empty
    }

    /* eslint-enable @typescript-eslint/ban-ts-comment */
};

export function initializeButterChurn(canvas: HTMLCanvasElement) {
    if (!masterAudioOutput.audioContext || !isButterchurnSupported()) {
        return;
    }

    butterchurnInstance.visualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, canvas, {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio * 2 || 1,
        textureRatio: 2
    });

    // Connect your audio source (e.g., mixerNode) to the visualizer
    butterchurnInstance.visualizer.connectAudio(masterAudioOutput.mixerNode);

    const presets = butterchurnPresets.getPresets();
    const presetNames = Object.keys(presets);

    const loadNextPreset = () => {
        clearInterval(presetSwitchInterval);

        const randomIndex = Math.floor(Math.random() * presetNames.length);
        const nextPresetName = presetNames[randomIndex];
        const nextPreset = presets[nextPresetName];
        if (nextPreset) {
            butterchurnInstance.visualizer.loadPreset(nextPreset, xDuration.fadeOut); // Blend presets over 0 seconds
        }

        if (visualizerSettings.butterchurn.presetInterval > 10) {
            presetSwitchInterval = setInterval(loadNextPreset, visualizerSettings.butterchurn.presetInterval * 1000);
        }
    };
    // Load the initial preset
    loadNextPreset();
    butterchurnInstance.nextPreset = loadNextPreset;

    // Custom animation loop using requestAnimationFrame
    const animate = () => {
        if (!isVisible()) {
            return;
        }
        butterchurnInstance.visualizer.render();
        requestAnimationFrame(animate);
    };
    animate();

    butterchurnInstance.destroy = () => {
        clearInterval(presetSwitchInterval);
        butterchurnInstance.visualizer.disconnectAudio(masterAudioOutput.mixerNode);
    };

    if (visualizerSettings.butterchurn.presetInterval > 10) {
    // Switch presets every predetermined interval in seconds
        presetSwitchInterval = setInterval(loadNextPreset, visualizerSettings.butterchurn.presetInterval * 1000);
    }
}

