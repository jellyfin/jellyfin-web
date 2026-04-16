import { appHost } from '../components/apphost';

const GAMEPAD = {
    A: { index: 0, key: 'GamepadA', code: 195, repeat: false },
    B: { index: 1, key: 'GamepadB', code: 196, repeat: false },
    dPadUp: { index: 12, key: 'GamepadDPadUp', code: 38, repeat: true },
    dPadDown: { index: 13, key: 'GamepadDPadDown', code: 40, repeat: true },
    dPadLeft: { index: 14, key: 'GamepadDPadLeft', code: 37, repeat: true },
    dPadRight: { index: 15, key: 'GamepadDPadRight', code: 39, repeat: true }
};

const LEFT_THUMB = {
    UP: { key: 'GamepadLeftThumbStickUp', code: 38, repeat: true },
    DOWN: { key: 'GamepadLeftThumbStickDown', code: 40, repeat: true },
    LEFT: { key: 'GamepadLeftThumbStickLeft', code: 37, repeat: true },
    RIGHT: { key: 'GamepadLeftThumbStickRight', code: 39, repeat: true }
};

const PRESS_THRESHOLD = 0.75;
const RELEASE_THRESHOLD = 0.6; // hysteresis
const REPEAT_INITIAL_DELAY = 400; // ms
const REPEAT_INTERVAL = 100; // ms
const PRESS_CONSECUTIVE_FRAMES = 1; // require this many consecutive samples to accept a press
const SMOOTH_ALPHA = 0.2;

const now = () => new Date().getTime();

const isElectron = navigator.userAgent.toLowerCase().includes('electron');
const allowInput = () => {
    if (!isElectron && document.hidden) return false;
    return appHost.getWindowState() !== 'Minimized';
};

function makeKeyboardEvent(name, key, keyCode) {
    const ev = new Event(name, { bubbles: true, cancelable: true });
    ev.key = key;
    ev.keyCode = keyCode;
    return ev;
}

function dispatchKeyboardEvent(name, key, keyCode) {
    if (!allowInput()) return null;
    const ev = makeKeyboardEvent(name, key, keyCode);
    (document.activeElement || document.body).dispatchEvent(ev);
    return ev;
}

function clickActiveElement() {
    if (!allowInput()) return;
    const elem = document.activeElement || window;
    if (elem && typeof elem.click === 'function') elem.click();
}

/**
 * Internal runtime state for the gamepad-to-key translation.
 * @typedef {Object} GamepadState
 * @property {Map<string,boolean>} pressed - map of key name -> logical pressed state
 * @property {Map<string,number>} nextRepeatAt - map of key name -> next allowed repeat timestamp (ms)
 * @property {Map<string,boolean>} nonRepeatLocked - map of key name -> whether non-repeating key is locked until release
 * @property {Event|null} lastDownEvent - last dispatched down event (used for click-on-keyup semantics)
 * @property {Map<string,number>} pendingReleaseAt - map of key name -> pending release timestamp (ms)
 * @property {Map<string,number>} pressCounts - consecutive-press counters used for press-debounce
 * @property {Map<number,{x:number,y:number}>} smoothedAxes - per-gamepad smoothed axes
 */
/** @type {GamepadState} */
const state = {
    pressed: new Map(),
    nextRepeatAt: new Map(),
    nonRepeatLocked: new Map(),
    lastDownEvent: null,
    pendingReleaseAt: new Map(),
    pressCounts: new Map(),
    smoothedAxes: new Map()
};

function shouldFireInitialDown(prevPressed, newPressed) {
    return !prevPressed && newPressed;
}

function shouldFireRepeat(keyName, nowTs) {
    const next = state.nextRepeatAt.get(keyName) || 0;
    return nowTs >= next;
}

function handleKeyState(keyName, keyCode, prevPressed, newPressed, repeatsAllowed, clickOnKeyUp, oldDownEvent) {
    const nowTs = now();
    let producedEvent = null;
    let logicalPressed = prevPressed;
    const pending = state.pendingReleaseAt.get(keyName) || 0;

    // Non-repeating keys: if locked (we've fired a down and await keyup), ignore further downs
    if (!repeatsAllowed && state.nonRepeatLocked.get(keyName) && shouldFireInitialDown(prevPressed, newPressed)) {
        return null;
    }

    if (newPressed && pending) {
        state.pendingReleaseAt.delete(keyName);
    }

    if (shouldFireInitialDown(prevPressed, newPressed)) {
        producedEvent = dispatchKeyboardEvent('keydown', keyName, keyCode);
        // If event dispatched successfully: schedule first repeat or lock until keyup
        if (producedEvent) {
            if (repeatsAllowed) {
                state.nextRepeatAt.set(keyName, nowTs + REPEAT_INITIAL_DELAY);
            } else {
                state.nonRepeatLocked.set(keyName, true);
            }
            logicalPressed = true;
        }
    } else if (newPressed && prevPressed && repeatsAllowed) {
        // Held and repeating: check timer
        // Defensive: if repeat schedule missing, initialize it and don't fire immediately.
        if (!state.nextRepeatAt.has(keyName)) {
            state.nextRepeatAt.set(keyName, nowTs + REPEAT_INITIAL_DELAY);
        } else if (shouldFireRepeat(keyName, nowTs)) {
            producedEvent = dispatchKeyboardEvent('keydown', keyName, keyCode);
            if (producedEvent) state.nextRepeatAt.set(keyName, nowTs + REPEAT_INTERVAL);
        }
    } else if (!newPressed && prevPressed) {
        // Debounce releases for axes to avoid jitter-caused up/down cycles.
        const RELEASE_DEBOUNCE_MS = 120;
        if (!pending) {
            state.pendingReleaseAt.set(keyName, nowTs + RELEASE_DEBOUNCE_MS);
            return null;
        }

        if (nowTs < pending) {
            // still within debounce window; wait
            return { event: null, logicalPressed: prevPressed };
        }

        // Debounce elapsed: perform release
        state.pendingReleaseAt.delete(keyName);
        state.nextRepeatAt.delete(keyName);
        state.nonRepeatLocked.delete(keyName);
        producedEvent = dispatchKeyboardEvent('keyup', keyName, keyCode);
        logicalPressed = false;
        // keyup
        if (clickOnKeyUp && !oldDownEvent?.defaultPrevented && !producedEvent?.defaultPrevented) clickActiveElement();
    }

    return { event: producedEvent, logicalPressed };
}

function setPressed(keyName, keyCode, newPressed, repeatsAllowed = false, clickOnKeyUp = false, oldDownEvent = null) {
    const prev = !!state.pressed.get(keyName);
    const result = handleKeyState(keyName, keyCode, prev, newPressed, repeatsAllowed, clickOnKeyUp, oldDownEvent);
    if (result == null) {
        // no state change performed due to debounce
        return null;
    }

    const { event, logicalPressed } = result;
    state.pressed.set(keyName, !!logicalPressed);
    return event;
}

function axisPressed(value, positive = true) {
    return positive ? value > PRESS_THRESHOLD : value < -PRESS_THRESHOLD;
}

function axisReleased(value, positive = true) {
    return positive ? value < RELEASE_THRESHOLD : value > -RELEASE_THRESHOLD;
}

let animationFrameId = null;

function pollGamepads() {
    // eslint-disable-next-line compat/compat -- this is the whole point of this module
    const gpads = navigator.getGamepads();
    for (let i = 0; i < (gpads?.length || 0); i++) {
        const gp = gpads[i];
        if (!gp) continue;

        // Thumbstick
        const axes = gp.axes || [];
        const rawX = axes[0] || 0;
        const rawY = axes[1] || 0;

        // Smooth axes per gamepad index to reduce sample-to-sample jumps
        const sm = state.smoothedAxes.get(i) || { x: 0, y: 0 };
        const x = sm.x + (rawX - sm.x) * SMOOTH_ALPHA;
        const y = sm.y + (rawY - sm.y) * SMOOTH_ALPHA;
        state.smoothedAxes.set(i, { x, y });

        // Right/Left X (press-debounce: require consecutive frames)
        if (axisPressed(x, true)) {
            const prevCount = state.pressCounts.get(LEFT_THUMB.RIGHT.key) || 0;
            const count = prevCount + 1;
            state.pressCounts.set(LEFT_THUMB.RIGHT.key, count);
            if (count >= PRESS_CONSECUTIVE_FRAMES) {
                setPressed(LEFT_THUMB.RIGHT.key, LEFT_THUMB.RIGHT.code, true, true);
            }
        } else if (axisReleased(x, true)) {
            state.pressCounts.set(LEFT_THUMB.RIGHT.key, 0);
            setPressed(LEFT_THUMB.RIGHT.key, LEFT_THUMB.RIGHT.code, false, true);
        }

        if (axisPressed(x, false)) {
            const prevCount = state.pressCounts.get(LEFT_THUMB.LEFT.key) || 0;
            const count = prevCount + 1;
            state.pressCounts.set(LEFT_THUMB.LEFT.key, count);
            if (count >= PRESS_CONSECUTIVE_FRAMES) {
                setPressed(LEFT_THUMB.LEFT.key, LEFT_THUMB.LEFT.code, true, true);
            }
        } else if (axisReleased(x, false)) {
            state.pressCounts.set(LEFT_THUMB.LEFT.key, 0);
            setPressed(LEFT_THUMB.LEFT.key, LEFT_THUMB.LEFT.code, false, true);
        }

        if (axisPressed(y, false)) {
            const prevCount = state.pressCounts.get(LEFT_THUMB.UP.key) || 0;
            const count = prevCount + 1;
            state.pressCounts.set(LEFT_THUMB.UP.key, count);
            if (count >= PRESS_CONSECUTIVE_FRAMES) {
                setPressed(LEFT_THUMB.UP.key, LEFT_THUMB.UP.code, true, true);
            }
        } else if (axisReleased(y, false)) {
            state.pressCounts.set(LEFT_THUMB.UP.key, 0);
            setPressed(LEFT_THUMB.UP.key, LEFT_THUMB.UP.code, false, true);
        }

        if (axisPressed(y, true)) {
            const prevCount = state.pressCounts.get(LEFT_THUMB.DOWN.key) || 0;
            const count = prevCount + 1;
            state.pressCounts.set(LEFT_THUMB.DOWN.key, count);
            if (count >= PRESS_CONSECUTIVE_FRAMES) {
                setPressed(LEFT_THUMB.DOWN.key, LEFT_THUMB.DOWN.code, true, true);
            }
        } else if (axisReleased(y, true)) {
            state.pressCounts.set(LEFT_THUMB.DOWN.key, 0);
            setPressed(LEFT_THUMB.DOWN.key, LEFT_THUMB.DOWN.code, false, true);
        }

        const buttons = gp.buttons || [];
        // DPAD and A/B
        Object.values(GAMEPAD).forEach(gpButtonDefinition => {
            const button = buttons[gpButtonDefinition.index];
            if (!button) return;
            if (button.pressed) {
                // For A button we want to capture the down-event to support click-on-keyup semantics
                if (gpButtonDefinition.key === GAMEPAD.A.key) {
                    const evt = setPressed(gpButtonDefinition.key, gpButtonDefinition.code, true, gpButtonDefinition.repeat, true, state.lastDownEvent);
                    if (evt) state.lastDownEvent = evt;
                } else {
                    setPressed(gpButtonDefinition.key, gpButtonDefinition.code, true, gpButtonDefinition.repeat);
                }
            } else {
                setPressed(gpButtonDefinition.key, gpButtonDefinition.code, false, gpButtonDefinition.repeat);
                if (gpButtonDefinition.key === GAMEPAD.A.key) state.lastDownEvent = null;
            }
        });
    }

    animationFrameId = requestAnimationFrame(pollGamepads);
}

function startPolling() {
    if (!animationFrameId) pollGamepads();
}

function stopPolling() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
}

function isGamepadConnected() {
    // eslint-disable-next-line compat/compat -- this is the whole point of this module
    return navigator.getGamepads().some(gp => gp?.connected);
}

function onFocusOrGamepadAttach() {
    if (isGamepadConnected() && document.hasFocus()) startPolling();
}

function onFocusOrGamepadDetach() {
    if (!isGamepadConnected() || !document.hasFocus()) stopPolling();
}

window.addEventListener('gamepaddisconnected', onFocusOrGamepadDetach);
window.addEventListener('gamepadconnected', onFocusOrGamepadAttach);
window.addEventListener('blur', onFocusOrGamepadDetach);
window.addEventListener('focus', onFocusOrGamepadAttach);

onFocusOrGamepadAttach();

// Exports for testing and usage
export default {
    start: startPolling,
    stop: stopPolling
};
