import browser from '../../browser';

declare global {
    interface Window {
        MediaSource: any;
    }
}

let _supportsTextTracks: boolean | undefined;
export function supportsTextTracks(): boolean {
    if ((browser as any).tizen) {
        return true;
    }

    if (_supportsTextTracks == null) {
        _supportsTextTracks = document.createElement('video').textTracks != null;
    }

    return _supportsTextTracks;
}

let _supportsCanvas2D: boolean | undefined;
export function supportsCanvas2D(): boolean {
    if (_supportsCanvas2D == null) {
        _supportsCanvas2D = document.createElement('canvas').getContext('2d') != null;
    }

    return _supportsCanvas2D;
}

let _canPlayHls: boolean | undefined;
export function canPlayHls(): boolean {
    if (_canPlayHls == null) {
        _canPlayHls = canPlayNativeHls() || canPlayHlsWithMSE();
    }

    return _canPlayHls;
}

export function canPlayNativeHls(): boolean {
    if ((browser as any).tizen) {
        return true;
    }

    const media = document.createElement('video');
    return !!(media.canPlayType('application/x-mpegURL').replace(/no/, '')
            || media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, ''));
}

export function canPlayNativeHlsInFmp4(): boolean {
    if ((browser as any).tizenVersion >= 5 || (browser as any).web0sVersion >= 3.5) {
        return true;
    }

    return (browser.iOS && (browser as any).iOSVersion >= 11) || (browser as any).osx;
}

export function canPlayHlsWithMSE(): boolean {
    return window.MediaSource != null;
}

export function supportsAnamorphicVideo(): boolean {
    return (browser as any).tizenVersion >= 6;
}