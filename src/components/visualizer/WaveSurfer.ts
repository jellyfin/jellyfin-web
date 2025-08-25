import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
import MiniMapPlugin from 'wavesurfer.js/dist/plugins/minimap';
import { createWaveSurferChannelStyle, DEFAULT_WAVESURFER_COLORS, surferOptions, waveSurferPluginOptions, WaveSurferColorScheme } from './WaveSurferOptions';
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

let waveSurferChannelStyle = createWaveSurferChannelStyle(DEFAULT_WAVESURFER_COLORS);

async function extractColorsFromAlbumArt(): Promise<WaveSurferColorScheme> {
    const artElem = document.querySelector('.nowPlayingImage') as HTMLElement | null;
    if (!artElem) return DEFAULT_WAVESURFER_COLORS;

    const match = artElem.style.backgroundImage.match(/url\("?(.*)"?\)/);
    const url = match?.[1];
    if (!url) return DEFAULT_WAVESURFER_COLORS;

    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(DEFAULT_WAVESURFER_COLORS);
                return;
            }
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0;
            let g = 0;
            let b = 0;
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const left = `rgb(${r}, ${g}, ${b})`;
            const right = `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
            const cursor = `rgb(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)})`;
            resolve({ left, right, cursor });
        };
        img.onerror = () => resolve(DEFAULT_WAVESURFER_COLORS);
    });
}

function findElements() {
    inputSurfer = document.getElementById('inputSurfer');
    simpleSlider = document.getElementById('simpleSlider');
    barSurfer = document.getElementById('barSurfer');
    mediaElement = document.getElementById('currentMediaElement') as HTMLMediaElement || null;
}

function isNewSong(newSongDuration: number) {
    return (newSongDuration !== Math.floor(savedDuration * 10000000));
}

async function waveSurferInitialization(container: string, legacy: WaveSurferLegacy, newSongDuration = 0) {
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

    const colors = await extractColorsFromAlbumArt();
    waveSurferChannelStyle = createWaveSurferChannelStyle(colors);

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
