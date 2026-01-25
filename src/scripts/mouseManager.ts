import inputManager from './inputManager';
import focusManager from '../components/focusManager';
import browser from './browser';
import layoutManager from '../components/layoutManager';
import dom from '../utils/dom';
import Events from '../utils/events';
import { scrollToActivePlaylistItem } from '../components/sitbackMode/sitback.logic';

const self = {};
let lastMouseInputTime = new Date().getTime();
let isMouseIdle: boolean = false;

function mouseIdleTime(): number {
    return new Date().getTime() - lastMouseInputTime;
}

function notifyApp() {
    inputManager.notifyMouseMove();
}

function removeIdleClasses() {
    document.body.classList.remove('mouseIdle', 'mouseIdle-tv');
}

function addIdleClasses() {
    document.body.classList.add('mouseIdle');
    if (layoutManager.tv) {
        document.body.classList.add('mouseIdle-tv');
    }
}

export function showCursor(): void {
    if (isMouseIdle) {
        isMouseIdle = false;
        removeIdleClasses();
        Events.trigger(self, 'mouseactive');
    }
}

export function hideCursor(): void {
    if (!isMouseIdle) {
        isMouseIdle = true;
        addIdleClasses();
        Events.trigger(self, 'mouseidle');
        scrollToActivePlaylistItem();
    }
}

let lastPointerMoveData: { x: number; y: number } | null = null;

function onPointerMove(e: MouseEvent | PointerEvent) {
    const eventX = e.screenX || e.clientX;
    const eventY = e.screenY || e.clientY;

    if (eventX === undefined && eventY === undefined) return;

    if (!lastPointerMoveData) {
        lastPointerMoveData = { x: eventX, y: eventY };
        return;
    }

    if (Math.abs(eventX - lastPointerMoveData.x) < 10 && Math.abs(eventY - lastPointerMoveData.y) < 10) return;

    lastPointerMoveData.x = eventX;
    lastPointerMoveData.y = eventY;
    lastMouseInputTime = new Date().getTime();
    notifyApp();
    showCursor();
}

function onPointerEnter(e: Event) {
    const pointerType = (e as any).pointerType || (layoutManager.mobile ? 'touch' : 'mouse');
    if (pointerType === 'mouse' && !isMouseIdle) {
        const parent = focusManager.focusableParent(e.target as HTMLElement);
        if (parent) focusManager.focus(parent);
    }
}

function enableFocusWithMouse(): boolean {
    return layoutManager.tv && !browser.web0s && !!browser.tv;
}

let mouseInterval: any = null;

function startMouseInterval() {
    if (!mouseInterval)
        mouseInterval = setInterval(() => {
            if (!isMouseIdle && mouseIdleTime() >= 5000) hideCursor();
        }, 5000);
}

function stopMouseInterval() {
    if (mouseInterval) {
        clearInterval(mouseInterval);
        mouseInterval = null;
    }
    removeIdleClasses();
}

function initMouse() {
    stopMouseInterval();
    const moveEvent = (window as any).PointerEvent ? 'pointermove' : 'mousemove';
    dom.removeEventListener(document, moveEvent, onPointerMove, { passive: true });

    if (!layoutManager.mobile) {
        startMouseInterval();
        dom.addEventListener(document, moveEvent, onPointerMove, { passive: true });
    }

    const enterEvent = (window as any).PointerEvent ? 'pointerenter' : 'mouseenter';
    dom.removeEventListener(document, enterEvent, onPointerEnter, { capture: true, passive: true });

    if (enableFocusWithMouse()) {
        dom.addEventListener(document, enterEvent, onPointerEnter, { capture: true, passive: true });
    }
}

if (typeof document !== 'undefined') {
    initMouse();
    Events.on(layoutManager, 'modechange', initMouse);
}

const mouseManager = { hideCursor, showCursor };
export default mouseManager;
