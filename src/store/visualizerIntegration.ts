/**
 * Visualizer Store Integration
 *
 * Connects the visualizer system to the new store architecture.
 * Maintains backward compatibility with the audio engine while providing
 * store-based state management for visualizer settings and controls.
 */

import {
    useCurrentTime,
    useDuration,
    useIsMuted,
    usePlaybackStatus,
    useVisualizerEnabled,
    useVisualizerType,
    useVolume
} from './hooks';
import { useMediaStore, useSettingsStore } from './index';
import type { VisualizerSettings } from './settingsStore';

export interface VisualizerState {
    enabled: boolean;
    type: 'waveform' | 'frequency' | 'butterchurn' | 'threed';
    opacity: number;
    sensitivity: number;
    barCount: number;
    smoothing: number;
    presetInterval: number;
    transitionSpeed: number;
    colorScheme: 'default' | 'vintage' | 'neon' | 'warm' | 'cool';
}

export interface AudioData {
    frequencyData: Uint8Array;
    timeDomainData: Uint8Array;
    analyserNode: AnalyserNode | null;
    audioContext: AudioContext | null;
    sourceNode: MediaElementAudioSourceNode | null;
}

class VisualizerIntegration {
    private static instance: VisualizerIntegration;
    private audioData: AudioData;
    private listeners: Set<(data: AudioData) => void> = new Set();
    private animationFrameId: number | null = null;
    private isRunning = false;

    private constructor() {
        this.audioData = {
            frequencyData: new Uint8Array(0),
            timeDomainData: new Uint8Array(0),
            analyserNode: null,
            audioContext: null,
            sourceNode: null
        };
    }

    static getInstance(): VisualizerIntegration {
        if (!VisualizerIntegration.instance) {
            VisualizerIntegration.instance = new VisualizerIntegration();
        }
        return VisualizerIntegration.instance;
    }

    initialize(
        audioContext: AudioContext,
        analyserNode: AnalyserNode,
        sourceNode: MediaElementAudioSourceNode
    ): void {
        this.audioData.audioContext = audioContext;
        this.audioData.analyserNode = analyserNode;
        this.audioData.sourceNode = sourceNode;

        const fftSize = 4096;
        this.audioData.frequencyData = new Uint8Array(fftSize / 2) as Uint8Array;
        this.audioData.timeDomainData = new Uint8Array(fftSize) as Uint8Array;

        this.start();
    }

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private animate = (): void => {
        if (!this.isRunning) return;

        const { analyserNode } = this.audioData;
        if (analyserNode) {
            const freqData = this.audioData.frequencyData as unknown as Uint8Array;
            const timeData = this.audioData.timeDomainData as unknown as Uint8Array;
            (
                analyserNode as unknown as { getByteFrequencyData(data: Uint8Array): void }
            ).getByteFrequencyData(freqData);
            (
                analyserNode as unknown as { getByteTimeDomainData(data: Uint8Array): void }
            ).getByteTimeDomainData(timeData);

            for (const listener of this.listeners) {
                listener(this.audioData);
            }
        }

        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    subscribe(listener: (data: AudioData) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getAudioData(): AudioData {
        return { ...this.audioData };
    }

    getFrequencyData(): Uint8Array {
        return this.audioData.frequencyData;
    }

    getTimeDomainData(): Uint8Array {
        return this.audioData.timeDomainData;
    }

    getFrequencyValue(frequency: number): number {
        const { frequencyData, analyserNode } = this.audioData;
        if (!analyserNode) return 0;

        const nyquist = this.audioData.audioContext?.sampleRate ?? 44100 / 2;
        const index = Math.round((frequency / nyquist) * frequencyData.length);
        return frequencyData[Math.min(index, frequencyData.length - 1)] / 255;
    }

    destroy(): void {
        this.stop();
        this.listeners.clear();
        this.audioData = {
            frequencyData: new Uint8Array(0),
            timeDomainData: new Uint8Array(0),
            analyserNode: null,
            audioContext: null,
            sourceNode: null
        };
    }
}

export const visualizerIntegration = VisualizerIntegration.getInstance();

export function getVisualizerState(): VisualizerState {
    const settingsStore = useSettingsStore.getState();
    const { visualizer, ui } = settingsStore;

    return {
        enabled: visualizer.enabled && ui.showVisualizer,
        type: visualizer.type,
        opacity: 0.8,
        sensitivity: visualizer.sensitivity,
        barCount: visualizer.barCount,
        smoothing: visualizer.smoothing,
        presetInterval: visualizer.type === 'butterchurn' ? 60 : 0,
        transitionSpeed: visualizer.type === 'butterchurn' ? 2.7 : 0,
        colorScheme: visualizer.colorScheme
    };
}

export function useVisualizerState(): VisualizerState {
    const enabled = useVisualizerEnabled();
    const type = useVisualizerType();
    const settingsStore = useSettingsStore.getState();
    const { visualizer } = settingsStore;

    return {
        enabled,
        type,
        opacity: 0.8,
        sensitivity: visualizer.sensitivity,
        barCount: visualizer.barCount,
        smoothing: visualizer.smoothing,
        presetInterval: type === 'butterchurn' ? 60 : 0,
        transitionSpeed: type === 'butterchurn' ? 2.7 : 0,
        colorScheme: visualizer.colorScheme
    };
}

export function useAudioEngineState() {
    const volume = useVolume();
    const isMuted = useIsMuted();
    const playbackStatus = usePlaybackStatus();
    const currentTime = useCurrentTime();
    const duration = useDuration();

    return {
        volume,
        isMuted,
        isPlaying: playbackStatus === 'playing',
        isPaused: playbackStatus === 'paused' || playbackStatus === 'idle',
        isBuffering: playbackStatus === 'buffering',
        currentTime,
        duration,
        progress: duration > 0 ? currentTime / duration : 0
    };
}

export function getAudioEngineState() {
    const settingsStore = useSettingsStore.getState();
    const mediaStore = useMediaStore.getState();

    return {
        volume: settingsStore.audio.volume,
        isMuted: settingsStore.audio.muted,
        isPlaying: mediaStore.status === 'playing',
        isPaused: mediaStore.status === 'paused' || mediaStore.status === 'idle',
        isBuffering: mediaStore.status === 'buffering',
        currentTime: mediaStore.progress.currentTime,
        duration: mediaStore.progress.duration,
        progress:
            mediaStore.progress.duration > 0
                ? mediaStore.progress.currentTime / mediaStore.progress.duration
                : 0
    };
}

export function createVisualizerOptions() {
    const state = getVisualizerState();

    return {
        enabled: state.enabled,
        type: state.type,
        opacity: state.opacity,
        sensitivity: state.sensitivity,
        barCount: state.barCount,
        smoothing: state.smoothing,
        presetInterval: state.presetInterval,
        transitionSpeed: state.transitionSpeed,
        colorScheme: state.colorScheme
    };
}

export { VisualizerIntegration };
