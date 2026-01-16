import layoutManager from '../layoutManager';
import inputManager from '../../scripts/inputManager';
import { visualizerSettings } from '../visualizer/visualizers.logic';

const defaultSitbackSettings = {
    trackInfoDuration: 5,
    autoHideTimer: 5
};

let activePlaylistItem: HTMLElement | null;

declare let window: Window & { Emby: IEmby };

interface IEmby {
    Page: { currentRouteInfo: { path: string } };
}

function isNowPlaying() {
    return (window.location.hash === '#/queue');
}

function findActivePlaylistItem() {
    const activePlaylistItems = document.getElementsByClassName('playlistIndexIndicatorImage');
    if (activePlaylistItems) activePlaylistItem = activePlaylistItems[0] as HTMLElement;
}

export function scrollPageToTop() {
    requestAnimationFrame(() => {
        document.body.scrollIntoView({
            block: 'start',
            inline: 'nearest',
            behavior: 'smooth'
        });
    });
}

const smoothScrollSettings = {
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth'
} as ScrollIntoViewOptions;

let scrollTimeout: NodeJS.Timeout;
let scrollTimeout2: NodeJS.Timeout;

export function scrollToActivePlaylistItem() {
    clearTimeout(scrollTimeout);
    clearTimeout(scrollTimeout2);
    if (!isNowPlaying() || window.innerWidth < 400) return;
    scrollTimeout = setTimeout(()=>{
        findActivePlaylistItem();

        if (activePlaylistItem) {
            activePlaylistItem.scrollIntoView(smoothScrollSettings);

            scrollTimeout2 = setTimeout(()=>{
                document.body.scrollIntoView(smoothScrollSettings);
            }, 1200);
        }
    }, 300);
}

function startTransition() {
    const classList = document.body.classList;
    classList.add('transition');
    classList.remove('songEnd');
}

function endTransition() {
    const classList = document.body.classList;
    classList.remove('transition');
}

export function endSong() {
    if (!isNowPlaying()) return;

    endTransition();
    const classList = document.body.classList;
    classList.add('songEnd');
}

export function triggerSongInfoDisplay() {
    if (!isNowPlaying()) return;

    startTransition();

    setTimeout(()=>{
        endTransition();
    }, ((visualizerSettings.sitback?.trackInfoDuration ?? defaultSitbackSettings.trackInfoDuration) * 1000));
}

// Enable mouse idle tracking on mobile to ease Butterchurn blur
if (layoutManager.mobile) {
    let lastInput = Date.now();
    let isIdle = false;

    const showCursor = () => {
        if (isIdle) {
            isIdle = false;
            const classList = document.body.classList;
            classList.remove('mouseIdle');
            classList.remove('mouseIdle-tv');
        }
    };

    const hideCursor = () => {
        if (!isIdle) {
            isIdle = true;
            const classList = document.body.classList;
            classList.add('mouseIdle');
            if (layoutManager.tv) {
                classList.add('mouseIdle-tv');
            }
            scrollToActivePlaylistItem();
        }
    };

    const pointerActivity = () => {
        lastInput = Date.now();
        inputManager.notifyMouseMove();
        showCursor();
    };

    const hasPointerEvent = 'PointerEvent' in window;
    document.addEventListener(hasPointerEvent ? 'pointermove' : 'mousemove', pointerActivity, { passive: true });
    document.addEventListener(hasPointerEvent ? 'pointerdown' : 'mousedown', pointerActivity, { passive: true });

    // Reset idle timer when tab becomes visible to prevent immediate hiding on return
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            lastInput = Date.now();
            showCursor();
        }
    });

    const getIdleDelayMs = () => {
        const seconds = visualizerSettings.sitback?.autoHideTimer ?? defaultSitbackSettings.autoHideTimer;
        return Math.max(1, seconds) * 1000;
    };

    setInterval(() => {
        if (!isIdle && Date.now() - lastInput >= getIdleDelayMs()) {
            hideCursor();
        }
    }, 1000);
}
