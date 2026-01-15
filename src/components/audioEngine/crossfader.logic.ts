import { destroyWaveSurferInstance } from 'components/visualizer/WaveSurfer';
import { audioNodeBus, delayNodeBus, masterAudioOutput, unbindCallback } from './master.logic';
import { butterchurnInstance } from 'components/visualizer/butterchurn.logic';
import { getSavedVisualizerSettings, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';
import { endSong, triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';
import * as userSettings from '../../scripts/settings/userSettings';

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
    busy: false
};

/**
 * Gets the crossfade duration from user settings.
 * @returns {number} The crossfade duration.
 */
function getCrossfadeDuration() {
    return userSettings.crossfadeDuration(undefined);
}

/**
 * Stores original media element properties for restoration.
 * @type {Object}
 */
const hijackState = {
    originalPause: null as ((this: HTMLMediaElement) => void) | null,
    originalSrcDescriptor: null as PropertyDescriptor | undefined | null,
    hijackedElement: null as HTMLMediaElement | null,
    stateRecoveryTimeout: null as ReturnType<typeof setTimeout> | null
};

/**
 * Clears hijack state (called after successful cleanup).
 */
function clearHijackState() {
    hijackState.originalPause = null;
    hijackState.originalSrcDescriptor = null;
    hijackState.hijackedElement = null;
    if (hijackState.stateRecoveryTimeout) {
        clearTimeout(hijackState.stateRecoveryTimeout);
        hijackState.stateRecoveryTimeout = null;
    }
}

function restoreHijackedElement() {
    const element = hijackState.hijackedElement;
    if (!element) return;

    if (hijackState.originalPause) {
        element.pause = hijackState.originalPause;
    }
    if (hijackState.originalSrcDescriptor) {
        if (hijackState.originalSrcDescriptor.configurable) {
            try {
                Object.defineProperty(element, 'src', hijackState.originalSrcDescriptor);
            } catch (err) {
                // Avoid throwing during cleanup in test environments.
            }
        }
    }

    const existingCurrent = document.getElementById('currentMediaElement');
    if (!existingCurrent || existingCurrent === element) {
        element.id = 'currentMediaElement';
    } else {
        element.removeAttribute('id');
    }
    element.classList.add('mediaPlayerAudio');
}

/**
 * Hijacks the media element for crossfade with improved safety.
 * - Issue 1 Fix: Explicit error handling for missing element
 * - Issue 2 Fix: Store and restore original pause method
 * - Issue 3 Fix: Preserve src property getter
 * - Issue 6 Fix: State recovery timeout prevents permanent busy state
 */
export function hijackMediaElementForCrossfade() {
    xDuration.t0 = performance.now(); // Record the start time
    xDuration.busy = true;
    setXDuration(getCrossfadeDuration());
    setVisualizerSettings(getSavedVisualizerSettings());

    endSong();
    if (visualizerSettings.butterchurn.enabled) butterchurnInstance.nextPreset();

    const hijackedPlayer = document.getElementById('currentMediaElement') as HTMLMediaElement;

    // FIX Issue 1: Explicit error handling for missing element
    if (!hijackedPlayer) {
        console.error('[Crossfade] currentMediaElement not found - crossfade aborted');
        xDuration.busy = false;
        return triggerSongInfoDisplay();
    }

    if (hijackedPlayer.paused || hijackedPlayer.src === '') {
        setXDuration(0);
    }

    if (!masterAudioOutput.audioContext) {
        console.warn('[Crossfade] AudioContext not initialized');
        xDuration.busy = false;
        return triggerSongInfoDisplay();
    }

    // Clean up any previous hijacked element
    const disposeElement = document.getElementById('crossFadeMediaElement');
    if (disposeElement) {
        destroyWaveSurferInstance();
    }

    prevNextDisable(true);
    hijackedPlayer.classList.remove('mediaPlayerAudio');
    hijackedPlayer.id = 'crossFadeMediaElement';

    // Store reference for cleanup
    hijackState.hijackedElement = hijackedPlayer;

    // FIX Issue 2: Store original pause method for restoration
    hijackState.originalPause = hijackedPlayer.pause;
    hijackedPlayer.pause = () => {
        // Do nothing during crossfade
    };

    // FIX Issue 3: Preserve src property getter when overriding setter
    hijackState.originalSrcDescriptor = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        'src'
    );
    Object.defineProperty(hijackedPlayer, 'src', {
        get: hijackState.originalSrcDescriptor?.get,
        set: () => {
            // Do nothing - prevent source replacement during crossfade
        }
    });

    // FIX Issue 6: Setup state recovery timeout (prevents permanent busy state if crossfade interrupted)
    if (hijackState.stateRecoveryTimeout) {
        clearTimeout(hijackState.stateRecoveryTimeout);
    }
    hijackState.stateRecoveryTimeout = setTimeout(() => {
        if (xDuration.busy) {
            console.warn('[Crossfade] Crossfade timeout (20s), forcing state reset');
            xDuration.busy = false;
            // Clean up orphaned elements
            const orphanedElement = document.getElementById('crossFadeMediaElement');
            if (orphanedElement && orphanedElement.parentNode) {
                orphanedElement.remove();
            }
        }
    }, 20000); // 20 second timeout

    if (!xDuration.disableFade && audioNodeBus[0] && masterAudioOutput.audioContext) {
        // Schedule the fadeout crossfade curve
        audioNodeBus[0].gain.linearRampToValueAtTime(audioNodeBus[0].gain.value, masterAudioOutput.audioContext.currentTime);
        audioNodeBus[0].gain.exponentialRampToValueAtTime(0.01, masterAudioOutput.audioContext.currentTime + xDuration.fadeOut);
    }

    let sustain1Timeout: ReturnType<typeof setTimeout> | null = null;
    let fadeOut1Timeout: ReturnType<typeof setTimeout> | null = null;
    let finalCleanupTimeout: ReturnType<typeof setTimeout> | null = null;

    sustain1Timeout = setTimeout(() => {
        try {
            // This destroys the wavesurfer on the fade out track when the new track starts
            destroyWaveSurferInstance();
            prevNextDisable(false);
        } catch (error) {
            console.error('[Crossfade] Error during sustain cleanup:', error);
        }
    }, (xDuration.sustain * 1000) - 15);

    fadeOut1Timeout = setTimeout(() => {
        try {
            const xfadeGainNode = audioNodeBus.pop();
            const delayNode = delayNodeBus.pop();

            if (!masterAudioOutput.audioContext || !xfadeGainNode || !delayNode) {
                console.warn('[Crossfade] Missing audio nodes during cleanup');
                xDuration.busy = false;
                restoreHijackedElement();
                prevNextDisable(false);
                clearHijackState();
                return;
            }

            xfadeGainNode.gain.linearRampToValueAtTime(0, masterAudioOutput.audioContext.currentTime + 1);

            finalCleanupTimeout = setTimeout(() => {
                try {
                    // Clean up and destroy the xfade MediaElement
                    unbindCallback();
                    xfadeGainNode.disconnect();
                    delayNode.disconnect();

                    // Restore original properties before removing element
                    if (hijackState.hijackedElement && hijackState.originalPause) {
                        hijackState.hijackedElement.pause = hijackState.originalPause;
                    }
                    if (hijackState.hijackedElement && hijackState.originalSrcDescriptor) {
                        Object.defineProperty(hijackState.hijackedElement, 'src', hijackState.originalSrcDescriptor);
                    }

                    hijackedPlayer.remove();
                    xDuration.busy = false;
                    clearHijackState();

                    // Clear recovery timeout since crossfade completed successfully
                    if (hijackState.stateRecoveryTimeout) {
                        clearTimeout(hijackState.stateRecoveryTimeout);
                        hijackState.stateRecoveryTimeout = null;
                    }
                } catch (error) {
                    console.error('[Crossfade] Error during final cleanup:', error);
                    xDuration.busy = false;
                    clearHijackState();
                }
            }, 1010);
        } catch (error) {
            console.error('[Crossfade] Error during fadeOut cleanup:', error);
            xDuration.busy = false;
            clearHijackState();
        }
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
export function timeRunningOut(player: any) {
    const currentTime = player.currentTime();

    if (!masterAudioOutput.audioContext || !xDuration.enabled || xDuration.busy || currentTime < xDuration.fadeOut * 1000) return false;
    return (player.duration() - currentTime) <= (xDuration.fadeOut * 1500);
}
