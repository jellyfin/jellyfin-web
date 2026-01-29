import { safeAppHost } from '../components/apphost';

const _GAMEPAD_A_BUTTON_INDEX = 0;
const _GAMEPAD_B_BUTTON_INDEX = 1;
const _GAMEPAD_DPAD_UP_BUTTON_INDEX = 12;
const _GAMEPAD_DPAD_DOWN_BUTTON_INDEX = 13;
const _GAMEPAD_DPAD_LEFT_BUTTON_INDEX = 14;
const _GAMEPAD_DPAD_RIGHT_BUTTON_INDEX = 15;
const _GAMEPAD_A_KEY = 'GamepadA';
const _GAMEPAD_B_KEY = 'GamepadB';
const _GAMEPAD_DPAD_UP_KEY = 'GamepadDPadUp';
const _GAMEPAD_DPAD_DOWN_KEY = 'GamepadDPadDown';
const _GAMEPAD_DPAD_LEFT_KEY = 'GamepadDPadLeft';
const _GAMEPAD_DPAD_RIGHT_KEY = 'GamepadDPadRight';
const _GAMEPAD_LEFT_THUMBSTICK_UP_KEY = 'GamepadLeftThumbStickUp';
const _GAMEPAD_LEFT_THUMBSTICK_DOWN_KEY = 'GamepadLeftThumbStickDown';
const _GAMEPAD_LEFT_THUMBSTICK_LEFT_KEY = 'GamepadLeftThumbStickLeft';
const _GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEY = 'GamepadLeftThumbStickRight';
const _GAMEPAD_A_KEYCODE = 13;
const _GAMEPAD_B_KEYCODE = 27;
const _GAMEPAD_DPAD_UP_KEYCODE = 38;
const _GAMEPAD_DPAD_DOWN_KEYCODE = 40;
const _GAMEPAD_DPAD_LEFT_KEYCODE = 37;
const _GAMEPAD_DPAD_RIGHT_KEYCODE = 39;
const _THUMB_STICK_THRESHOLD = 0.75;

let _leftThumbstickUpPressed = false;
let _leftThumbstickDownPressed = false;
let _leftThumbstickLeftPressed = false;
let _leftThumbstickRightPressed = false;
let _dPadUpPressed = false;
let _dPadDownPressed = false;
let _dPadLeftPressed = false;
let _dPadRightPressed = false;
let _gamepadADownEvent: any = null;
let _gamepadAPressed = false;
let _gamepadBPressed = false;

const ProcessedButtons = [0, 1, 12, 13, 14, 15];
const times: Record<string, number> = {};

function throttle(key: string): boolean {
    const time = times[key] || 0;
    const now = Date.now();
    return now - time >= 200;
}

function resetThrottle(key: string) {
    times[key] = Date.now();
}

function allowInput(): boolean {
    if (document.hidden) return false;
    return safeAppHost.getWindowState() !== 'Minimized';
}

function raiseEvent(name: string, key: string, keyCode: number) {
    if (!allowInput()) return null;
    const event = new Event(name, { bubbles: true, cancelable: true }) as any;
    event.key = key;
    event.keyCode = keyCode;
    (document.activeElement || document.body).dispatchEvent(event);
    return event;
}

function raiseKeyEvent(
    old: boolean,
    curr: boolean,
    key: string,
    code: number,
    repeat = false,
    click = false,
    oldEvt?: any
) {
    let evt = null;
    if (curr === true) {
        let fire = false;
        if (old === false) {
            fire = true;
            resetThrottle(key);
        } else if (repeat) fire = throttle(key);
        if (fire && code) evt = raiseEvent('keydown', key, code);
    } else if (curr === false && old === true) {
        resetThrottle(key);
        if (code) evt = raiseEvent('keyup', key, code);
        if (click && !oldEvt?.defaultPrevented && !evt?.defaultPrevented) {
            (document.activeElement as HTMLElement)?.click();
        }
    }
    return evt;
}

const _ButtonPressedState = {
    setgamepadA: (s: boolean) => {
        const evt = raiseKeyEvent(
            _gamepadAPressed,
            s,
            _GAMEPAD_A_KEY,
            _GAMEPAD_A_KEYCODE,
            false,
            true,
            _gamepadADownEvent
        );
        _gamepadAPressed = s;
        if (!s) _gamepadADownEvent = null;
        else if (evt) _gamepadADownEvent = evt;
    },
    setgamepadB: (s: boolean) => {
        raiseKeyEvent(_gamepadBPressed, s, _GAMEPAD_B_KEY, _GAMEPAD_B_KEYCODE);
        _gamepadBPressed = s;
    },
    setleftThumbstickUp: (s: boolean) => {
        raiseKeyEvent(_leftThumbstickUpPressed, s, _GAMEPAD_LEFT_THUMBSTICK_UP_KEY, 38, true);
        _leftThumbstickUpPressed = s;
    },
    setleftThumbstickDown: (s: boolean) => {
        raiseKeyEvent(_leftThumbstickDownPressed, s, _GAMEPAD_LEFT_THUMBSTICK_DOWN_KEY, 40, true);
        _leftThumbstickDownPressed = s;
    },
    setleftThumbstickLeft: (s: boolean) => {
        raiseKeyEvent(_leftThumbstickLeftPressed, s, _GAMEPAD_LEFT_THUMBSTICK_LEFT_KEY, 37, true);
        _leftThumbstickLeftPressed = s;
    },
    setleftThumbstickRight: (s: boolean) => {
        raiseKeyEvent(_leftThumbstickRightPressed, s, _GAMEPAD_LEFT_THUMBSTICK_RIGHT_KEY, 39, true);
        _leftThumbstickRightPressed = s;
    },
    setdPadUp: (s: boolean) => {
        raiseKeyEvent(_dPadUpPressed, s, _GAMEPAD_DPAD_UP_KEY, 38, true);
        _dPadUpPressed = s;
    },
    setdPadDown: (s: boolean) => {
        raiseKeyEvent(_dPadDownPressed, s, _GAMEPAD_DPAD_DOWN_KEY, 40, true);
        _dPadDownPressed = s;
    },
    setdPadLeft: (s: boolean) => {
        raiseKeyEvent(_dPadLeftPressed, s, _GAMEPAD_DPAD_LEFT_KEY, 37, true);
        _dPadLeftPressed = s;
    },
    setdPadRight: (s: boolean) => {
        raiseKeyEvent(_dPadRightPressed, s, _GAMEPAD_DPAD_RIGHT_KEY, 39, true);
        _dPadRightPressed = s;
    }
};

let loopTimer: any;
function runLoop() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (!gamepad) continue;
        const [x, y] = gamepad.axes;
        _ButtonPressedState.setleftThumbstickRight(x > _THUMB_STICK_THRESHOLD);
        _ButtonPressedState.setleftThumbstickLeft(x < -_THUMB_STICK_THRESHOLD);
        _ButtonPressedState.setleftThumbstickUp(y < -_THUMB_STICK_THRESHOLD);
        _ButtonPressedState.setleftThumbstickDown(y > _THUMB_STICK_THRESHOLD);

        gamepad.buttons.forEach((btn, j) => {
            if (!ProcessedButtons.includes(j)) return;
            const p = btn.pressed;
            if (j === 12) _ButtonPressedState.setdPadUp(p);
            else if (j === 13) _ButtonPressedState.setdPadDown(p);
            else if (j === 14) _ButtonPressedState.setdPadLeft(p);
            else if (j === 15) _ButtonPressedState.setdPadRight(p);
            else if (j === 0) _ButtonPressedState.setgamepadA(p);
            else if (j === 1) _ButtonPressedState.setgamepadB(p);
        });
    }
    loopTimer = requestAnimationFrame(runLoop);
}

function isConnected() {
    return Array.from(navigator.getGamepads()).some((g) => g?.connected);
}

function onFocusOrAttach() {
    if (isConnected() && document.hasFocus() && !loopTimer) runLoop();
}

function onBlurOrDetach() {
    if (!isConnected() || !document.hasFocus()) {
        cancelAnimationFrame(loopTimer);
        loopTimer = null;
    }
}

window.addEventListener('gamepaddisconnected', onBlurOrDetach);
window.addEventListener('gamepadconnected', onFocusOrAttach);
window.addEventListener('blur', onBlurOrDetach);
window.addEventListener('focus', onFocusOrAttach);

onFocusOrAttach();
if ((navigator as any).gamepadInputEmulation === 'string')
    (navigator as any).gamepadInputEmulation = 'gamepad';
