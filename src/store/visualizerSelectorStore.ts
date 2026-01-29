/**
 * Visualizer-Specific Selectors
 *
 * Granular selectors for visualizer preferences to enable fine-grained reactivity
 * without re-renders from unrelated preference changes (audio, UI, etc.)
 *
 * This pattern allows components to subscribe only to the specific visualizer
 * properties they need, preventing re-renders when other domains change.
 */

import { usePreferencesStore } from './preferencesStore';
import type { VisualizerPreferences } from './preferencesStore';

/**
 * Hook: Get only visualizer enable/type (minimal subscription)
 * Use for: Visualizers component that decides which visualizer to render
 */
export function useVisualizerTypeState() {
    return usePreferencesStore(state => ({
        enabled: state.visualizer.enabled,
        type: state.visualizer.type,
        showVisualizer: state.ui.showVisualizer
    }));
}

/**
 * Hook: Get frequency analyzer specific settings
 * Use for: FrequencyAnalyzer component
 */
export function useFrequencyAnalyzerSettings() {
    return usePreferencesStore(state => ({
        fftSize: state.visualizer.advanced.fftSize,
        sensitivity: state.visualizer.sensitivity,
        smoothing: state.visualizer.smoothing,
        frequencyAnalyzer: state.visualizer.frequencyAnalyzer,
        barCount: state.visualizer.barCount
    }));
}

/**
 * Hook: Get waveform/WaveSurfer specific settings
 * Use for: WaveSurferVisualizer component
 */
export function useWaveSurferSettings() {
    return usePreferencesStore(state => ({
        opacity: state.visualizer.waveSurfer.opacity,
        colorScheme: state.visualizer.waveSurfer.colorScheme,
        colors: state.visualizer.waveSurfer.colors
    }));
}

/**
 * Hook: Get Butterchurn specific settings
 * Use for: Butterchurn visualizer
 */
export function useButterchurnSettings() {
    return usePreferencesStore(state => ({
        opacity: state.visualizer.butterchurn.opacity,
        presetInterval: state.visualizer.butterchurn.presetInterval,
        transitionSpeed: state.visualizer.butterchurn.transitionSpeed,
        preset: state.visualizer.butterchurn.preset
    }));
}

/**
 * Hook: Get 3D visualizer specific settings
 * Use for: ThreeDimensionVisualizer
 */
export function useThreeDSettings() {
    return usePreferencesStore(state => ({
        renderer: state.visualizer.threeJs.renderer,
        fftSize: state.visualizer.advanced.fftSize,
        sensitivity: state.visualizer.sensitivity,
        smoothing: state.visualizer.smoothing
    }));
}

/**
 * Hook: Get visualizer UI/display settings
 * Use for: VisualizerSettings component and related UI
 */
export function useVisualizerUISettings() {
    return usePreferencesStore(state => ({
        enabled: state.visualizer.enabled,
        type: state.visualizer.type,
        showVisualizer: state.ui.showVisualizer,
        animationsEnabled: state.ui.animationsEnabled,
        reducedMotion: state.ui.reducedMotion
    }));
}

/**
 * Hook: Get visualizer advanced settings
 * Use for: VisualizerSettings advanced controls
 */
export function useVisualizerAdvancedSettings() {
    return usePreferencesStore(state => ({
        fftSize: state.visualizer.advanced.fftSize,
        limiterThreshold: state.visualizer.advanced.limiterThreshold,
        sensitivity: state.visualizer.sensitivity,
        smoothing: state.visualizer.smoothing,
        barCount: state.visualizer.barCount
    }));
}

/**
 * Hook: Get complete visualizer state (when you need everything)
 * Use sparingly - only when component needs all visualizer settings
 */
export function useCompleteVisualizerSettings(): VisualizerPreferences {
    return usePreferencesStore(state => state.visualizer);
}
