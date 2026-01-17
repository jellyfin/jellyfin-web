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
let canvasTransferred = false;

/**
 * Check if the canvas has been transferred to OffscreenCanvas
 */
export function isCanvasTransferred(): boolean {
    return canvasTransferred;
}

/**
 * Set the canvas transferred state
 */
export function setCanvasTransferred(value: boolean): void {
    canvasTransferred = value;
}

/**
 * Checks if OffscreenCanvas is supported and can be used with WebGL
 */
export function isOffscreenCanvasSupported(): boolean {
    return typeof OffscreenCanvas !== 'undefined'
           && 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
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
    console.log('[Butterchurn] Starting initialization...');

    // Check if butterchurn library is available
    if (!butterchurn) {
        console.error('[Butterchurn] Butterchurn library not loaded');
        return;
    }

    if (!butterchurnPresets) {
        console.error('[Butterchurn] Butterchurn presets not loaded');
        return;
    }

    if (!masterAudioOutput.audioContext) {
        console.warn('[Butterchurn] AudioContext not available - cannot initialize');
        return;
    }

    if (!isButterchurnSupported()) {
        console.warn('[Butterchurn] Butterchurn not supported in this browser - cannot initialize');
        return;
    }

    // Skip in development environments where AudioWorklets fail to load
    const isDevelopment = typeof import.meta.url === 'string' && (
        import.meta.url.startsWith('file://')
        || import.meta.url.includes('localhost')
        || import.meta.url.includes('127.0.0.1')
        || window.location.protocol === 'file:'
    );

    if (isDevelopment) {
        console.info('[Butterchurn] Skipping AudioWorklet loading in development environment. Using fallback rendering.');
    }

    console.log('[Butterchurn] AudioContext and support check passed, proceeding with initialization');

    const options = {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio * 2 || 1,
        textureRatio: 2
    };

    try {
        // Always try regular canvas first for reliability
        console.log('[Butterchurn] Initializing with regular canvas');
        butterchurnInstance.visualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, canvas, options);
        console.log('[Butterchurn] Regular canvas initialized successfully');
    } catch (error) {
        console.error('[Butterchurn] Failed to create visualizer with regular canvas:', error);
        butterchurnInstance.visualizer = null;
        return;
    }

    // Optionally try OffscreenCanvas if supported (but don't fail if it doesn't work)
    if (isOffscreenCanvasSupported() && !canvasTransferred) {
        try {
            console.log('[Butterchurn] Attempting OffscreenCanvas upgrade for improved performance');
            // Set canvas size before transferring control
            canvas.width = options.width * options.pixelRatio;
            canvas.height = options.height * options.pixelRatio;
            const offscreenCanvas = (canvas as any).transferControlToOffscreen();
            canvasTransferred = true; // Mark canvas as transferred

            // Create new visualizer with OffscreenCanvas
            const newVisualizer = butterchurn.createVisualizer(masterAudioOutput.audioContext, offscreenCanvas, options);

            // Transfer audio connection and presets
            newVisualizer.connectAudio(masterAudioOutput.mixerNode);
            try {
                const currentPreset = butterchurnInstance.visualizer.getCurrentPreset();
                if (currentPreset) {
                    newVisualizer.loadPreset(currentPreset, 0);
                }
            } catch (presetError) {
                console.warn('[Butterchurn] Could not transfer preset to OffscreenCanvas:', presetError);
            }

            // Replace the old visualizer
            butterchurnInstance.visualizer = newVisualizer;
            console.log('[Butterchurn] OffscreenCanvas upgrade successful');
        } catch (error) {
            console.warn('[Butterchurn] OffscreenCanvas upgrade failed, keeping regular canvas:', error);
            // Keep the regular canvas visualizer
        }
    }

    if (!butterchurnInstance.visualizer) {
        console.error('[Butterchurn] Visualizer creation failed');
        return;
    }

    console.log('[Butterchurn] Visualizer created successfully');

    // Connect your audio source (e.g., mixerNode) to the visualizer
    try {
        butterchurnInstance.visualizer.connectAudio(masterAudioOutput.mixerNode);
        console.log('[Butterchurn] Audio connection established');
    } catch (error) {
        console.error('[Butterchurn] Failed to connect audio:', error);
        return;
    }

    let presets: any;
    let presetNames: string[];

    try {
        presets = butterchurnPresets.getPresets();
        presetNames = Object.keys(presets);
        console.log(`[Butterchurn] Loaded ${presetNames.length} presets`);
    } catch (error) {
        console.error('[Butterchurn] Failed to load presets:', error);
        return;
    }

    const loadNextPreset = () => {
        if (!butterchurnInstance.visualizer) return;

        clearInterval(presetSwitchInterval);

        try {
            const randomIndex = Math.floor(Math.random() * presetNames.length);
            const nextPresetName = presetNames[randomIndex];
            const nextPreset = presets[nextPresetName];
            if (nextPreset) {
                butterchurnInstance.visualizer.loadPreset(nextPreset, xDuration.fadeOut || 0);
                console.debug(`[Butterchurn] Loaded preset: ${nextPresetName}`);
            }
        } catch (error) {
            console.error('[Butterchurn] Failed to load preset:', error);
        }

        if (visualizerSettings.butterchurn.presetInterval > 10) {
            presetSwitchInterval = setInterval(loadNextPreset, visualizerSettings.butterchurn.presetInterval * 1000);
        }
    };

    // Load the initial preset
    loadNextPreset();
    butterchurnInstance.nextPreset = loadNextPreset;

    // Custom animation loop using requestAnimationFrame
    let frameCount = 0;
    const animate = () => {
        if (!isVisible()) {
            return;
        }
        try {
            butterchurnInstance.visualizer.render();
            frameCount++;
            if (frameCount % 300 === 0) { // Log every 300 frames (~5 seconds at 60fps)
                console.debug(`[Butterchurn] Rendered ${frameCount} frames`);
            }
            requestAnimationFrame(animate);
        } catch (error) {
            console.error('[Butterchurn] Render error:', error);
            // Stop animation loop on error
        }
    };
    animate();

    butterchurnInstance.destroy = () => {
        clearInterval(presetSwitchInterval);
        butterchurnInstance.visualizer.disconnectAudio(masterAudioOutput.mixerNode);
    };

    // Note: setInterval is already set up inside loadNextPreset() when called at line 119
    // Do NOT add another setInterval here - it would cause presets to change twice as fast
}

