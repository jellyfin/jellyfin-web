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

    const hijackedPlayer = document.getElementById('currentMediaElement') as HTMLMediaElement;

    if (!hijackedPlayer || hijackedPlayer.paused || hijackedPlayer.src === '') {
        setXDuration(0);
    }

    if (!hijackedPlayer || !masterAudioOutput.audioContext) return triggerSongInfoDisplay();

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
