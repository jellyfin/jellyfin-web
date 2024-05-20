import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
import MiniMapPlugin from 'wavesurfer.js/dist/plugins/minimap';
import { waveSurferChannelStyle, surferOptions, waveSurferPluginOptions } from './WaveSurferOptions';
import { triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';
import { visualizerSettings } from './visualizers.logic';
import { masterAudioOutput } from 'components/audioEngine/master.logic';

type WaveSurferLegacy = {
    peaks: number[][]
    duration: number
    isPlaying: boolean
    currentTime: number
    scrollPosition: number
};

let waveSurferInstance: WaveSurfer;

let inputSurfer: HTMLElement | null;
let simpleSlider: HTMLElement | null;
let barSurfer: HTMLElement | null;
let mediaElement: HTMLMediaElement | undefined;

const maxZoom = waveSurferPluginOptions.zoomOptions.maxZoom;
const minZoom = 1;
const doubleChannelZoom = 130;
const wholeSongZoom = 70;
let currentZoom = 105;

let mobileTouch = false;

let savedDuration = 0;
let savedPeaks: number[][];

let initialDistance: number | null = null;
const MIN_DELTA = waveSurferPluginOptions.zoomOptions.deltaThreshold; // Define a threshold for minimal significant distance change
const DEBOUNCE_INTERVAL = 20;

const purgatory: WaveSurfer[] = [];

let lastTouchMoveTime = 0;

function findElements() {
    inputSurfer = document.getElementById('inputSurfer');
    simpleSlider = document.getElementById('simpleSlider');
    barSurfer = document.getElementById('barSurfer');
    mediaElement = document.getElementById('currentMediaElement') as HTMLMediaElement || null;
}

function isNewSong(newSongDuration: number) {
    return (newSongDuration !== Math.floor(savedDuration * 10000000));
}

function waveSurferInitialization(container: string, legacy: WaveSurferLegacy, newSongDuration: 0 ) {
    findElements();

    destroyWaveSurferInstance();
    if (!visualizerSettings.waveSurfer.enabled) return;
    if (!masterAudioOutput.audioContext) {
        return;
    }
    if (container !== ('#' + barSurfer?.id) && container !== ('#' + inputSurfer?.id)) {
        return;
    }
    // Don't update if the tab is not in focus or the screen is off
    if (document.hidden
        || document.visibilityState !== 'visible'
        || ( !inputSurfer && !barSurfer)
        || !mediaElement) {
        return;
    }

    const newSong = isNewSong(newSongDuration);

    waveSurferInstance = WaveSurfer.create({ ...surferOptions,
        media: mediaElement,
        container: container,
        peaks: newSong ? undefined : savedPeaks,
        duration: newSong ? undefined : savedDuration
    });

    waveSurferInstance.on('zoom', (minPxPerSec)=>{
        if (mobileTouch) return;
        initializeStyle(minPxPerSec);

        currentZoom = minPxPerSec;
    });

    waveSurferInstance.once('ready', (duration) => {
        setVisibility();
        savedDuration = duration;
        if (newSong) {
            savedPeaks = waveSurferInstance.exportPeaks();
        } else {
            const newPeaks = waveSurferInstance.exportPeaks();
            if (newPeaks.length > savedPeaks.length) savedPeaks = newPeaks;
        }
        if (container === '#barSurfer') {
            waveSurferInstance.setOptions(waveSurferChannelStyle.bar);
            return;
        }
        initializeStyle(currentZoom);
        waveSurferInstance.zoom(currentZoom);
        waveSurferInstance.registerPlugin(
            TimelinePlugin.create(waveSurferPluginOptions.timelineOptions)
        );
        waveSurferInstance.registerPlugin(
            ZoomPlugin.create(waveSurferPluginOptions.zoomOptions)
        );
        waveSurferInstance.registerPlugin(
            MiniMapPlugin.create(waveSurferChannelStyle.map)
        );
        if (inputSurfer) {
            inputSurfer.addEventListener('touchstart', onTouchStart, { passive: true });
            inputSurfer.addEventListener('touchmove', onTouchMove, { passive: true });
            inputSurfer.addEventListener('touchend', onTouchEnd, { passive: true });
        }
    });

    waveSurferInstance.once('destroy', () => {
        resetVisibility();

        if (!inputSurfer) return;
        inputSurfer.removeEventListener('touchstart', onTouchStart);
        inputSurfer.removeEventListener('touchmove', onTouchMove);
        inputSurfer.removeEventListener('touchend', onTouchEnd);
    });

    function initializeStyle(minPxPerSec: number) {
        if (minPxPerSec < doubleChannelZoom && minPxPerSec > wholeSongZoom) {
            waveSurferInstance.setOptions(waveSurferChannelStyle.showSingleChannel);
            return;
        }
        if (minPxPerSec > doubleChannelZoom && minPxPerSec > wholeSongZoom) {
            waveSurferInstance.setOptions(waveSurferChannelStyle.showDoubleChannels);
            return;
        }
        waveSurferInstance.setOptions(waveSurferChannelStyle.showWholeSong);
    }

    if (container === '#barSlider') return;

    function getDistance(touches: TouchList): number {
        const [touch1, touch2] = touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent): void {
        mobileTouch = true;

        triggerSongInfoDisplay();

        if (e.touches.length === 1) {
            waveSurferInstance.setOptions({
                autoCenter: false,
                autoScroll: false
            });
        }

        if (e.touches.length === 2) {
            waveSurferInstance.setOptions({
                interact: false,
                autoCenter: false,
                autoScroll: false
            });
            initialDistance = getDistance(e.touches);
        }
    }

    function onTouchMove(e: TouchEvent): void {
        if (e.touches.length === 2 && initialDistance !== null) {
            const currentTime = Date.now();
            if (currentTime - lastTouchMoveTime < DEBOUNCE_INTERVAL) return; // Debounce touch move events
            lastTouchMoveTime = currentTime;

            const currentDistance = getDistance(e.touches);
            const delta = Math.abs(currentDistance - initialDistance);

            if (delta < MIN_DELTA) return;

            const zoomFactor = currentDistance / initialDistance;
            const newZoom = currentZoom ** zoomFactor;
            if (newZoom >= maxZoom || newZoom <= minZoom) return;

            waveSurferInstance.zoom(newZoom);
            currentZoom = newZoom;
            initialDistance = currentDistance;
        }
    }

    function onTouchEnd(e: TouchEvent): void {
        if (e.touches.length === 1) {
            waveSurferInstance.setOptions({
                autoCenter: true,
                autoScroll: true
            });
        }
        if (e.touches.length === 2) {
            initialDistance = null;
        }
        initializeStyle(currentZoom);

        mobileTouch = false;
    }
}

function destroyWaveSurferInstance(): WaveSurferLegacy {
    if (!waveSurferInstance) resetVisibility();

    // Improves initial display when there's a match
    const legacy = {
        peaks: savedPeaks,
        duration: savedDuration,
        isPlaying: waveSurferInstance?.isPlaying(),
        currentTime: waveSurferInstance?.getCurrentTime(),
        scrollPosition: waveSurferInstance?.getScroll()
    };
    if (waveSurferInstance) {
        // Cleans up multiple existing instances
        const victim = purgatory.shift();
        if (victim) {
            victim.destroy();
        }
        purgatory.push(waveSurferInstance);
    }
    if (legacy?.isPlaying) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        mediaElement?.play();
    }

    return legacy;
}

function setVisibility() {
    if (inputSurfer) inputSurfer.hidden = false;
    if (simpleSlider) simpleSlider.hidden = true;
    if (barSurfer) barSurfer.hidden = false;
}

function resetVisibility() {
    if (inputSurfer) inputSurfer.hidden = true;
    if (simpleSlider) simpleSlider.hidden = false;
    if (barSurfer) barSurfer.hidden = true;
}

export {
    waveSurferInitialization,
    waveSurferInstance,
    destroyWaveSurferInstance,
    currentZoom
};
