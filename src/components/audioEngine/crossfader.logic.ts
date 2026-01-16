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
                    // Adjust playback rate or seek
                    if (Math.abs(drift) > 0.5) {
                        // Large drift: seek
                        // eslint-disable-next-line no-cond-assign
                        element.currentTime = this.masterTime + startTime;
                    } else {
                        // Small drift: adjust rate
                        // eslint-disable-next-line no-cond-assign
                        element.playbackRate = drift > 0 ? 0.99 : 1.01;
                        setTimeout(() => { element.playbackRate = 1.0; }, 500); // Reset after 500ms
                    }
                }
            }
        }
    }

    getBufferedAhead(element: HTMLMediaElement): number {
        if (element.buffered.length > 0) {
            return element.buffered.end(element.buffered.length - 1) - element.currentTime;
        }
        return 0;
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
    triggered: false
};

/**
 * Gets the crossfade duration from user settings.
 * @returns {number} The crossfade duration.
 */
function getCrossfadeDuration() {
    return userSettings.crossfadeDuration(undefined);
}

/**
 * Hijacks the media element for crossfade.
 */
export function hijackMediaElementForCrossfade() {
    xDuration.t0 = performance.now(); // Record the start time
    xDuration.busy = true;
    setXDuration(getCrossfadeDuration());
    setVisualizerSettings(getSavedVisualizerSettings());

    endSong();
    if (visualizerSettings.butterchurn.enabled) butterchurnInstance.nextPreset();

    // Start global sync for timing alignment
    syncManager.startSync();

    const hijackedPlayer = document.getElementById('currentMediaElement') as HTMLMediaElement;

    if (!hijackedPlayer || hijackedPlayer.paused || hijackedPlayer.src === '') {
        setXDuration(0);
    }

    if (!hijackedPlayer || !masterAudioOutput.audioContext) return triggerSongInfoDisplay();

    // Register for sync
    syncManager.registerElement(hijackedPlayer, 0);

    // Prioritize buffering: delay crossfade if less than 2s buffered
    const bufferedAhead = syncManager.getBufferedAhead(hijackedPlayer);
    if (bufferedAhead < 2 && xDuration.fadeOut > 0) {
        // Delay crossfade start by up to 1s to allow buffering
        const delayMs = Math.min(1000, (2 - bufferedAhead) * 1000);
        setTimeout(() => {
            if (!xDuration.triggered) {
                hijackMediaElementForCrossfade(); // Restart with buffer check
            }
        }, delayMs);
        return;
    }

    const disposeElement = document.getElementById('crossFadeMediaElement');
    if (disposeElement) {
        destroyWaveSurferInstance();
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

        if (typeof unbindCallback === 'function') {
            unbindCallback();
        }
        // This destroys the wavesurfer on the fade out track when the new track starts
        destroyWaveSurferInstance();
        prevNextDisable(false);
        xDuration.busy = false; // Reset busy flag after new track can start
        xDuration.triggered = false; // Reset trigger flag for new track
    }, sustainDelayMs);

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
 * Checks if the time is running out for the current track.
 * @param {any} player - The player instance.
 * @returns {boolean} Whether the time is running out.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timeRunningOut(player: any): boolean {
    // Check triggered flag FIRST (atomic early exit)
    if (xDuration.triggered) {
        return false;
    }

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
