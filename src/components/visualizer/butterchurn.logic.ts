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
// Lazy load audio capabilities for better bundle splitting
let audioCapabilities: any;
let audioCapabilitiesLoaded = false;

async function loadAudioCapabilities() {
    if (!audioCapabilitiesLoaded) {
        const module = await import('components/audioEngine/audioCapabilities');
        audioCapabilities = module.default;
        audioCapabilitiesLoaded = true;
    }
    return audioCapabilities;
}

let presetSwitchInterval: NodeJS.Timeout;
let animationFrameId: number | null = null;
let isAnimationRunning = false;
let visibilityHandler: (() => void) | null = null;
let animateFrame: (() => void) | null = null;

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
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isAnimationRunning = false;
    }

    /* eslint-enable @typescript-eslint/ban-ts-comment */
};

/**
 * Validates initialization prerequisites for Butterchurn
 */
async function validateButterchurnPrerequisites(): Promise<boolean> {
    if (!butterchurn) {
        console.error('[Butterchurn] Butterchurn library not loaded');
        return false;
    }

    if (!butterchurnPresets) {
        console.error('[Butterchurn] Butterchurn presets not loaded');
        return false;
    }

    if (!masterAudioOutput.audioContext) {
        console.warn('[Butterchurn] AudioContext not available - cannot initialize');
        return false;
    }

    if (!isButterchurnSupported()) {
        console.warn('[Butterchurn] Butterchurn not supported in this browser - cannot initialize');
        return false;
    }

    // Additional check using centralized capabilities (lazy loaded)
    const audioCaps = await loadAudioCapabilities();
    const capabilities = await audioCaps.getCapabilities();
    if (!capabilities.visualizers.butterchurn) {
        console.warn('[Butterchurn] Butterchurn disabled by capabilities check - cannot initialize');
        return false;
    }

    return true;
}

/**
 * Creates the visualizer options object
 */
function createVisualizerOptions(): { width: number; height: number; pixelRatio: number; textureRatio: number } {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio * 2 || 1,
        textureRatio: 2
    };
}

/**
 * Creates the initial visualizer with regular canvas
 */
function createInitialVisualizer(audioContext: AudioContext, canvas: HTMLCanvasElement, options: ReturnType<typeof createVisualizerOptions>) {
    try {
        console.log('[Butterchurn] Initializing with regular canvas');
        const visualizer = butterchurn.createVisualizer(audioContext, canvas, options);
        console.log('[Butterchurn] Regular canvas initialized successfully');
        return visualizer;
    } catch (error) {
        console.error('[Butterchurn] Failed to create visualizer with regular canvas:', error);
        return null;
    }
}

/**
 * Loads presets and sets up preset switching
 */
function setupPresetsAndAnimation() {
    let presets: Record<string, unknown>;
    let presetNames: string[];
    let frameCount = 0;

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
            // eslint-disable-next-line sonarjs/pseudo-random
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
    animateFrame = () => {
        if (!isVisible()) {
            isAnimationRunning = false;
            animationFrameId = null;
            return;
        }

        try {
            butterchurnInstance.visualizer.render();
            frameCount++;
            if (frameCount % 300 === 0) {
                console.debug(`[Butterchurn] Rendered ${frameCount} frames`);
            }
            animationFrameId = requestAnimationFrame(animateFrame!);
        } catch (error) {
            console.error('[Butterchurn] Render error:', error);
            isAnimationRunning = false;
            animationFrameId = null;
        }
    };

    butterchurnInstance.destroy = () => {
        clearInterval(presetSwitchInterval);
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isAnimationRunning = false;
        if (visibilityHandler) {
            document.removeEventListener('visibilitychange', visibilityHandler);
            visibilityHandler = null;
        }
        butterchurnInstance.visualizer.disconnectAudio(masterAudioOutput.mixerNode);
    };

    // Handle visibility changes to pause/resume rendering
    visibilityHandler = () => {
        if (isVisible() && !isAnimationRunning && butterchurnInstance.visualizer && animateFrame) {
            isAnimationRunning = true;
            animationFrameId = requestAnimationFrame(animateFrame);
        }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    if (!isAnimationRunning && animateFrame) {
        isAnimationRunning = true;
        animationFrameId = requestAnimationFrame(animateFrame);
    }
}

export async function initializeButterChurn(canvas: HTMLCanvasElement) {
    console.log('[Butterchurn] Starting initialization...');

    if (!(await validateButterchurnPrerequisites())) {
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

    const options = createVisualizerOptions();

    butterchurnInstance.visualizer = createInitialVisualizer(masterAudioOutput.audioContext!, canvas, options);
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

    setupPresetsAndAnimation();

    // Start animation if visible
    if (isVisible() && !isAnimationRunning && butterchurnInstance.visualizer && animateFrame) {
        isAnimationRunning = true;
        animationFrameId = requestAnimationFrame(animateFrame);
    }

    // Note: setInterval is already set up inside loadNextPreset() when called at line 119
    // Do NOT add another setInterval here - it would cause presets to change twice as fast
}

