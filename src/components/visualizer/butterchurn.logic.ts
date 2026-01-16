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

/**
 * Checks if OffscreenCanvas is supported and can be used with WebGL
 */
export function isOffscreenCanvasSupported(): boolean {
    return typeof OffscreenCanvas !== 'undefined' &&
           'transferControlToOffscreen' in HTMLCanvasElement.prototype;
}

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
        if (butterchurnInstance.visualizer) {
            butterchurnInstance.visualizer.disconnectAudio(masterAudioOutput.mixerNode);
            butterchurnInstance.visualizer = null;
        }
        clearInterval(presetSwitchInterval);
    }

    /* eslint-enable @typescript-eslint/ban-ts-comment */
};

export function initializeButterChurn(canvas: HTMLCanvasElement) {
    if (!masterAudioOutput.audioContext || !isButterchurnSupported()) {
        return;
    }

    if (isOffscreenCanvasSupported()) {
        try {
            console.log('[Butterchurn] Attempting OffscreenCanvas for improved performance');
            // Set canvas size before transferring control
            const options = {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio * 2 || 1,
                textureRatio: 2
            };
            canvas.width = options.width * options.pixelRatio;
            canvas.height = options.height * options.pixelRatio;
            const offscreenCanvas = (canvas as any).transferControlToOffscreen();
            butterchurnInstance.visualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, offscreenCanvas, options);
            console.log('[Butterchurn] OffscreenCanvas initialized successfully');
        } catch (error) {
            console.warn('[Butterchurn] OffscreenCanvas failed, falling back to regular canvas:', error);
            butterchurnInstance.visualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, canvas, {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio * 2 || 1,
                textureRatio: 2
            });
        }
    } else {
        console.log('[Butterchurn] OffscreenCanvas not supported, using regular canvas');
        butterchurnInstance.visualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, canvas, {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio * 2 || 1,
            textureRatio: 2
        });
    }

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

