import * as userSettings from '../../scripts/settings/userSettings';

/**
 * Deep merge utility for nested objects
 * Recursively merges source into target, preserving nested structure
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T> | undefined): T {
    if (!source || typeof source !== 'object') {
        return target;
    }

    const result = { ...target };

    for (const key of Object.keys(source) as (keyof T)[]) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (
            sourceValue !== null
            && typeof sourceValue === 'object'
            && !Array.isArray(sourceValue)
            && targetValue !== null
            && typeof targetValue === 'object'
            && !Array.isArray(targetValue)
        ) {
            // Recursively merge nested objects
            result[key] = deepMerge(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>
            ) as T[keyof T];
        } else if (sourceValue !== undefined) {
            result[key] = sourceValue as T[keyof T];
        }
    }

    return result;
}

const defaultVisualizerSettings = {
    frequencyAnalyzer: {
        enabled: false,
        smoothing: 0.3, // 0-0.9
        opacity: 1.0, // 0.1-1.0
        colorScheme: 'spectrum', // 'spectrum' | 'solid' | 'albumArt' | 'gradient'
        colors: {
            solid: '#1ED24B',
            gradient: {
                low: '#1ED24B', // Bass
                mid: '#FFD700', // Mids
                high: '#FF3232' // Treble
            }
        }
    },
    waveSurfer: {
        enabled: false,
        opacity: 0.7, // 0.1-1.0
        colorScheme: 'albumArt', // 'albumArt' | 'monochrome' | 'stereo'
        colors: {
            monochrome: {
                wave: '#1ED24B',
                cursor: '#FFFFFF'
            },
            stereo: {
                left: '#1ED24B',
                right: '#FF3232',
                cursor: '#FFFFFF'
            }
        }
    },
    butterchurn: {
        enabled: false,
        opacity: 0.6, // 0.1-1.0
        presetInterval: 60, // seconds, 0 = manual only
        transitionSpeed: 2.7 // seconds
    },
    threeJs: {
        enabled: false,
        renderer: 'sphere' // 'sphere' | 'particles'
    },
    sitback: {
        trackInfoDuration: 5, // seconds
        autoHideTimer: 5 // seconds (mobile/TV only)
    },
    advanced: {
        fftSize: 4096, // 512 | 1024 | 2048 | 4096 | 8192
        limiterThreshold: -1 // dB, -6 to -0.5
    }
};

export const visualizerSettings = JSON.parse(JSON.stringify(defaultVisualizerSettings));

export function getDefaultVisualizerSettings() {
    return JSON.parse(JSON.stringify(defaultVisualizerSettings));
}

export function getVisualizerSettings () {
    return JSON.stringify(visualizerSettings);
}

export function setVisualizerSettings (savedSettings: any) {
    if (!savedSettings || typeof savedSettings !== 'object') {
        const defaults = getDefaultVisualizerSettings();
        visualizerSettings.butterchurn = defaults.butterchurn;
        visualizerSettings.threeJs = defaults.threeJs;
        visualizerSettings.frequencyAnalyzer = defaults.frequencyAnalyzer;
        visualizerSettings.waveSurfer = defaults.waveSurfer;
        visualizerSettings.sitback = defaults.sitback;
        visualizerSettings.advanced = defaults.advanced;
        return;
    }

    const legacySitback = savedSettings?.sitback || savedSettings?.sitBack;

    // Use deepMerge to properly handle nested objects like colors.gradient
    visualizerSettings.butterchurn = deepMerge(defaultVisualizerSettings.butterchurn, savedSettings?.butterchurn);
    visualizerSettings.threeJs = deepMerge(defaultVisualizerSettings.threeJs, savedSettings?.threeJs);
    visualizerSettings.frequencyAnalyzer = deepMerge(defaultVisualizerSettings.frequencyAnalyzer, savedSettings?.frequencyAnalyzer);
    visualizerSettings.waveSurfer = deepMerge(defaultVisualizerSettings.waveSurfer, savedSettings?.waveSurfer);
    visualizerSettings.sitback = deepMerge(defaultVisualizerSettings.sitback, legacySitback);
    visualizerSettings.advanced = deepMerge(defaultVisualizerSettings.advanced, savedSettings?.advanced);
}

export function getSavedVisualizerSettings() {
    return userSettings.visualizerConfiguration(undefined);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVisualizerInputValues(context: any) {
    const butterchurnCheckbox = context.querySelector('.chkEnableButterchurn');
    if (butterchurnCheckbox) {
        visualizerSettings.butterchurn.enabled = butterchurnCheckbox.checked;
    }

    const threeJsCheckbox = context.querySelector('.chkEnableThreeJs');
    if (threeJsCheckbox) {
        visualizerSettings.threeJs.enabled = threeJsCheckbox.checked;
    }

    const presetIntervalSlider = context.querySelector('#sliderButterchurnPresetInterval');
    if (presetIntervalSlider) {
        const presetInterval = parseInt(presetIntervalSlider.value, 10);
        if (!Number.isNaN(presetInterval)) {
            visualizerSettings.butterchurn.presetInterval = presetInterval;
        }
    }

    const freqAnalyzerCheckbox = context.querySelector('.chkEnableFrequencyAnalyzer');
    if (freqAnalyzerCheckbox) {
        visualizerSettings.frequencyAnalyzer.enabled = freqAnalyzerCheckbox.checked;
    }

    const waveSurferCheckbox = context.querySelector('.chkEnableWavesurfer');
    if (waveSurferCheckbox) {
        visualizerSettings.waveSurfer.enabled = waveSurferCheckbox.checked;
    }

    return visualizerSettings;
}
