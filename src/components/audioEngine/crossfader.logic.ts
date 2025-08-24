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

    hijackedPlayer.pause = () => {
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

    setTimeout(() => {
        if (typeof unbindCallback === 'function') {
            unbindCallback();
        }
        // This destroys the wavesurfer on the fade out track when the new track starts
        destroyWaveSurferInstance();
        prevNextDisable(false);
    }, (xDuration.sustain * 1000) - 15);

    setTimeout(() => {
        const xfadeGainNode = audioNodeBus.pop();
        const delayNode = delayNodeBus.pop();

        if (!masterAudioOutput.audioContext || !xfadeGainNode || !delayNode) return;
        xfadeGainNode.gain.linearRampToValueAtTime(0, masterAudioOutput.audioContext.currentTime + 1);
        setTimeout(() => {
            // Clean up and destroy the xfade MediaElement here
            xfadeGainNode.disconnect();
            delayNode.disconnect();
            hijackedPlayer.remove();
            xDuration.busy = false;
        }, 1010);
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

