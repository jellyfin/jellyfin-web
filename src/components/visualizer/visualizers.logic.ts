import * as userSettings from '../../scripts/settings/userSettings';

export const visualizerSettings = {
    butterchurn: {
        enabled: false,
        opacity: 0.6, // slider value from 0 - 1
        smoothingTime: 0, // value from 0 - 10
        presetInterval: 60 // slider value from 0 - 120
    },
    frequencyAnalyzer: {
        enabled: false,
        opacity: 0.6, // value from 0 - 1
        smoothingTime: 0, // value from 0 - 10
        color: 'rgb(30, 210, 75)'
    },
    waveSurfer: {
        enabled: false,
        opacity: 0, // value from 0 - 1
        smoothingTime: 0, // value from 0 - 10
        color: {
            left: 'rgb(1, 1, 1)',
            right: 'rgb(1, 1, 1)',
            cursor: 'rgb(1, 1, 1)'
        }
    },
    sitBack: {
        enabled: false,
        fullscreenCoverArt: false,
        playlist: true,
        backdropOpacity: 0 // value from 0 - 1
    }
};

export function getVisualizerSettings () {
    return JSON.stringify(visualizerSettings);
}

export function setVisualizerSettings (savedSettings: typeof visualizerSettings) {
    if (!savedSettings) return;

    visualizerSettings.butterchurn = savedSettings?.butterchurn;
    visualizerSettings.frequencyAnalyzer = savedSettings?.frequencyAnalyzer;
    visualizerSettings.sitBack = savedSettings?.sitBack;
    visualizerSettings.waveSurfer = savedSettings?.waveSurfer;
}

export function getSavedVisualizerSettings() {
    return userSettings.visualizerConfiguration(undefined);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getVisualizerInputValues(context: any) {
    visualizerSettings.butterchurn.enabled = context.querySelector('.chkEnableButterchurn').checked;
    visualizerSettings.butterchurn.presetInterval = context.querySelector('#sliderButterchurnPresetInterval').value;
    visualizerSettings.frequencyAnalyzer.enabled = context.querySelector('.chkEnableFrequencyAnalyzer').checked;
    visualizerSettings.waveSurfer.enabled = context.querySelector('.chkEnableWavesurfer').checked;

    return visualizerSettings;
}
