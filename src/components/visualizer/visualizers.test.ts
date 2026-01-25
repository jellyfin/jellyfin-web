import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePreferencesStore } from '../../store/preferencesStore';

describe('visualizerSettings - Data Structure in Store', () => {
    beforeEach(() => {
        usePreferencesStore.getState().resetAllPreferences();
    });

    describe('preferencesStore visualizer object', () => {
        it('should have frequencyAnalyzer settings', () => {
            const { visualizer: state } = usePreferencesStore.getState();
            expect(state).toHaveProperty('frequencyAnalyzer');
            expect(state.frequencyAnalyzer).toHaveProperty('opacity');
            expect(state.frequencyAnalyzer).toHaveProperty('colorScheme');
            expect(state.frequencyAnalyzer).toHaveProperty('colors');
        });

        it('should have waveSurfer settings', () => {
            const { visualizer: state } = usePreferencesStore.getState();
            expect(state).toHaveProperty('waveSurfer');
            expect(state.waveSurfer).toHaveProperty('opacity');
            expect(state.waveSurfer).toHaveProperty('colorScheme');
            expect(state.waveSurfer).toHaveProperty('colors');
        });

        it('should have butterchurn settings', () => {
            const { visualizer: state } = usePreferencesStore.getState();
            expect(state).toHaveProperty('butterchurn');
            expect(state.butterchurn).toHaveProperty('opacity');
            expect(state.butterchurn).toHaveProperty('presetInterval');
            expect(state.butterchurn).toHaveProperty('transitionSpeed');
        });

        it('should have sitback settings', () => {
            const { visualizer: state } = usePreferencesStore.getState();
            expect(state).toHaveProperty('sitback');
            expect(state.sitback).toHaveProperty('trackInfoDuration');
            expect(state.sitback).toHaveProperty('autoHideTimer');
        });

        it('should have advanced settings', () => {
            const { visualizer: state } = usePreferencesStore.getState();
            expect(state).toHaveProperty('advanced');
            expect(state.advanced).toHaveProperty('fftSize');
            expect(state.advanced).toHaveProperty('limiterThreshold');
        });
    });

    describe('visualizerSettings - Settings Management via Store', () => {
        it('should update frequency analyzer through type-specific logic', () => {
            const store = usePreferencesStore.getState();
            store.setVisualizerType('frequency');
            store.setVisualizerColorScheme('gradient');

            expect(usePreferencesStore.getState().visualizer.frequencyAnalyzer.colorScheme).toBe('gradient');
        });

        it('should handle import of legacy-like structures', () => {
            const savedSettings = {
                enabled: true,
                type: 'waveform' as const,
                waveSurfer: {
                    opacity: 0.5,
                    colorScheme: 'monochrome' as const
                }
            };

            usePreferencesStore.getState().importPreferences({ visualizer: savedSettings as any });

            const state = usePreferencesStore.getState().visualizer;
            expect(state.enabled).toBe(true);
            expect(state.type).toBe('waveform');
            expect(state.waveSurfer.opacity).toBe(0.5);
            expect(state.waveSurfer.colorScheme).toBe('monochrome');
        });
    });
});
