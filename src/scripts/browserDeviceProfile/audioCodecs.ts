import browser from 'scripts/browser';

export function supportsAc3(videoTestElement: HTMLMediaElement): string | boolean {
    if (browser.edgeUwp || (browser as any).tizen || browser.web0s) {
        return true;
    }

    if (browser.iOS && (browser as any).iOSVersion < 11) {
        return false;
    }

    return videoTestElement.canPlayType('audio/mp4; codecs="ac-3"').replace(/no/, '');
}

export function canPlayDts(videoTestElement: HTMLMediaElement): boolean | null {
    if (
        (browser as any).tizenVersion >= 4 ||
        ((browser as any).web0sVersion >= 5 && (browser as any).web0sVersion < 23)
    ) {
        return false;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="dts-"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="dts+"').replace(/no/, '')
    ) {
        return true;
    }

    return null;
}

export function supportsEac3(videoTestElement: HTMLMediaElement): string | boolean {
    if ((browser as any).tizen || browser.web0s) {
        return true;
    }

    if (browser.iOS && (browser as any).iOSVersion < 11) {
        return false;
    }

    return videoTestElement.canPlayType('audio/mp4; codecs="ec-3"').replace(/no/, '');
}

export function supportsAc3InHls(videoTestElement: HTMLMediaElement): string | boolean {
    if ((browser as any).tizen || browser.web0s) {
        return true;
    }

    if (videoTestElement.canPlayType) {
        return (
            videoTestElement.canPlayType('application/x-mpegurl; codecs="avc1.42E01E, ac-3"').replace(/no/, '') ||
            videoTestElement.canPlayType('application/vnd.apple.mpegURL; codecs="avc1.42E01E, ac-3"').replace(/no/, '')
        );
    }

    return false;
}

export function supportsMp3InHls(videoTestElement: HTMLMediaElement): string | boolean {
    if (videoTestElement.canPlayType) {
        return (
            videoTestElement.canPlayType('application/x-mpegurl; codecs="avc1.64001E, mp4a.40.34"').replace(/no/, '') ||
            videoTestElement
                .canPlayType('application/vnd.apple.mpegURL; codecs="avc1.64001E, mp4a.40.34"')
                .replace(/no/, '')
        );
    }

    return false;
}

export function canPlayAudioFormat(format: string): boolean {
    let typeString: string | undefined;

    if (format === 'flac' || format === 'asf') {
        if ((browser as any).tizen || browser.web0s || browser.edgeUwp) {
            return true;
        }
        typeString = 'audio/flac';
    } else if (format === 'wma') {
        if ((browser as any).tizen || browser.edgeUwp) {
            return true;
        }
    } else if (format === 'opus') {
        if (browser.web0s) {
            return (browser as any).web0sVersion >= 3.5;
        }

        typeString = 'audio/ogg; codecs="opus"';
    } else if (format === 'alac') {
        if (browser.iOS || ((browser as any).osx && browser.safari)) {
            return true;
        }
    } else if (format === 'mp2') {
        return false;
    }

    if (format === 'webma') {
        typeString = 'audio/webm';
    } else if (format === 'mp2') {
        typeString = 'audio/mpeg';
    } else if (!typeString) {
        typeString = 'audio/' + format;
    }

    return !!document.createElement('audio').canPlayType(typeString).replace(/no/, '');
}
