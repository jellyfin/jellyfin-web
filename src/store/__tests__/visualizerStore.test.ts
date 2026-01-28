import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferencesStore } from '../preferencesStore';

describe('preferencesStore - Visualizer', () => {
    beforeEach(() => {
        usePreferencesStore.getState().resetAllPreferences();
    });

    it('should have correct default visualizer settings', () => {
        const state = usePreferencesStore.getState().visualizer;
        expect(state.enabled).toBe(false);
        expect(state.type).toBe('butterchurn');
        expect(state.frequencyAnalyzer.colorScheme).toBe('spectrum');
        expect(state.waveSurfer.opacity).toBe(0.7);
    });

    it('should update visualizer enabled state', () => {
        usePreferencesStore.getState().setVisualizerEnabled(false);
        expect(usePreferencesStore.getState().visualizer.enabled).toBe(false);
    });

    it('should update visualizer type', () => {
        usePreferencesStore.getState().setVisualizerType('waveform');
        expect(usePreferencesStore.getState().visualizer.type).toBe('waveform');
    });

    it('should handle butterchurn preset updates', () => {
        usePreferencesStore.getState().setButterchurnPreset('Nebula');
        expect(usePreferencesStore.getState().visualizer.butterchurn.preset).toBe('Nebula');
    });

    it('should update color scheme based on active type', () => {
        // Test frequency analyzer color scheme
        usePreferencesStore.getState().setVisualizerType('frequency');
        usePreferencesStore.getState().setVisualizerColorScheme('gradient');
        expect(usePreferencesStore.getState().visualizer.frequencyAnalyzer.colorScheme).toBe('gradient');

        // Test wave surfer color scheme
        usePreferencesStore.getState().setVisualizerType('waveform');
        usePreferencesStore.getState().setVisualizerColorScheme('monochrome');
        expect(usePreferencesStore.getState().visualizer.waveSurfer.colorScheme).toBe('monochrome');
    });

    it('should update opacity based on active type', () => {
        usePreferencesStore.getState().setVisualizerType('butterchurn');
        usePreferencesStore.getState().setVisualizerOpacity(0.5);
        expect(usePreferencesStore.getState().visualizer.butterchurn.opacity).toBe(0.5);

        usePreferencesStore.getState().setVisualizerType('frequency');
        usePreferencesStore.getState().setVisualizerOpacity(0.9);
        expect(usePreferencesStore.getState().visualizer.frequencyAnalyzer.opacity).toBe(0.9);

        usePreferencesStore.getState().setVisualizerType('waveform');
        usePreferencesStore.getState().setVisualizerOpacity(0.3);
        expect(usePreferencesStore.getState().visualizer.waveSurfer.opacity).toBe(0.3);
    });

    it('should handle fftSize updates', () => {
        usePreferencesStore.getState().setFftSize(1024);
        expect(usePreferencesStore.getState().visualizer.advanced.fftSize).toBe(1024);
    });

    it('should handle global visualizer settings (sensitivity, barCount, smoothing)', () => {
        const store = usePreferencesStore.getState();
        store.setSensitivity(75);
        store.setBarCount(128);
        store.setSmoothing(0.5);

        const state = usePreferencesStore.getState().visualizer;
        expect(state.sensitivity).toBe(75);
        expect(state.barCount).toBe(128);
        expect(state.smoothing).toBe(0.5);
    });

    it('should clamp global visualizer settings', () => {
        const store = usePreferencesStore.getState();

        store.setSensitivity(150); // Max 100
        expect(usePreferencesStore.getState().visualizer.sensitivity).toBe(100);

        store.setSensitivity(-10); // Min 1
        expect(usePreferencesStore.getState().visualizer.sensitivity).toBe(1);

        store.setBarCount(512); // Max 256
        expect(usePreferencesStore.getState().visualizer.barCount).toBe(256);
    });

    it('should handle nested settings import', () => {
        const partialSettings = {
            type: 'frequency' as const,
            frequencyAnalyzer: {
                opacity: 0.4,
                colorScheme: 'solid' as const
            }
        };

        usePreferencesStore.getState().importPreferences({ visualizer: partialSettings as any });

        const state = usePreferencesStore.getState().visualizer;
        expect(state.type).toBe('frequency');
        expect(state.frequencyAnalyzer.opacity).toBe(0.4);
        expect(state.frequencyAnalyzer.colorScheme).toBe('solid');
        // Check that other defaults were preserved (merged properly)
        expect(state.frequencyAnalyzer.colors.solid).toBe('#1ED24B');
    });
});
