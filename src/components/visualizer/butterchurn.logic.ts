/* eslint-disable @typescript-eslint/ban-ts-comment */
import logger from 'utils/logger';
// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';
import { usePreferencesStore, getCrossfadeFadeOut } from '../../store/preferencesStore';
import { useAudioStore } from '../../store/audioStore';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
// @ts-ignore
import isButterchurnSupported from 'butterchurn/lib/isSupported.min';
import { isVisible } from '../../utils/visibility';

interface AudioCapabilities {
    getCapabilities(): Promise<{
        visualizers: { butterchurn: boolean };
    }>;
}

let audioCapabilities: AudioCapabilities | null = null;
let audioCapabilitiesLoaded = false;

async function loadAudioCapabilities(): Promise<AudioCapabilities> {
    if (!audioCapabilitiesLoaded || !audioCapabilities) {
        const module = await import('components/audioEngine/audioCapabilities');
        audioCapabilities = module.default as AudioCapabilities;
        audioCapabilitiesLoaded = true;
    }
    return audioCapabilities;
}

let presetSwitchInterval: NodeJS.Timeout;
let animationFrameId: number | null = null;
let isAnimationRunning = false;
let visibilityHandler: (() => void) | null = null;
let animateFrame: (() => void) | null = null;

export interface ButterchurnVisualizer {
    setRendererSize(width: number, height: number): void;
    disconnectAudio(node: AudioNode): void;
    connectAudio(node: AudioNode): void;
    loadPreset(preset: unknown, blendTime: number): void;
    render(): void;
}

export const butterchurnInstance: {
    visualizer: ButterchurnVisualizer | null;
    nextPreset: () => void;
    destroy: () => void;
} = {
    visualizer: null,
    nextPreset: () => {
        // empty
    },
    destroy: () => {
        if (butterchurnInstance.visualizer) {
            // @ts-ignore
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
};

async function validateButterchurnPrerequisites(): Promise<boolean> {
    if (!butterchurn) {
        logger.error('Butterchurn library not loaded', { component: 'Butterchurn' });
        return false;
    }

    if (!butterchurnPresets) {
        logger.error('Butterchurn presets not loaded', { component: 'Butterchurn' });
        return false;
    }

    if (!useAudioStore.getState().audioContext) {
        logger.warn('AudioContext not available - cannot initialize', { component: 'Butterchurn' });
        return false;
    }

    if (!isButterchurnSupported()) {
        logger.warn('Butterchurn not supported in this browser - cannot initialize', { component: 'Butterchurn' });
        return false;
    }

    const audioCaps = await loadAudioCapabilities();
    const capabilities = await audioCaps.getCapabilities();
    if (!capabilities.visualizers.butterchurn) {
        logger.warn('Butterchurn disabled by capabilities check - cannot initialize', { component: 'Butterchurn' });
        return false;
    }

    return true;
}

function createVisualizerOptions() {
    // Detect device capability to balance quality vs performance
    // Use 2x only on high-end devices (high DPI + high resolution)
    const dpr = window.devicePixelRatio || 1;
    const isHighEndDevice = dpr >= 2 && (window.innerWidth >= 2560 || window.innerHeight >= 1440);
    const pixelRatioMultiplier = isHighEndDevice ? 2 : 1;

    return {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: Math.min(dpr * pixelRatioMultiplier, 3), // Cap at 3x max
        textureRatio: isHighEndDevice ? 2 : 1 // Reduce texture ratio on standard devices
    };
}

function createInitialVisualizer(
    audioContext: AudioContext,
    canvas: HTMLCanvasElement,
    options: ReturnType<typeof createVisualizerOptions>
) {
    try {
        logger.info('Initializing with regular canvas', { component: 'Butterchurn' });
        const visualizer = butterchurn.createVisualizer(audioContext, canvas, options);
        logger.info('Regular canvas initialized successfully', { component: 'Butterchurn' });
        return visualizer;
    } catch (error) {
        logger.error('Failed to create visualizer with regular canvas', {
            component: 'Butterchurn',
            error: error as Error
        });
        return null;
    }
}

function setupPresetsAndAnimation() {
    let presets: Record<string, unknown>;
    let presetNames: string[];
    let frameCount = 0;

    try {
        presets = butterchurnPresets.getPresets();
        presetNames = Object.keys(presets);
        logger.info(`Loaded ${presetNames.length} presets`, { component: 'Butterchurn' });
    } catch (error) {
        logger.error('Failed to load presets', { component: 'Butterchurn', error: error as Error });
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
                // @ts-ignore
                butterchurnInstance.visualizer.loadPreset(
                    nextPreset,
                    getCrossfadeFadeOut(usePreferencesStore.getState().crossfade.crossfadeDuration) || 0
                );
                logger.debug(`Loaded preset: ${nextPresetName}`, { component: 'Butterchurn' });
            }
        } catch (error) {
            logger.error('Failed to load preset', { component: 'Butterchurn', error: error as Error });
        }

        const { butterchurn } = usePreferencesStore.getState().visualizer;
        if (butterchurn.presetInterval > 10) {
            presetSwitchInterval = setInterval(loadNextPreset, butterchurn.presetInterval * 1000);
        }
    };

    loadNextPreset();
    butterchurnInstance.nextPreset = loadNextPreset;

    animateFrame = () => {
        if (!isVisible()) {
            isAnimationRunning = false;
            animationFrameId = null;
            return;
        }

        try {
            // @ts-ignore
            butterchurnInstance.visualizer.render();
            frameCount++;
            if (frameCount % 300 === 0) {
                logger.debug(`Rendered ${frameCount} frames`, { component: 'Butterchurn' });
            }
            animationFrameId = requestAnimationFrame(animateFrame!);
        } catch (error) {
            logger.error('Render error', { component: 'Butterchurn', error: error as Error });
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
        // @ts-ignore
        butterchurnInstance.visualizer.disconnectAudio(masterAudioOutput.mixerNode);
    };

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
    logger.info('Starting initialization', { component: 'Butterchurn' });

    if (!(await validateButterchurnPrerequisites())) {
        return;
    }

    const isDevelopment =
        typeof import.meta.url === 'string' &&
        (import.meta.url.startsWith('file://') ||
            import.meta.url.includes('localhost') ||
            import.meta.url.includes('127.0.0.1') ||
            window.location.protocol === 'file:');

    if (isDevelopment) {
        logger.info('Skipping AudioWorklet loading in development environment. Using fallback rendering.', {
            component: 'Butterchurn'
        });
    }

    logger.info('AudioContext and support check passed, proceeding with initialization', { component: 'Butterchurn' });

    const options = createVisualizerOptions();

    const audioContext = useAudioStore.getState().audioContext;
    butterchurnInstance.visualizer = createInitialVisualizer(audioContext!, canvas, options);
    if (!butterchurnInstance.visualizer) {
        logger.error('Visualizer creation failed', { component: 'Butterchurn' });
        return;
    }

    logger.info('Visualizer created successfully', { component: 'Butterchurn' });

    try {
        // @ts-ignore
        butterchurnInstance.visualizer.connectAudio(masterAudioOutput.mixerNode);
        logger.info('Audio connection established', { component: 'Butterchurn' });
    } catch (error) {
        logger.error('Failed to connect audio', { component: 'Butterchurn', error: error as Error });
        return;
    }

    setupPresetsAndAnimation();

    if (isVisible() && !isAnimationRunning && butterchurnInstance.visualizer && animateFrame) {
        isAnimationRunning = true;
        animationFrameId = requestAnimationFrame(animateFrame);
    }
}
