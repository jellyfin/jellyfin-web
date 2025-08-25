import layoutManager from '../layoutManager';
import inputManager from '../../scripts/inputManager';

const sitbackSettings = {
    songInfoDisplayDurationInSeconds: 5
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
    }, (sitbackSettings.songInfoDisplayDurationInSeconds * 1000));
}

// Enable mouse idle tracking on mobile to ease Butterchurn blur
if (layoutManager.mobile) {
    const idleDelay = 5000;
    let lastInput = Date.now();
    let isIdle = false;

    function showCursor() {
        if (isIdle) {
            isIdle = false;
            const classList = document.body.classList;
            classList.remove('mouseIdle');
            classList.remove('mouseIdle-tv');
        }
    }

    function hideCursor() {
        if (!isIdle) {
            isIdle = true;
            const classList = document.body.classList;
            classList.add('mouseIdle');
            if (layoutManager.tv) {
                classList.add('mouseIdle-tv');
            }
            scrollToActivePlaylistItem();
        }
    }

    function pointerActivity() {
        lastInput = Date.now();
        inputManager.notifyMouseMove();
        showCursor();
    }

    document.addEventListener(window.PointerEvent ? 'pointermove' : 'mousemove', pointerActivity, { passive: true });
    document.addEventListener(window.PointerEvent ? 'pointerdown' : 'mousedown', pointerActivity, { passive: true });

    setInterval(() => {
        if (!isIdle && Date.now() - lastInput >= idleDelay) {
            hideCursor();
        }
    }, idleDelay);
}
