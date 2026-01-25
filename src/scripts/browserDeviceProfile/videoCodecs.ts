import browser from 'scripts/browser';

export function canPlayH264(videoTestElement: HTMLMediaElement): boolean {
    return !!(videoTestElement.canPlayType?.('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
}

export function canPlayHevc(videoTestElement: HTMLMediaElement, options: any): boolean {
    if ((browser as any).tizen || browser.xboxOne || browser.web0s || options.supportsHevc) {
        return true;
    }

    if (browser.ps4) {
        return false;
    }

    return !!videoTestElement.canPlayType
        && (videoTestElement.canPlayType('video/mp4; codecs="hvc1.1.L120"').replace(/no/, '')
        || videoTestElement.canPlayType('video/mp4; codecs="hev1.1.L120"').replace(/no/, '')
        || videoTestElement.canPlayType('video/mp4; codecs="hvc1.1.0.L120"').replace(/no/, '')
        || videoTestElement.canPlayType('video/mp4; codecs="hev1.1.0.L120"').replace(/no/, ''));
}

export function canPlayAv1(videoTestElement: HTMLMediaElement): boolean {
    if ((browser as any).tizenVersion >= 5.5 || (browser as any).web0sVersion >= 5) {
        return true;
    }

    return !!videoTestElement.canPlayType
        && (videoTestElement.canPlayType('video/mp4; codecs="av01.0.15M.08"').replace(/no/, '')
        && videoTestElement.canPlayType('video/mp4; codecs="av01.0.15M.10"').replace(/no/, ''));
}