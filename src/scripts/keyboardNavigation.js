/**
 * Module for performing keyboard navigation.
 * @module components/input/keyboardnavigation
 */

import inputManager from 'inputManager';
import layoutManager from 'layoutManager';

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
const NavigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

let hasFieldKey = false;
try {
    hasFieldKey = 'key' in new KeyboardEvent('keydown');
} catch (e) {
    console.error("error checking 'key' field");
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

export function enable() {
    window.addEventListener('keydown', function (e) {
        const key = getKeyName(e);

        // Ignore navigation keys for non-TV
        if (!layoutManager.tv && isNavigationKey(key)) {
            return;
        }

        let capture = true;

        switch (key) {
            case 'ArrowLeft':
                inputManager.handle('left');
                break;
            case 'ArrowUp':
                inputManager.handle('up');
                break;
            case 'ArrowRight':
                inputManager.handle('right');
                break;
            case 'ArrowDown':
                inputManager.handle('down');
                break;

            case 'Back':
                inputManager.handle('back');
                break;

            case 'Escape':
                if (layoutManager.tv) {
                    inputManager.handle('back');
                } else {
                    capture = false;
                }
                break;

            case 'MediaPlay':
                inputManager.handle('play');
                break;
            case 'Pause':
                inputManager.handle('pause');
                break;
            case 'MediaPlayPause':
                inputManager.handle('playpause');
                break;
            case 'MediaRewind':
                inputManager.handle('rewind');
                break;
            case 'MediaFastForward':
                inputManager.handle('fastforward');
                break;
            case 'MediaStop':
                inputManager.handle('stop');
                break;
            case 'MediaTrackPrevious':
                inputManager.handle('previoustrack');
                break;
            case 'MediaTrackNext':
                inputManager.handle('nexttrack');
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
function attachGamepadScript(e) {
    console.log('Gamepad connected! Attaching gamepadtokey.js script');
    window.removeEventListener('gamepadconnected', attachGamepadScript);
    require(['scripts/gamepadtokey']);
}

// No need to check for gamepads manually at load time, the eventhandler will be fired for that
if (navigator.getGamepads) { /* eslint-disable-line compat/compat */
    window.addEventListener('gamepadconnected', attachGamepadScript);
}

export default {
    enable: enable,
    getKeyName: getKeyName,
    isNavigationKey: isNavigationKey
};
