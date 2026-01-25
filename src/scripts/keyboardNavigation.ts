import browser from './browser';
import inputManager from './inputManager';
import layoutManager from '../components/layoutManager';
import appSettings from './settings/appSettings';

const KeyNames: Record<number, string> = {
    13: 'Enter',
    19: 'Pause',
    27: 'Escape',
    32: 'Space',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    138: 'NavigationUp',
    139: 'NavigationDown',
    140: 'NavigationLeft',
    141: 'NavigationRight',
    195: 'GamepadA',
    196: 'GamepadB',
    203: 'GamepadDPadUp',
    204: 'GamepadDPadDown',
    205: 'GamepadDPadLeft',
    206: 'GamepadDPadRight',
    211: 'GamepadLeftThumbUp',
    212: 'GamepadLeftThumbDown',
    214: 'GamepadLeftThumbLeft',
    213: 'GamepadLeftThumbRight',
    412: 'MediaRewind',
    413: 'MediaStop',
    414: 'MediaPlayPause',
    415: 'MediaTrackNext',
    416: 'MediaTrackPrevious',
    417: 'MediaFastForward'
};

function enable() {
    const keyDownHandler = function (e: KeyboardEvent) {
        let capture = true;

        const keyName = KeyNames[e.keyCode];

        switch (keyName) {
            case 'BrowserHome':
                inputManager.handleCommand('home');
                break;
            case 'BrowserBack':
                inputManager.handleCommand('back');
                break;
            case 'Find':
                inputManager.handleCommand('search');
                break;
            default:
                capture = Object.values(KeyNames).includes(keyName || '');
        }

        if (capture) e.preventDefault();
    };

    document.addEventListener('keydown', keyDownHandler);
}

function attachGamepadScript() {
    window.removeEventListener('gamepadconnected', attachGamepadScript);
    import('./gamepadtokey');
}

if (
    typeof navigator !== 'undefined' &&
    navigator.getGamepads &&
    (appSettings as any).enableGamepad() &&
    typeof (appSettings as any).enableGamepad === 'function'
) {
    window.addEventListener('gamepadconnected', attachGamepadScript);
}

const keyboardNavigation = {
    enable,
    getKeyName: (keyCode: number) => KeyNames[keyCode] || '',
    isNavigationKey: (key: string) => Object.values(KeyNames).includes(key || ''),
    canEnableGamepad: () =>
        typeof navigator !== 'undefined' &&
        navigator.getGamepads &&
        (appSettings as any).enableGamepad() &&
        typeof (appSettings as any).enableGamepad === 'function'
};

export default keyboardNavigation;
