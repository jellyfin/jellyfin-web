import { getVisualizerInputValues, visualizerSettings } from 'components/visualizer/visualizers.logic';

/// <reference types="vitest/globals" />

// Mock userSettings to prevent globalize from failing
vi.mock('../../scripts/settings/userSettings', () => ({}));

function resetVisualizerDefaults(): void {
    visualizerSettings.butterchurn.enabled = false;
    visualizerSettings.butterchurn.presetInterval = 60;
    visualizerSettings.frequencyAnalyzer.enabled = false;
    visualizerSettings.waveSurfer.enabled = false;
}

function setupForm(): HTMLFormElement {
    const form = document.createElement('form');

    const chkButterchurn = document.createElement('input');
    chkButterchurn.type = 'checkbox';
    chkButterchurn.className = 'chkEnableButterchurn';
    form.appendChild(chkButterchurn);

    const sliderButterchurn = document.createElement('input');
    sliderButterchurn.type = 'range';
    sliderButterchurn.id = 'sliderButterchurnPresetInterval';
    sliderButterchurn.value = '60';
    form.appendChild(sliderButterchurn);

    const chkFrequencyAnalyzer = document.createElement('input');
    chkFrequencyAnalyzer.type = 'checkbox';
    chkFrequencyAnalyzer.className = 'chkEnableFrequencyAnalyzer';
    form.appendChild(chkFrequencyAnalyzer);

    const chkWaveSurfer = document.createElement('input');
    chkWaveSurfer.type = 'checkbox';
    chkWaveSurfer.className = 'chkEnableWavesurfer';
    form.appendChild(chkWaveSurfer);

    document.body.appendChild(form);
    return form;
}

beforeEach(() => {
    document.body.innerHTML = '';
    resetVisualizerDefaults();
});

describe('playbackSettings - simplified visualizer inputs', () => {
    it('collects visualizer toggles and preset interval from the form', () => {
        const form = setupForm();

        (form.querySelector('.chkEnableButterchurn') as HTMLInputElement).checked = true;
        (form.querySelector('#sliderButterchurnPresetInterval') as HTMLInputElement).value = '30';
        (form.querySelector('.chkEnableFrequencyAnalyzer') as HTMLInputElement).checked = true;
        (form.querySelector('.chkEnableWavesurfer') as HTMLInputElement).checked = true;

        const result = getVisualizerInputValues(form);

        expect(result.butterchurn.enabled).toBe(true);
        expect(result.butterchurn.presetInterval).toBe(30);
        expect(result.frequencyAnalyzer.enabled).toBe(true);
        expect(result.waveSurfer.enabled).toBe(true);
    });

    it('returns default values when form elements are not checked', () => {
        const form = setupForm();

        const result = getVisualizerInputValues(form);

        expect(result.butterchurn.enabled).toBe(false);
        expect(result.butterchurn.presetInterval).toBe(60);
        expect(result.frequencyAnalyzer.enabled).toBe(false);
        expect(result.waveSurfer.enabled).toBe(false);
    });
});
