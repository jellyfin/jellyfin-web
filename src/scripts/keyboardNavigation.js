/**
 * Module for performing keyboard navigation.
 * @module components/input/keyboardnavigation
 */

import browser from './browser';
import inputManager from './inputManager';
import layoutManager from '../components/layoutManager';
import appSettings from './settings/appSettings';

/**
 * Key name mapping.
 */
const KeyNames = {
    13: 'Enter',
    19: 'Pause',
    27: 'Escape',
    32: 'Space',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',

    // UWP WebView section start --
    // Navigation Up/Down/Left/Right is part of TVJS directionalnavigation-1.0.0.0.js
    // Unsure what this is used for. Media remote?
    138: 'ArrowUp',
    139: 'ArrowDown',
    140: 'ArrowLeft',
    141: 'ArrowRight',

    195: 'GamepadA',
    // Currently Xbox UWP WebView 2 sends code 27 (Escape instead) despite being undocumented
    // Desktop UWP unchanged
    // GamepadB
    196: 'Escape',

    // DPad Up/Down/Left/Right
    203: 'ArrowUp',
    204: 'ArrowDown',
    205: 'ArrowLeft',
    206: 'ArrowRight',

    // Currently Xbox UWP WebView 2 sends Arrow keycodes despite being undocumented
    // Desktop UWP unchanged
    // Left Thumbstick Up/Down/Left/Right
    211: 'ArrowUp',
    212: 'ArrowDown',
    214: 'ArrowLeft',
    213: 'ArrowRight',
    // End of UWP WebView Section

    // MediaRewind (Tizen/WebOS)
    412: 'MediaRewind',
    // MediaStop (Tizen/WebOS)
    413: 'MediaStop',
    // MediaPlay (Tizen/WebOS)
    415: 'MediaPlay',
    // MediaFastForward (Tizen/WebOS)
    417: 'MediaFastForward',
    // Back (WebOS)
    461: 'Back',
    // Back (Tizen)
    10009: 'Back',
    // MediaTrackPrevious (Tizen)
    10232: 'MediaTrackPrevious',
    // MediaTrackNext (Tizen)
    10233: 'MediaTrackNext',
    // MediaPlayPause (Tizen)
    10252: 'MediaPlayPause'
};

/**
 * Keys used for keyboard navigation.
 */
const NavigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'BrowserHome', 'Find'];
/**
 * Keys used for media playback control.
 */
const MediaKeys = ['MediaRewind', 'MediaStop', 'MediaPlay', 'MediaFastForward', 'MediaTrackPrevious', 'MediaTrackNext', 'MediaPlayPause'];

/**
 * Elements for which navigation should be constrained.
 */
const InteractiveElements = ['INPUT', 'TEXTAREA'];

/**
 * Types of INPUT element for which navigation shouldn't be constrained.
 */
const NonInteractiveInputElements = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'reset', 'submit'];

let hasFieldKey = false;
try {
    hasFieldKey = 'key' in new KeyboardEvent('keydown');
} catch (e) {
    console.error("error checking 'key' field", e);
}

if (!hasFieldKey) {
    // Add [a..z]
    for (let i = 65; i <= 90; i++) {
        KeyNames[i] = String.fromCharCode(i).toLowerCase();
    }
}

/**
 * Returns key name from event.
 *
 * @param {KeyboardEvent} event - Keyboard event.
 * @return {string} Key name.
 */
export function getKeyName(event) {
    return KeyNames[event.keyCode] || event.key;
}

/**
 * Returns _true_ if key is used for navigation.
 *
 * @param {string} key - Key name.
 * @return {boolean} _true_ if key is used for navigation.
 */
export function isNavigationKey(key) {
    return NavigationKeys.indexOf(key) != -1;
}

/**
 * Returns _true_ if key is used for media playback control.
 *
 * @param {string} key - Key name.
 * @return {boolean} _true_ if key is used for media playback control.
 */
export function isMediaKey(key) {
    return MediaKeys.includes(key);
}

/**
 * Returns _true_ if the element is interactive.
 *
 * @param {Element} element - Element.
 * @return {boolean} _true_ if the element is interactive.
 */
export function isInteractiveElement(element) {
    if (element && InteractiveElements.includes(element.tagName)) {
        if (element.tagName === 'INPUT') {
            return !NonInteractiveInputElements.includes(element.type);
        }

        return true;
    }

    return false;
}

export function enable() {
    const hasMediaSession = 'mediaSession' in navigator;
    window.addEventListener('keydown', function (e) {
        if (e.defaultPrevented) return;

        // Skip modified keys
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = getKeyName(e);

        // Ignore navigation keys for non-TV
        if (!layoutManager.tv && isNavigationKey(key)) {
            return;
        }

        // Ignore Media Keys for non-TV platform having MediaSession API
        if (!browser.tv && isMediaKey(key) && hasMediaSession) {
            return;
        }

        let capture = true;

        switch (key) {
            case 'ArrowLeft':
                if (!isInteractiveElement(document.activeElement)) {
                    inputManager.handleCommand('left');
                } else {
                    capture = false;
                }
                break;
            case 'ArrowUp':
                inputManager.handleCommand('up');
                break;
            case 'ArrowRight':
                if (!isInteractiveElement(document.activeElement)) {
                    inputManager.handleCommand('right');
                } else {
                    capture = false;
                }
                break;
            case 'ArrowDown':
                inputManager.handleCommand('down');
                break;

            case 'GamepadA':
                inputManager.handleCommand('select');
                break;
            case 'Back':
                inputManager.handleCommand('back');
                break;

            // HACK: Hisense TV (VIDAA OS) uses Backspace for Back action
            case 'Backspace':
                if (browser.tv && browser.hisense && browser.vidaa) {
                    inputManager.handleCommand('back');
                } else {
                    capture = false;
                }
                break;

            case 'Escape':
                if (layoutManager.tv) {
                    inputManager.handleCommand('back');
                } else {
                    capture = false;
                }
                break;

            case 'Find':
                inputManager.handleCommand('search');
                break;
            case 'BrowserHome':
                inputManager.handleCommand('home');
                break;

            case 'MediaPlay':
                inputManager.handleCommand('play');
                break;
            case 'Pause':
                inputManager.handleCommand('pause');
                break;
            case 'MediaPlayPause':
                inputManager.handleCommand('playpause');
                break;
            case 'MediaRewind':
                inputManager.handleCommand('rewind');
                break;
            case 'MediaFastForward':
                inputManager.handleCommand('fastforward');
                break;
            case 'MediaStop':
                inputManager.handleCommand('stop');
                break;
            case 'MediaTrackPrevious':
                inputManager.handleCommand('previoustrack');
                break;
            case 'MediaTrackNext':
                inputManager.handleCommand('nexttrack');
                break;

            default:
                capture = false;
        }

        if (capture) {
            console.debug('disabling default event handling');
            e.preventDefault();
        }
    });
}

// Gamepad initialisation. No script is required if no gamepads are present at init time, saving a bit of resources.
// Whenever the gamepad is connected, we hand all the control of the gamepad to gamepadtokey.js by removing the event handler
function attachGamepadScript() {
    console.log('Gamepad connected! Attaching gamepadtokey.js script');
    window.removeEventListener('gamepadconnected', attachGamepadScript);
    import('./gamepadtokey');
}

// No need to check for gamepads manually at load time, the eventhandler will be fired for that
// Not needed for UWP
if (navigator.getGamepads && appSettings.enableGamepad() && !browser.xboxOne) {
    window.addEventListener('gamepadconnected', attachGamepadScript);
}

export default {
    enable: enable,
    getKeyName: getKeyName,
    isNavigationKey: isNavigationKey
};
