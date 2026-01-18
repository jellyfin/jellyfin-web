import browser from '../browser';

let _supportsTextTracks;
export function supportsTextTracks() {
    if (browser.tizen) {
        return true;
    }

    if (_supportsTextTracks == null) {
        _supportsTextTracks = document.createElement('video').textTracks != null;
    }

    return _supportsTextTracks;
}

let _supportsCanvas2D;
export function supportsCanvas2D() {
    if (_supportsCanvas2D == null) {
        _supportsCanvas2D = document.createElement('canvas').getContext('2d') != null;
    }

    return _supportsCanvas2D;
}

let _canPlayHls;
export function canPlayHls() {
    if (_canPlayHls == null) {
        _canPlayHls = canPlayNativeHls() || canPlayHlsWithMSE();
    }

    return _canPlayHls;
}

export function canPlayNativeHls() {
    if (browser.tizen) {
        return true;
    }

    const media = document.createElement('video');
    return !!(media.canPlayType('application/x-mpegURL').replace(/no/, '')
            || media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, ''));
}

export function canPlayNativeHlsInFmp4() {
    if (browser.tizenVersion >= 5 || browser.web0sVersion >= 3.5) {
        return true;
    }

    return (browser.iOS && browser.iOSVersion >= 11) || browser.osx;
}

export function canPlayHlsWithMSE() {
    return window.MediaSource != null;
}

export function supportsAnamorphicVideo() {
    return browser.tizenVersion >= 6;
}
