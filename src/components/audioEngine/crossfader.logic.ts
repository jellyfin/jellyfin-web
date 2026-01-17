import { destroyWaveSurferInstance } from 'components/visualizer/WaveSurfer';
import { audioNodeBus, delayNodeBus, masterAudioOutput, unbindCallback } from './master.logic';
import { butterchurnInstance } from 'components/visualizer/butterchurn.logic';
import { getSavedVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import { endSong, triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';
import * as userSettings from '../../scripts/settings/userSettings';

/** Timing constants for crossfade operations (milliseconds) */
const crossfadeTiming = {
    /** Offset to fire cleanup before sustain ends (compensates for JS timer drift) */
    sustainOffsetMs: 15,
    /** Delay after final gain ramp before disconnecting nodes */
    nodeDisconnectDelayMs: 1010,
    /** Minimum timeout to prevent negative setTimeout values */
    minTimeoutMs: 0
} as const;

/** Stored timeout IDs for cancellation */
let sustainTimer: ReturnType<typeof setTimeout> | null = null;
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Global Sync Manager for MediaElement timing alignment.
 */
class SyncManager {
    private elements: Map<HTMLMediaElement, number> = new Map();
    private masterTime: number = 0;
    private syncInterval: ReturnType<typeof setInterval> | null = null;

    registerElement(element: HTMLMediaElement, startTime: number = 0): void {
        this.elements.set(element, startTime);
        element.preload = 'auto'; // Prioritize buffering
    }

    unregisterElement(element: HTMLMediaElement): void {
        this.elements.delete(element);
    }

    startSync(): void {
        if (this.syncInterval) return;
        this.syncInterval = setInterval(() => this.checkSync(), 100); // Check every 100ms
    }

    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    private checkSync(): void {
        if (this.elements.size === 0) return;

        try {
            // Calculate average time as master reference
            let totalTime = 0;
            let activeCount = 0;
            this.elements.forEach((startTime, element) => {
                if (!element.paused && element.readyState >= 2) {
                    totalTime += element.currentTime - startTime;
                    activeCount++;
                }
            });
            if (activeCount > 0) {
                this.masterTime = totalTime / activeCount;
            }

            // Apply corrections
            for (const [element, startTime] of Array.from(this.elements.entries())) {
                if (!element.paused && element.readyState >= 2) {
                    const elementTime = element.currentTime - startTime;
                    const drift = elementTime - this.masterTime;

                    if (Math.abs(drift) > 0.1) { // 100ms threshold
                        const targetTime = this.masterTime + startTime;

                        // Only seek if target position is buffered, not during crossfade, and has sufficient buffer ahead
                        const bufferedAhead = this.getBufferedAhead(element);
                        if (Math.abs(drift) > 0.5 && this.isPositionBuffered(element, targetTime) && !xDuration.busy && bufferedAhead > 2.0) {
                            console.debug(`[SyncManager] Seeking ${element.id || 'element'} from ${element.currentTime.toFixed(2)}s to ${targetTime.toFixed(2)}s`);
                            element.currentTime = targetTime;
                        } else if (Math.abs(drift) <= 0.5 && !xDuration.busy) {
                            // Small drift: adjust rate (only if not already adjusting and not during crossfade)
                            if (element.playbackRate === 1.0) {
                                element.playbackRate = drift > 0 ? 0.99 : 1.01;
                                setTimeout(() => {
                                    if (element.playbackRate !== 1.0) {
                                        element.playbackRate = 1.0;
                                    }
                                }, 500); // Reset after 500ms
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('[SyncManager] Error in checkSync:', error);
        }
    }

    getBufferedAhead(element: HTMLMediaElement): number {
        if (element.buffered.length > 0) {
            return element.buffered.end(element.buffered.length - 1) - element.currentTime;
        }
        return 0;
    }

    private isPositionBuffered(element: HTMLMediaElement, targetTime: number): boolean {
        if (element.buffered.length === 0) return false;

        for (let i = 0; i < element.buffered.length; i++) {
            if (targetTime >= element.buffered.start(i) && targetTime <= element.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }
}

export const syncManager = new SyncManager();

/**
 * Cancels all active crossfade timeouts.
 * Call when aborting a crossfade (manual skip, stop).
 */
export function cancelCrossfadeTimeouts(): void {
    if (sustainTimer !== null) {
        clearTimeout(sustainTimer);
        sustainTimer = null;
    }
    if (fadeOutTimer !== null) {
        clearTimeout(fadeOutTimer);
        fadeOutTimer = null;
    }
    if (disconnectTimer !== null) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
    }

    // Reset crossfade state when cancelled
    if (xDuration.busy) {
        console.debug('[Crossfader] Crossfade cancelled, resetting state and re-enabling controls');
        xDuration.busy = false;
        xDuration.triggered = false;
        xDuration.bufferDelayApplied = false; // Reset buffer delay flag
        xDuration.manualTrigger = false; // Reset manual trigger flag
        prevNextDisable(false);
    }

    syncManager.stopSync();
}

/**
 * Safely disconnects an AudioNode, catching errors if already disconnected.
 */
function safeDisconnect(node: AudioNode | null | undefined, nodeName: string): void {
    if (!node) return;
    try {
        node.disconnect();
    } catch {
        // Node was already disconnected, which is fine
        console.debug(`[Crossfade] ${nodeName} already disconnected`);
    }
}

/**
 * Sets the crossfade duration and related properties.
 * @param {number} crossfadeDuration - The duration of the crossfade in seconds.
 */
export function setXDuration(crossfadeDuration: number) {
    if (crossfadeDuration < 0.01) {
        xDuration.enabled = false;
        xDuration.fadeOut = 0;
        xDuration.disableFade = true;
        xDuration.sustain = 0;
        return;
    }

    if (crossfadeDuration < 0.51) {
        xDuration.enabled = true;
        xDuration.fadeOut = crossfadeDuration;
        xDuration.disableFade = true;
        xDuration.sustain = crossfadeDuration / 2;
        return;
    }

    xDuration.enabled = true;
    xDuration.fadeOut = crossfadeDuration * 2;
    xDuration.disableFade = false;
    xDuration.sustain = crossfadeDuration / 12;
}

/**
 * Object to store crossfade duration settings.
 * @type {Object}
 */
export const xDuration = {
    disableFade: true,
    sustain: 0.45,
    fadeOut: 1,
    enabled: true,
    t0: performance.now(),
    busy: false,
    triggered: false,
    bufferDelayApplied: false,
    manualTrigger: false // Flag to distinguish manual vs automatic crossfades
};

/**
 * Gets the crossfade duration from user settings.
 * @returns {number} The crossfade duration.
 */
export function getCrossfadeDuration() {
    return userSettings.crossfadeDuration(undefined);
}

/**
 * Hijacks the media element for crossfade.
 * @param {boolean} [isManual=false] - Whether this is a manual trigger (skip button)
 * @returns {void}
 */
export function hijackMediaElementForCrossfade(isManual = false) {
    try {
        // Prevent overlapping crossfades (but allow buffer delay retries)
        if (xDuration.busy && !xDuration.bufferDelayApplied) {
            console.warn('[Crossfader] Crossfade already in progress, skipping');
            return;
        }

        const crossfadeDuration = getCrossfadeDuration();
        console.debug(`[Crossfader] Starting crossfade (manual: ${isManual}) with duration: ${crossfadeDuration}s`);

        xDuration.t0 = performance.now(); // Record the start time
        xDuration.manualTrigger = isManual;
        xDuration.busy = true;
        setXDuration(crossfadeDuration);
        setVisualizerSettings(getSavedVisualizerSettings());

        endSong();
        if (visualizerSettings.butterchurn.enabled) butterchurnInstance.nextPreset();

        // Start global sync for timing alignment
        syncManager.startSync();

        // Synchronize volume UI with Web Audio gain level
        synchronizeVolumeUI();

        const hijackedPlayer = document.getElementById('currentMediaElement') as HTMLMediaElement;

        if (!hijackedPlayer || hijackedPlayer.paused || hijackedPlayer.src === '') {
            console.warn('[Crossfader] Invalid media element state, disabling crossfade');
            setXDuration(0);
            xDuration.busy = false;
            xDuration.triggered = false;
            xDuration.manualTrigger = false;
            return triggerSongInfoDisplay();
        }

        if (!masterAudioOutput.audioContext) {
            console.error('[Crossfader] No AudioContext available');
            xDuration.busy = false;
            xDuration.triggered = false;
            xDuration.manualTrigger = false;
            return triggerSongInfoDisplay();
        }

        // Continue with crossfade setup...

    // Register for sync
    syncManager.registerElement(hijackedPlayer, 0);

    // Prioritize buffering: delay crossfade if less than 2s buffered
    const bufferedAhead = syncManager.getBufferedAhead(hijackedPlayer);
    if (bufferedAhead < 2 && xDuration.fadeOut > 0 && !xDuration.bufferDelayApplied) {
        xDuration.bufferDelayApplied = true;
        // Reset busy to allow the delayed retry to proceed
        xDuration.busy = false;
        // Delay crossfade start by up to 1s to allow buffering (prevent recursion)
        const delayMs = Math.min(1000, (2 - bufferedAhead) * 1000);
        setTimeout(() => {
            xDuration.bufferDelayApplied = false;
            if (!xDuration.triggered) {
                hijackMediaElementForCrossfade(); // Restart with buffer check
            }
        }, delayMs);
        return;
    }

    const disposeElement = document.getElementById('crossFadeMediaElement');
    if (disposeElement) {
        // Prevent double-disposal
        if (disposeElement.id !== 'crossFadeMediaElement') return;

        destroyWaveSurferInstance();

        // Clean up any audio nodes that belong to this disposed element
        // We use a more conservative approach - only clean nodes if we're definitely interrupting
        const hasActiveCrossfade = xDuration.busy && document.querySelector('#crossFadeMediaElement') !== null;
        if (hasActiveCrossfade) {
            // Only clean up nodes if we're interrupting an active crossfade
            while (audioNodeBus.length > 0) {
                const gainNode = audioNodeBus.pop();
                safeDisconnect(gainNode, 'interrupted xfadeGainNode');
            }
            while (delayNodeBus.length > 0) {
                const delayNode = delayNodeBus.pop();
                safeDisconnect(delayNode, 'interrupted delayNode');
            }
        }

        disposeElement.remove();

        // Stop sync for the disposed element
        syncManager.unregisterElement(disposeElement as HTMLMediaElement);
        syncManager.stopSync();
    }
    prevNextDisable(true);
    hijackedPlayer.classList.remove('mediaPlayerAudio');
    hijackedPlayer.id = 'crossFadeMediaElement';

    hijackedPlayer.pause = ()=>{
        // Do nothing
    };

    Object.defineProperty(hijackedPlayer, 'src', {
        set: () => {
            // Do nothing
        }
    });

    if (!xDuration.disableFade && audioNodeBus[0] && masterAudioOutput.audioContext) {
        // Schedule the fadeout crossfade curve
        audioNodeBus[0].gain.linearRampToValueAtTime(audioNodeBus[0].gain.value, masterAudioOutput.audioContext.currentTime);
        audioNodeBus[0].gain.exponentialRampToValueAtTime(0.01, masterAudioOutput.audioContext.currentTime + xDuration.fadeOut);
    }

    // Cancel any existing timeouts from previous crossfade
    cancelCrossfadeTimeouts();

    // Calculate UI unlock delay with minimum bound to prevent negative timeout
    const sustainDelayMs = Math.max(
        crossfadeTiming.minTimeoutMs,
        (xDuration.sustain * 1000) - crossfadeTiming.sustainOffsetMs
    );

    // Timer 1: UI cleanup and state reset
    sustainTimer = setTimeout(() => {
        sustainTimer = null;

        try {
            if (typeof unbindCallback === 'function') {
                unbindCallback();
            }
            // Reset visibility on fade out track, but keep WaveSurfer instance for reuse
            destroyWaveSurferInstance();
            prevNextDisable(false);
            xDuration.busy = false; // Reset busy flag after new track can start
            xDuration.triggered = false; // Reset trigger flag for new track

            console.debug(`[Crossfader] Crossfade completed, controls re-enabled after ${sustainDelayMs}ms`);
        } catch (error) {
            console.error('[Crossfader] Error during sustain timer cleanup:', error);
            // Ensure state is always reset even on error
            xDuration.busy = false;
            xDuration.triggered = false;
            prevNextDisable(false);
        }
    }, sustainDelayMs);

    // Safety timeout: Force reset controls after maximum crossfade duration + buffer
    const safetyTimeoutMs = Math.max(5000, (xDuration.fadeOut + xDuration.sustain) * 1000 + 2000);
    setTimeout(() => {
        if (xDuration.busy) {
            console.warn('[Crossfader] Safety timeout triggered - resetting busy state and controls');
            xDuration.busy = false;
            xDuration.triggered = false;
            prevNextDisable(false);
            cancelCrossfadeTimeouts();
        }
    }, safetyTimeoutMs);

    // Timer 2: Audio node cleanup (after fade completes)
    fadeOutTimer = setTimeout(() => {
        fadeOutTimer = null;

        const xfadeGainNode = audioNodeBus.pop();
        const delayNode = delayNodeBus.pop();

        if (!masterAudioOutput.audioContext || !xfadeGainNode || !delayNode) {
            hijackedPlayer.remove();
            return;
        }

        xfadeGainNode.gain.linearRampToValueAtTime(0, masterAudioOutput.audioContext.currentTime + 1);

        // Timer 3: Disconnect nodes after ramp completes
        disconnectTimer = setTimeout(() => {
            disconnectTimer = null;
            safeDisconnect(xfadeGainNode, 'xfadeGainNode');
            safeDisconnect(delayNode, 'delayNode');
            syncManager.unregisterElement(hijackedPlayer);
            hijackedPlayer.remove();
        }, crossfadeTiming.nodeDisconnectDelayMs);
    }, xDuration.fadeOut * 1000);
    } catch (error) {
        console.error('[Crossfader] Error during hijack setup:', error);
        // Ensure state is reset on error
        xDuration.busy = false;
        xDuration.triggered = false;
        xDuration.manualTrigger = false;
        cancelCrossfadeTimeouts();
        triggerSongInfoDisplay();
    }
}

/**
 * Disables or enables previous/next buttons.
 * @param {boolean} [disable=false] - Whether to disable the buttons.
 */
function prevNextDisable(disable = false) {
    const buttons = [
        '.btnPreviousTrack', '.previousTrackButton',
        '.btnNextTrack', '.nextTrackButton',
        '.btnPlayPause', '.playPauseButton',
        '.stopButton', '.btnStop'
    ];

    buttons.forEach(selector => {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (button) {
            button.disabled = disable;
        }
    });
}

/**
 * Synchronizes the volume UI controls with the Web Audio gain level
 */
export function synchronizeVolumeUI(): void {
    // Update volume slider to reflect Web Audio gain level
    const volumeSlider = document.querySelector('.nowPlayingVolumeSlider') as HTMLInputElement;
    if (volumeSlider && masterAudioOutput.volume !== undefined) {
        volumeSlider.value = masterAudioOutput.volume.toString();
        // Trigger change event if needed
        volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));

        console.debug(`[VolumeSync] Updated UI slider to ${masterAudioOutput.volume}`);
    }
}

/**
 * Checks if the time is running out for the current track.
 * @param {any} player - The player instance.
 * @returns {boolean} Whether the time is running out.
 */
export function timeRunningOut(player: any): boolean {
    const currentTimeMs = player.currentTime() * 1000;
    const durationMs = player.duration() * 1000;
    const fadeOutMs = xDuration.fadeOut * 1000;

    // Guard against invalid duration (0, NaN, Infinity)
    if (!isFinite(durationMs) || durationMs <= 0) {
        return false;
    }

    // Check all blocking conditions
    if (!masterAudioOutput.audioContext || !xDuration.enabled || xDuration.busy || currentTimeMs < fadeOutMs) {
        return false;
    }

    const shouldTrigger = durationMs - currentTimeMs <= fadeOutMs * 1.5;
    if (shouldTrigger) {
        // Set flag BEFORE returning to prevent race condition
        xDuration.triggered = true;
    }
    return shouldTrigger;
}
