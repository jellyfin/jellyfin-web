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
    415: 'MediaPlay',
    417: 'MediaFastForward',
    461: 'Back',
    10009: 'Back',
    10232: 'MediaTrackPrevious',
    10233: 'MediaTrackNext',
    10252: 'MediaPlayPause'
};

const KeyAliases: Record<string, string> = {
    GamepadB: 'Escape',
    NavigationUp: 'ArrowUp',
    NavigationDown: 'ArrowDown',
    NavigationLeft: 'ArrowLeft',
    NavigationRight: 'ArrowRight',
    GamepadDPadUp: 'ArrowUp',
    GamepadDPadDown: 'ArrowDown',
    GamepadDPadLeft: 'ArrowLeft',
    GamepadDPadRight: 'ArrowRight',
    GamepadLeftThumbUp: 'ArrowUp',
    GamepadLeftThumbDown: 'ArrowDown',
    GamepadLeftThumbLeft: 'ArrowLeft',
    GamepadLeftThumbRight: 'ArrowRight'
};

const NavigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'BrowserHome', 'Find'];
const MediaKeys = ['MediaRewind', 'MediaStop', 'MediaPlay', 'MediaFastForward', 'MediaTrackPrevious', 'MediaTrackNext', 'MediaPlayPause'];
const InteractiveElements = ['INPUT', 'TEXTAREA'];
const NonInteractiveInputElements = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'reset', 'submit'];

export function getKeyName(event: KeyboardEvent): string {
    const key = KeyNames[event.keyCode] || event.key;
    return KeyAliases[key] || key;
}

export function isNavigationKey(key: string): boolean {
    return NavigationKeys.includes(key);
}

export function isMediaKey(key: string): boolean {
    return MediaKeys.includes(key);
}

export function isInteractiveElement(element: Element | null): boolean {
    if (element && InteractiveElements.includes(element.tagName)) {
        if (element.tagName === 'INPUT') {
            return !NonInteractiveInputElements.includes((element as HTMLInputElement).type);
        }
        return true;
    }
    return false;
}

export function enable(): void {
    const hasMediaSession = 'mediaSession' in navigator;
    window.addEventListener('keydown', (e) => {
        if (e.defaultPrevented) return;
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

        const key = getKeyName(e);
        if (!layoutManager.tv && isNavigationKey(key)) return;
        if (!browser.tv && isMediaKey(key) && hasMediaSession) return;

        let capture = true;
        switch (key) {
            case 'ArrowLeft':
                if (!isInteractiveElement(document.activeElement)) inputManager.handleCommand('left');
                else capture = false;
                break;
            case 'ArrowUp': inputManager.handleCommand('up'); break;
            case 'ArrowRight':
                if (!isInteractiveElement(document.activeElement)) inputManager.handleCommand('right');
                else capture = false;
                break;
            case 'ArrowDown': inputManager.handleCommand('down'); break;
            case 'GamepadA': inputManager.handleCommand('select'); break;
            case 'Back': inputManager.handleCommand('back'); break;
            case 'Backspace':
                if (browser.tv && (browser as any).hisense && (browser as any).vidaa) inputManager.handleCommand('back');
                else capture = false;
                break;
            case 'Escape':
                if (layoutManager.tv) inputManager.handleCommand('back');
                else capture = false;
                break;
            case 'Find': inputManager.handleCommand('search'); break;
            case 'BrowserHome': inputManager.handleCommand('home'); break;
            case 'MediaPlay': inputManager.handleCommand('play'); break;
            case 'Pause': inputManager.handleCommand('pause'); break;
            case 'MediaPlayPause': inputManager.handleCommand('playpause'); break;
            case 'MediaRewind': inputManager.handleCommand('rewind'); break;
            case 'MediaFastForward': inputManager.handleCommand('fastforward'); break;
            case 'MediaStop': inputManager.handleCommand('stop'); break;
            case 'MediaTrackPrevious': inputManager.handleCommand('previoustrack'); break;
            case 'MediaTrackNext': inputManager.handleCommand('nexttrack'); break;
            default: capture = false;
        }

        if (capture) e.preventDefault();
    });
}

function attachGamepadScript() {
    window.removeEventListener('gamepadconnected', attachGamepadScript);
    import('./gamepadtokey');
}

if (typeof navigator !== 'undefined' && navigator.getGamepads && (appSettings as any).enableGamepad() && !browser.edgeUwp) {
    window.addEventListener('gamepadconnected', attachGamepadScript);
}

const keyboardNavigation = { enable, getKeyName, isNavigationKey };
export default keyboardNavigation;
