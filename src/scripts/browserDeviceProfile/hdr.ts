import browser from 'scripts/browser';

export interface HdrOptions {
    supportsHdr10?: boolean;
    supportsHlg?: boolean;
    supportsDolbyVision?: boolean;
    [key: string]: any;
}

export function supportsHdr10(options: HdrOptions): boolean {
    return (
        options.supportsHdr10 ??
        (false ||
            (browser as any).vidaa ||
            (browser as any).tizen ||
            browser.web0s ||
            (browser.safari && ((browser.iOS && (browser as any).iOSVersion >= 11) || (browser as any).osx)) ||
            (browser.edgeChromium && (browser as any).versionMajor >= 121) ||
            (browser.chrome && !browser.mobile) ||
            (browser.firefox && (browser as any).osx && !browser.iOS && (browser as any).versionMajor >= 100))
    );
}

export function supportsHlg(options: HdrOptions): boolean {
    return options.supportsHlg ?? supportsHdr10(options);
}

export function supportsDolbyVision(options: HdrOptions): boolean {
    return (
        options.supportsDolbyVision ??
        (false || (browser.safari && ((browser.iOS && (browser as any).iOSVersion >= 13) || (browser as any).osx)))
    );
}

export function supportedDolbyVisionProfilesHevc(videoTestElement: HTMLMediaElement): number[] {
    if (browser.xboxOne) return [5, 8];

    const supportedProfiles: number[] = [];
    if (videoTestElement.canPlayType) {
        if (videoTestElement.canPlayType('video/mp4; codecs="dvh1.05.06"').replace(/no/, '')) {
            supportedProfiles.push(5);
        }
        if (
            videoTestElement.canPlayType('video/mp4; codecs="dvh1.08.06"').replace(/no/, '') ||
            (browser as any).web0sVersion >= 4
        ) {
            supportedProfiles.push(8);
        }
    }
    return supportedProfiles;
}

export function supportedDolbyVisionProfileAv1(videoTestElement: HTMLMediaElement): string | boolean {
    return videoTestElement.canPlayType?.('video/mp4; codecs="dav1.10.06"').replace(/no/, '');
}
