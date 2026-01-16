import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
import MiniMapPlugin from 'wavesurfer.js/dist/plugins/minimap';
import { createWaveSurferChannelStyle, DEFAULT_WAVESURFER_COLORS, surferOptions, waveSurferPluginOptions, WaveSurferColorScheme } from './WaveSurferOptions';
import { playbackManager } from 'components/playback/playbackmanager';
import { triggerSongInfoDisplay } from 'components/sitbackMode/sitback.logic';
import { visualizerSettings } from './visualizers.logic';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ApiClient } from 'jellyfin-apiclient';

type WaveSurferLegacy = {
    peaks: number[][] | undefined
    duration: number
    isPlaying: boolean
    currentTime: number
    scrollPosition: number
};

let waveSurferInstance: WaveSurfer | null = null;
let waveSurferContainer: string | null = null;
let waveSurferReady = false;
let waveSurferLoadSequence = 0;
let lastLoadedItemId: string | null = null;
let lastLoadedStreamUrl: string | null = null;
let lastAlbumArtUrl: string | null = null;
let lastAlbumArtColors: WaveSurferColorScheme | null = null;

let inputSurfer: HTMLElement | null;
let simpleSlider: HTMLElement | null;
let barSurfer: HTMLElement | null;
let mediaElement: HTMLMediaElement | null;
let activeMediaElement: HTMLMediaElement | null = null;
let mediaSyncHandler: (() => void) | null = null;
let timelinePlugin: any;
let zoomPlugin: any;
let minimapPlugin: any;
let lastPluginContainer: string | null = null;
let lastPluginColorKey: string | null = null;

const maxZoom = waveSurferPluginOptions.zoomOptions.maxZoom;
const minZoom = 1;
const doubleChannelZoom = 130;
const wholeSongZoom = 70;
let currentZoom = 105;

let mobileTouch = false;
let isDragging = false;
let touchHandlersBound = false;

let savedDuration = 0;
let savedPeaks: number[][] | undefined;

let initialDistance: number | null = null;
const MIN_DELTA = waveSurferPluginOptions.zoomOptions.deltaThreshold; // Define a threshold for minimal significant distance change
const DEBOUNCE_INTERVAL = 20;

let lastTouchMoveTime = 0;

let waveSurferChannelStyle = createWaveSurferChannelStyle(DEFAULT_WAVESURFER_COLORS);

function getBackgroundImageUrl(elem: HTMLElement): string | null {
    const backgroundImage = elem.style.backgroundImage || getComputedStyle(elem).backgroundImage;
    if (!backgroundImage || backgroundImage === 'none') return null;

    const match = /url\(([^)]+)\)/i.exec(backgroundImage);
    if (!match) return null;

    return match[1].trim().replace(/^['"]+|['"]+$/g, '');
}

function isCrossOriginUrl(url: string): boolean {
    try {
        return new URL(url, window.location.href).origin !== window.location.origin;
    } catch (err) {
        return true;
    }
}

function loadImageElement(url: string, useCrossOrigin: boolean): Promise<HTMLImageElement | null> {
    return new Promise(resolve => {
        const img = new Image();
        if (useCrossOrigin) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

async function extractColorsFromAlbumArt(_apiClient: ApiClient): Promise<WaveSurferColorScheme> {
    const artElem = document.querySelector('.nowPlayingImage') as HTMLElement | null;
    if (!artElem) return DEFAULT_WAVESURFER_COLORS;

    const url = getBackgroundImageUrl(artElem);
    if (!url) return DEFAULT_WAVESURFER_COLORS;
    if (url === lastAlbumArtUrl && lastAlbumArtColors) return lastAlbumArtColors;

    if (isCrossOriginUrl(url)) {
        return DEFAULT_WAVESURFER_COLORS;
    }

    const img = await loadImageElement(url, false);
    if (!img) return DEFAULT_WAVESURFER_COLORS;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return DEFAULT_WAVESURFER_COLORS;
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
    const colors = { left, right, cursor };
    lastAlbumArtUrl = url;
    lastAlbumArtColors = colors;
    return colors;
}

function findElements() {
    inputSurfer = document.getElementById('inputSurfer');
    simpleSlider = document.getElementById('simpleSlider');
    barSurfer = document.getElementById('barSurfer');
    mediaElement = document.getElementById('currentMediaElement') as HTMLMediaElement | null;
}

function normalizeStreamUrl(streamUrl: string | null | undefined): string | null {
    if (!streamUrl) return null;

    const trimmed = streamUrl.split('#')[0];
    try {
        const url = new URL(trimmed, window.location.href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

        url.searchParams.delete('api_key');
        url.searchParams.delete('X-Emby-Token');
        url.searchParams.delete('StartTimeTicks');

        return url.toString();
    } catch (err) {
        return null;
    }
}

function getCurrentStreamUrl(): string | null {
    const player = playbackManager.getCurrentPlayer();
    const playerUrl = typeof player?.currentSrc === 'function' ? player.currentSrc() : null;
    const elementUrl = mediaElement?.currentSrc || mediaElement?.src || null;

    return normalizeStreamUrl(playerUrl || elementUrl);
}

function getPlaybackContext() {
    const player = playbackManager.getCurrentPlayer();
    if (!player || !player.isLocalPlayer) return null;

    const item = playbackManager.currentItem(player);
    const itemId = item?.Id || null;
    const serverId = item?.ServerId;
    if (item?.MediaType && item.MediaType !== 'Audio') return null;
    if (!itemId || !serverId) return null;

    const apiClient = ServerConnections.getApiClient(serverId);
    return {
        apiClient,
        itemId,
        streamUrl: getCurrentStreamUrl()
    };
}

function isNewSong(newSongDuration: number, itemId: string | null, streamUrl: string | null) {
    if (itemId && itemId !== lastLoadedItemId) return true;
    if (streamUrl && streamUrl !== lastLoadedStreamUrl) return true;

    return (newSongDuration !== Math.floor(savedDuration * 10000000));
}

function syncWaveSurferTime() {
    if (!waveSurferInstance || !waveSurferReady || !mediaElement || isDragging) return;

    const currentTime = mediaElement.currentTime;
    if (!Number.isFinite(currentTime)) return;
    waveSurferInstance.setTime(currentTime);
}

function bindMediaSync(element: HTMLMediaElement | null) {
    if (activeMediaElement === element) return;

    if (activeMediaElement && mediaSyncHandler) {
        activeMediaElement.removeEventListener('timeupdate', mediaSyncHandler);
        activeMediaElement.removeEventListener('seeking', mediaSyncHandler);
        activeMediaElement.removeEventListener('loadedmetadata', mediaSyncHandler);
    }

    activeMediaElement = element;
    if (!element) {
        mediaSyncHandler = null;
        return;
    }

    mediaSyncHandler = () => syncWaveSurferTime();
    element.addEventListener('timeupdate', mediaSyncHandler);
    element.addEventListener('seeking', mediaSyncHandler);
    element.addEventListener('loadedmetadata', mediaSyncHandler);
}

function seekFromWaveSurfer(relativeX: number) {
    const player = playbackManager.getCurrentPlayer();
    if (!player) return;

    const clamped = Math.max(0, Math.min(relativeX, 1));
    playbackManager.seekPercent(clamped * 100, player);
}

function clearWaveSurferPlugins() {
    if (!waveSurferInstance) return;

    if (timelinePlugin) {
        waveSurferInstance.unregisterPlugin(timelinePlugin);
        timelinePlugin = null;
    }
    if (zoomPlugin) {
        waveSurferInstance.unregisterPlugin(zoomPlugin);
        zoomPlugin = null;
    }
    if (minimapPlugin) {
        waveSurferInstance.unregisterPlugin(minimapPlugin);
        minimapPlugin = null;
    }
    lastPluginContainer = null;
    lastPluginColorKey = null;
}

function applyWaveSurferPlugins(container: string) {
    if (!waveSurferInstance || !waveSurferReady) return;

    if (container === '#barSurfer') {
        clearWaveSurferPlugins();
        return;
    }

    const colorKey = JSON.stringify(waveSurferChannelStyle.map);
    if (lastPluginContainer === container && lastPluginColorKey === colorKey) return;

    clearWaveSurferPlugins();
    timelinePlugin = waveSurferInstance.registerPlugin(
        TimelinePlugin.create(waveSurferPluginOptions.timelineOptions)
    );
    zoomPlugin = waveSurferInstance.registerPlugin(
        ZoomPlugin.create(waveSurferPluginOptions.zoomOptions)
    );
    minimapPlugin = waveSurferInstance.registerPlugin(
        MiniMapPlugin.create(waveSurferChannelStyle.map)
    );
    lastPluginContainer = container;
    lastPluginColorKey = colorKey;
}

function applyWaveSurferStyle(minPxPerSec = currentZoom) {
    if (!waveSurferInstance) return;

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

function applyWaveSurferContainerOptions(container: string) {
    if (!waveSurferInstance) return;

    if (container === '#barSurfer') {
        waveSurferInstance.setOptions(waveSurferChannelStyle.bar);
        return;
    }

    if (!waveSurferReady) return;

    applyWaveSurferStyle(currentZoom);
    waveSurferInstance.zoom(currentZoom);
}

function getDistance(touches: TouchList): number {
    const [touch1, touch2] = touches;
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(e: TouchEvent): void {
    if (!waveSurferInstance) return;

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
    if (!waveSurferInstance) return;

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
    if (!waveSurferInstance) return;

    if (e.touches.length === 1) {
        waveSurferInstance.setOptions({
            autoCenter: true,
            autoScroll: true
        });
    }
    if (e.touches.length === 2) {
        initialDistance = null;
    }
    applyWaveSurferStyle(currentZoom);

    mobileTouch = false;
}

function bindTouchHandlers() {
    if (touchHandlersBound || !inputSurfer) return;

    inputSurfer.addEventListener('touchstart', onTouchStart, { passive: true });
    inputSurfer.addEventListener('touchmove', onTouchMove, { passive: true });
    inputSurfer.addEventListener('touchend', onTouchEnd, { passive: true });
    touchHandlersBound = true;
}

function unbindTouchHandlers() {
    if (!touchHandlersBound || !inputSurfer) return;

    inputSurfer.removeEventListener('touchstart', onTouchStart);
    inputSurfer.removeEventListener('touchmove', onTouchMove);
    inputSurfer.removeEventListener('touchend', onTouchEnd);
    touchHandlersBound = false;
}

function ensureWaveSurferInstance(container: string) {
    if (!waveSurferInstance) {
        waveSurferInstance = WaveSurfer.create({ ...surferOptions, container });
        waveSurferContainer = container;

        waveSurferInstance.on('zoom', (minPxPerSec) => {
            if (mobileTouch) return;
            applyWaveSurferStyle(minPxPerSec);
            currentZoom = minPxPerSec;
        });

        waveSurferInstance.on('dragstart', () => {
            isDragging = true;
        });

        waveSurferInstance.on('dragend', (relativeX) => {
            isDragging = false;
            seekFromWaveSurfer(relativeX);
        });

        waveSurferInstance.on('click', (relativeX) => {
            seekFromWaveSurfer(relativeX);
        });

        waveSurferInstance.on('ready', (duration) => {
            waveSurferReady = true;
            savedDuration = duration;
            savedPeaks = waveSurferInstance?.exportPeaks();

            if (waveSurferContainer) {
                applyWaveSurferContainerOptions(waveSurferContainer);
                applyWaveSurferPlugins(waveSurferContainer);
                if (waveSurferContainer === '#barSurfer') {
                    unbindTouchHandlers();
                } else {
                    bindTouchHandlers();
                }
            }
            syncWaveSurferTime();
        });

        waveSurferInstance.on('destroy', () => {
            resetVisibility();
            bindMediaSync(null);
            unbindTouchHandlers();
            clearWaveSurferPlugins();
            waveSurferReady = false;
        });

        return;
    }

    if (waveSurferContainer !== container) {
        waveSurferContainer = container;
        waveSurferInstance.setOptions({ container });
    }
}

async function loadWaveSurferAudio(apiClient: ApiClient, streamUrl: string, itemId: string | null) {
    if (!waveSurferInstance || !streamUrl) return;

    waveSurferReady = false;
    lastLoadedItemId = itemId;
    lastLoadedStreamUrl = streamUrl;

    const loadSequence = ++waveSurferLoadSequence;

    try {
        const response = await apiClient.ajax({
            type: 'GET',
            url: streamUrl
        });

        if (loadSequence !== waveSurferLoadSequence || !waveSurferInstance) return;
        if (!response || typeof response.blob !== 'function') return;

        const blob = await response.blob();
        if (loadSequence !== waveSurferLoadSequence || !waveSurferInstance) return;

        await waveSurferInstance.loadBlob(blob);
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (loadSequence !== waveSurferLoadSequence) return;
        console.warn('[WaveSurfer] Audio load failed', err);
    }
}

async function waveSurferInitialization(container: string, _legacy: WaveSurferLegacy, newSongDuration = 0) {
    findElements();

    if (!visualizerSettings.waveSurfer.enabled) {
        resetVisibility();
        bindMediaSync(null);
        return;
    }
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

    const playbackContext = getPlaybackContext();
    if (!playbackContext) return;

    const { apiClient, itemId, streamUrl } = playbackContext;

    const colors = await extractColorsFromAlbumArt(apiClient);
    waveSurferChannelStyle = createWaveSurferChannelStyle(colors);

    ensureWaveSurferInstance(container);
    setVisibility();
    bindMediaSync(mediaElement);

    if (waveSurferContainer) {
        applyWaveSurferContainerOptions(waveSurferContainer);
        applyWaveSurferPlugins(waveSurferContainer);
        if (waveSurferContainer === '#barSurfer') {
            unbindTouchHandlers();
        } else {
            bindTouchHandlers();
        }
    }

    const newSong = isNewSong(newSongDuration, itemId, streamUrl);
    if (newSong && streamUrl) {
        await loadWaveSurferAudio(apiClient, streamUrl, itemId);
        return;
    }

    syncWaveSurferTime();
}

function destroyWaveSurferInstance(): WaveSurferLegacy {
    if (!waveSurferInstance) {
        resetVisibility();
    }

    const legacy = {
        peaks: savedPeaks,
        duration: savedDuration,
        isPlaying: waveSurferInstance?.isPlaying() || false,
        currentTime: waveSurferInstance?.getCurrentTime() || 0,
        scrollPosition: waveSurferInstance?.getScroll() || 0
    };

    resetVisibility();
    bindMediaSync(null);
    unbindTouchHandlers();

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
