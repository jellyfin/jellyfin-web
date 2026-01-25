/**
 * Visualizer Store - Visualization State
 *
 * Zustand store for managing visualization preferences and state.
 * This store handles visualizer settings, crossfade zoom levels,
 * and mobile-specific visualization options.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VisualizerType = 'waveform' | 'frequency' | 'butterchurn' | 'threed';

export interface VisualizerState {
    // Visualizer settings
    enabled: boolean;
    type: VisualizerType;
    sensitivity: number;
    colorScheme: string;

    // Crossfade visualization
    crossfadeZoomLevel: number;
    showCrossfadeOverlap: boolean; // Show both waveforms during crossfade
    userZoomLevel: number; // User's preferred zoom level for waveform

    // Mobile settings
    mobileZoomLevel: number;

    // Actions
    setEnabled: (enabled: boolean) => void;
    setType: (type: VisualizerType) => void;
    setSensitivity: (sensitivity: number) => void;
    setColorScheme: (colorScheme: string) => void;
    setCrossfadeZoomLevel: (level: number) => void;
    setShowCrossfadeOverlap: (show: boolean) => void;
    setMobileZoomLevel: (level: number) => void;
    setUserZoomLevel: (level: number) => void;
    toggleEnabled: () => void;
}

export const useVisualizerStore = create<VisualizerState>()(
    persist(
        (set, _get) => ({
            // Initial state
            enabled: false,
            type: 'waveform',
            sensitivity: 50,
            colorScheme: 'default',
            crossfadeZoomLevel: 150,
            showCrossfadeOverlap: true,
            mobileZoomLevel: 100,
            userZoomLevel: 100,

            // Actions
            setEnabled: enabled => set({ enabled }),
            setType: type => set({ type }),
            setSensitivity: sensitivity =>
                set({
                    sensitivity: Math.max(0, Math.min(100, sensitivity))
                }),
            setColorScheme: colorScheme => set({ colorScheme }),
            setCrossfadeZoomLevel: crossfadeZoomLevel =>
                set({
                    crossfadeZoomLevel: Math.max(20, Math.min(200, crossfadeZoomLevel))
                }),
            setShowCrossfadeOverlap: showCrossfadeOverlap =>
                set({
                    showCrossfadeOverlap: showCrossfadeOverlap
                }),
            setMobileZoomLevel: mobileZoomLevel =>
                set({
                    mobileZoomLevel: Math.max(10, Math.min(200, mobileZoomLevel))
                }),
            setUserZoomLevel: userZoomLevel =>
                set({
                    userZoomLevel: Math.max(10, Math.min(500, userZoomLevel))
                }),
            toggleEnabled: () => set(state => ({ enabled: !state.enabled }))
        }),
        {
            name: 'jellyfin-visualizer-store',
            partialize: state => ({
                type: state.type,
                sensitivity: state.sensitivity,
                colorScheme: state.colorScheme,
                crossfadeZoomLevel: state.crossfadeZoomLevel,
                showCrossfadeOverlap: state.showCrossfadeOverlap,
                mobileZoomLevel: state.mobileZoomLevel,
                userZoomLevel: state.userZoomLevel
            })
        }
    )
);
