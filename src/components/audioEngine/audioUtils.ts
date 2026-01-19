// AudioUtils.ts - Shared utility functions for audio operations

import audioErrorHandler, { AudioErrorType, AudioErrorSeverity } from './audioErrorHandler';

/**
 * Audio utility functions for common operations across audio components
 */

/**
 * Convert decibels to linear gain value
 */
export function dBToLinear(dB: number): number {
    return Math.pow(10, dB / 20);
}

/**
 * Convert linear gain value to decibels
 */
export function linearToDB(linear: number): number {
    if (linear <= 0) return -Infinity;
    return 20 * Math.log10(linear);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Safely disconnect an audio node with error handling
 */
export function safeDisconnect(node: AudioNode | null | undefined): void {
    if (!node) return;

    try {
        node.disconnect();
    } catch (error) {
        audioErrorHandler.handleError(
            audioErrorHandler.createError(
                AudioErrorType.AUDIO_NODE_CREATION_FAILED,
                AudioErrorSeverity.LOW,
                'AudioUtils',
                'Failed to disconnect audio node',
                error instanceof Error ? error : undefined,
                { nodeType: node.constructor.name }
            )
        );
    }
}

/**
 * Safely connect audio nodes with error handling
 */
export function safeConnect(
    source: AudioNode,
    destination: AudioNode,
    outputIndex = 0,
    inputIndex = 0
): boolean {
    try {
        source.connect(destination, outputIndex, inputIndex);
        return true;
    } catch (error) {
        audioErrorHandler.handleError(
            audioErrorHandler.createError(
                AudioErrorType.AUDIO_NODE_CREATION_FAILED,
                AudioErrorSeverity.MEDIUM,
                'AudioUtils',
                'Failed to connect audio nodes',
                error instanceof Error ? error : undefined,
                {
                    sourceType: source.constructor.name,
                    destType: destination.constructor.name,
                    outputIndex,
                    inputIndex
                }
            )
        );
        return false;
    }
}

/**
 * Check if an audio context is in a running state
 */

export function isAudioContextRunning(audioContext: AudioContext | null | undefined): boolean {
    return Boolean(audioContext && audioContext.state === 'running');
}

/**
 * Safely resume an audio context
 */
export async function safeResumeAudioContext(audioContext: AudioContext): Promise<boolean> {
    if (audioContext.state === 'running') return true;

    try {
        await audioContext.resume();
        return (audioContext.state as string) === 'running';
    } catch (error) {
        audioErrorHandler.handleError(
            audioErrorHandler.createError(
                AudioErrorType.AUDIO_CONTEXT_FAILED,
                AudioErrorSeverity.MEDIUM,
                'AudioUtils',
                'Failed to resume audio context',
                error instanceof Error ? error : undefined,
                { contextState: audioContext.state }
            )
        );
        return false;
    }
}

/**
 * Safely suspend an audio context
 */
export async function safeSuspendAudioContext(audioContext: AudioContext): Promise<boolean> {
    if (audioContext.state === 'suspended') return true;

    try {
        await audioContext.suspend();
        return (audioContext.state as string) === 'suspended';
    } catch (error) {
        audioErrorHandler.handleError(
            audioErrorHandler.createError(
                AudioErrorType.AUDIO_CONTEXT_FAILED,
                AudioErrorSeverity.LOW,
                'AudioUtils',
                'Failed to suspend audio context',
                error instanceof Error ? error : undefined,
                { contextState: audioContext.state }
            )
        );
        return false;
    }
}

/**
 * Create a gain node with standardized settings
 */
export function createStandardGainNode(
    audioContext: AudioContext,
    initialGain = 1.0
): GainNode | null {
    try {
        const gainNode = audioContext.createGain();
        gainNode.gain.value = clamp(initialGain, 0, 1);
        return gainNode;
    } catch (error) {
        audioErrorHandler.handleError(
            audioErrorHandler.createError(
                AudioErrorType.AUDIO_NODE_CREATION_FAILED,
                AudioErrorSeverity.MEDIUM,
                'AudioUtils',
                'Failed to create gain node',
                error instanceof Error ? error : undefined,
                { initialGain }
            )
        );
        return null;
    }
}

/**
 * Calculate exponential ramp duration for smooth transitions
 */
export function calculateRampDuration(
    currentValue: number,
    targetValue: number,
    maxDuration = 0.1
): number {
    // Shorter ramps for small changes, longer for large ones
    const ratio = Math.abs(targetValue - currentValue);
    return clamp(ratio * maxDuration, 0.01, maxDuration);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
        return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

/**
 * Check if a media element is in a playable state
 */
export function isMediaElementPlayable(element: HTMLMediaElement | null | undefined): boolean {
    return Boolean(element
           && element.src
           && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
}

/**
 * Get the current playback position as a percentage
 */
export function getPlaybackPercentage(element: HTMLMediaElement): number {
    if (!element.duration || element.duration === 0) return 0;
    return (element.currentTime / element.duration) * 100;
}

/**
 * Normalize volume levels across different sources
 */
export function normalizeVolume(
    volume: number,
    source: 'user' | 'normalization' | 'crossfade' = 'user'
): number {
    switch (source) {
        case 'user':
            // User volume is typically 0-100, convert to 0-1
            return clamp(volume / 100, 0, 1);
        case 'normalization':
            // Normalization is in dB, convert to linear multiplier
            return dBToLinear(volume);
        case 'crossfade':
            // Crossfade is typically 0-1 already
            return clamp(volume, 0, 1);
        default:
            return clamp(volume, 0, 1);
    }
}

/**
 * Debounce function for audio event handlers
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle function for performance-critical audio operations
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}

/**
 * Calculate frequency from FFT bin index
 */
export function binIndexToFrequency(
    binIndex: number,
    fftSize: number,
    sampleRate: number
): number {
    return (binIndex * sampleRate) / (2 * fftSize);
}

/**
 * Calculate FFT bin index from frequency
 */
export function frequencyToBinIndex(
    frequency: number,
    fftSize: number,
    sampleRate: number
): number {
    return Math.round((2 * fftSize * frequency) / sampleRate);
}

/**
 * Apply smoothing to FFT data for more stable visualizations
 */
export function smoothFFTData(
    data: Float32Array | Uint8Array,
    previousData: Float32Array | Uint8Array | null,
    smoothingFactor = 0.8
): Float32Array {
    const smoothed = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const previous = previousData ? previousData[i] : current;
        smoothed[i] = previous * smoothingFactor + current * (1 - smoothingFactor);
    }

    return smoothed;
}

/**
 * Synchronizes the volume UI controls with the Web Audio gain level.
 */
export function synchronizeVolumeUI(): void {
    const volumeSlider = document.querySelector('.nowPlayingVolumeSlider') as HTMLInputElement;
    if (volumeSlider) {
        import('./master.logic').then(({ masterAudioOutput }) => {
            if (masterAudioOutput.volume !== undefined) {
                volumeSlider.value = masterAudioOutput.volume.toString();
                volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                console.debug(`[VolumeSync] Updated UI slider to ${masterAudioOutput.volume}`);
            }
        }).catch(() => {});
    }
}

/**
 * Smoothly fade the mixer volume to prevent abrupt sound changes.
 * This protects audiophile systems from damaging volume spikes.
 *
 * @param targetGain - Target gain value (0-1)
 * @param duration - Fade duration in seconds
 * @returns Promise that resolves when fade completes
 */
export async function fadeMixerVolume(targetGain: number, duration: number = 0.15): Promise<void> {
    try {
        const { masterAudioOutput } = await import('./master.logic');
        const audioCtx = masterAudioOutput.audioContext;

        if (!audioCtx || !masterAudioOutput.mixerNode) {
            console.debug('[fadeMixerVolume] No audio context or mixer node available');
            return;
        }

        const currentTime = audioCtx.currentTime;
        const gainParam = masterAudioOutput.mixerNode.gain;

        // Cancel any scheduled ramps
        gainParam.cancelScheduledValues(currentTime);

        // Set current value explicitly to avoid jumps
        gainParam.setValueAtTime(gainParam.value, currentTime);

        // Smooth linear ramp to target
        gainParam.linearRampToValueAtTime(
            clamp(targetGain, 0, 1),
            currentTime + duration
        );

        // Wait for fade to complete
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    } catch (error) {
        console.error('[fadeMixerVolume] Error fading volume:', error);
    }
}
