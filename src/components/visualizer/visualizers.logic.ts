import * as userSettings from '../../scripts/settings/userSettings';

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
    if (!savedSettings) {
        const defaults = getDefaultVisualizerSettings();
        visualizerSettings.butterchurn = defaults.butterchurn;
        visualizerSettings.frequencyAnalyzer = defaults.frequencyAnalyzer;
        visualizerSettings.waveSurfer = defaults.waveSurfer;
        visualizerSettings.sitback = defaults.sitback;
        visualizerSettings.advanced = defaults.advanced;
        return;
    }

    const legacySitback = savedSettings?.sitback || savedSettings?.sitBack;

    visualizerSettings.butterchurn = { ...defaultVisualizerSettings.butterchurn, ...savedSettings?.butterchurn };
    visualizerSettings.frequencyAnalyzer = { ...defaultVisualizerSettings.frequencyAnalyzer, ...savedSettings?.frequencyAnalyzer };
    visualizerSettings.waveSurfer = { ...defaultVisualizerSettings.waveSurfer, ...savedSettings?.waveSurfer };
    visualizerSettings.sitback = { ...defaultVisualizerSettings.sitback, ...legacySitback };
    visualizerSettings.advanced = { ...defaultVisualizerSettings.advanced, ...savedSettings?.advanced };
}

export function getSavedVisualizerSettings() {
    return userSettings.visualizerConfiguration(undefined);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVisualizerInputValues(context: any) {
    visualizerSettings.butterchurn.enabled = context.querySelector('.chkEnableButterchurn').checked;
    const presetInterval = parseInt(
        context.querySelector('#sliderButterchurnPresetInterval').value,
        10
    );
    if (!Number.isNaN(presetInterval)) {
        visualizerSettings.butterchurn.presetInterval = presetInterval;
    }
    visualizerSettings.frequencyAnalyzer.enabled = context.querySelector('.chkEnableFrequencyAnalyzer').checked;
    visualizerSettings.waveSurfer.enabled = context.querySelector('.chkEnableWavesurfer').checked;

    return visualizerSettings;
}
