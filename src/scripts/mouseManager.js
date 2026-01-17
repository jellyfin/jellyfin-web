import inputManager from './inputManager';
import focusManager from '../components/focusManager';
import browser from './browser';
import layoutManager from '../components/layoutManager';
import dom from '../utils/dom';
import Events from '../utils/events';
import { scrollToActivePlaylistItem } from 'components/sitbackMode/sitback.logic';

const self = {};

let lastMouseInputTime = new Date().getTime();
let isMouseIdle;

function mouseIdleTime() {
    return new Date().getTime() - lastMouseInputTime;
}

function notifyApp() {
    inputManager.notifyMouseMove();
}

function removeIdleClasses() {
    const classList = document.body.classList;

    classList.remove('mouseIdle');
    classList.remove('mouseIdle-tv');
}

function addIdleClasses() {
    const classList = document.body.classList;

    classList.add('mouseIdle');

    if (layoutManager.tv) {
        classList.add('mouseIdle-tv');
    }
}

export function showCursor() {
    if (isMouseIdle) {
        isMouseIdle = false;
        removeIdleClasses();
        Events.trigger(self, 'mouseactive');
    }
}

export function hideCursor() {
    if (!isMouseIdle) {
        isMouseIdle = true;
        addIdleClasses();
        Events.trigger(self, 'mouseidle');
        scrollToActivePlaylistItem();
    }
}

let lastPointerMoveData;
function onPointerMove(e) {
    const eventX = e.screenX || e.clientX;
    const eventY = e.screenY || e.clientY;

    // if coord don't exist how could it move
    if (typeof eventX === 'undefined' && typeof eventY === 'undefined') {
        return;
    }

    const obj = lastPointerMoveData;
    if (!obj) {
        lastPointerMoveData = {
            x: eventX,
            y: eventY
        };
        return;
    }

    // if coord are same, it didn't move
    if (Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10) {
        return;
    }

    obj.x = eventX;
    obj.y = eventY;

    lastMouseInputTime = new Date().getTime();
    notifyApp();

    showCursor();
}

function onPointerEnter(e) {
    const pointerType = e.pointerType || (layoutManager.mobile ? 'touch' : 'mouse');

    if (pointerType === 'mouse' && !isMouseIdle) {
        const parent = focusManager.focusableParent(e.target);
        if (parent) {
            focusManager.focus(parent);
        }
    }
}

function enableFocusWithMouse() {
    if (!layoutManager.tv) {
        return false;
    }

    if (browser.web0s) {
        return false;
    }

    return !!browser.tv;
}

function onMouseInterval() {
    if (!isMouseIdle && mouseIdleTime() >= 5000) {
        hideCursor();
    }
}

let mouseInterval;
function startMouseInterval() {
    if (!mouseInterval) {
        mouseInterval = setInterval(onMouseInterval, 5000);
    }
}

function stopMouseInterval() {
    const interval = mouseInterval;

    if (interval) {
        clearInterval(interval);
        mouseInterval = null;
    }

    removeIdleClasses();
}

function initMouse() {
    stopMouseInterval();

    /* eslint-disable-next-line compat/compat */
    dom.removeEventListener(document, (window.PointerEvent ? 'pointermove' : 'mousemove'), onPointerMove, {
        passive: true
    });

    if (!layoutManager.mobile) {
        startMouseInterval();

        dom.addEventListener(document, (window.PointerEvent ? 'pointermove' : 'mousemove'), onPointerMove, {
            passive: true
        });
    }

    /* eslint-disable-next-line compat/compat */
    dom.removeEventListener(document, (window.PointerEvent ? 'pointerenter' : 'mouseenter'), onPointerEnter, {
        capture: true,
        passive: true
    });

    if (enableFocusWithMouse()) {
        dom.addEventListener(document, (window.PointerEvent ? 'pointerenter' : 'mouseenter'), onPointerEnter, {
            capture: true,
            passive: true
        });
    }
}

initMouse();

Events.on(layoutManager, 'modechange', initMouse);

export default {
    hideCursor,
    showCursor
};

