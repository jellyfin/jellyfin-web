import browser from '../browser';

export function supportsHdr10(options) {
    return options.supportsHdr10 ?? (false
            || browser.vidaa
            || browser.tizen
            || browser.web0s
            || browser.safari && ((browser.iOS && browser.iOSVersion >= 11) || browser.osx)
            || browser.edgeChromium && (browser.versionMajor >= 121)
            || browser.chrome && !browser.mobile
            || browser.firefox && browser.osx && (!browser.iphone && !browser.ipod && !browser.ipad) && (browser.versionMajor >= 100)
    );
}

export function supportsHlg(options) {
    return options.supportsHlg ?? supportsHdr10(options);
}

export function supportsDolbyVision(options) {
    return options.supportsDolbyVision ?? (false
            || browser.safari && ((browser.iOS && browser.iOSVersion >= 13) || browser.osx)
    );
}

export function supportedDolbyVisionProfilesHevc(videoTestElement) {
    if (browser.xboxOne) return [5, 8];

    const supportedProfiles = [];
    if (videoTestElement.canPlayType) {
        if (videoTestElement
            .canPlayType('video/mp4; codecs="dvh1.05.06"')
            .replace(/no/, '')) {
            supportedProfiles.push(5);
        }
        if (
            videoTestElement
                .canPlayType('video/mp4; codecs="dvh1.08.06"')
                .replace(/no/, '')
            || (browser.web0sVersion >= 4)
        ) {
            supportedProfiles.push(8);
        }
    }
    return supportedProfiles;
}

export function supportedDolbyVisionProfileAv1(videoTestElement) {
    return videoTestElement.canPlayType?.('video/mp4; codecs="dav1.10.06"').replace(/no/, '');
}
