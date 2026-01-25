import browser from 'scripts/browser';
import { canPlayHevc } from './videoCodecs';

export interface DirectPlayProfile {
    Container: string;
    Type: string;
    VideoCodec: string;
    AudioCodec: string;
}

export function getDirectPlayProfileForVideoContainer(
    container: string,
    videoAudioCodecs: string[],
    videoTestElement: HTMLMediaElement,
    options: any
): DirectPlayProfile | null {
    let supported = false;
    let profileContainer = container;
    const videoCodecs: string[] = [];

    switch (container) {
        case 'asf':
        case 'wmv':
            supported = (browser as any).tizen || browser.web0s || browser.edgeUwp;
            videoAudioCodecs = [];
            break;
        case 'avi':
            supported = (browser as any).tizen || browser.web0s || browser.edgeUwp;
            if ((browser as any).tizenVersion >= 4) {
                videoCodecs.push('h264');
                if (canPlayHevc(videoTestElement, options)) {
                    videoCodecs.push('hevc');
                }
            }
            break;
        case 'mpg':
        case 'mpeg':
            supported = (browser as any).tizen || browser.web0s || browser.edgeUwp;
            break;
        case 'flv':
            supported = (browser as any).tizen;
            break;
        case '3gp':
        case 'mts':
        case 'trp':
        case 'vob':
        case 'vro':
            supported = (browser as any).tizen;
            break;
        case 'mov':
            supported =
                browser.safari ||
                (browser as any).tizen ||
                browser.web0s ||
                browser.chrome ||
                browser.edgeChromium ||
                browser.edgeUwp;
            videoCodecs.push('h264');
            break;
        case 'm2ts':
            supported = (browser as any).tizen || browser.web0s || browser.edgeUwp;
            videoCodecs.push('h264');
            if (supportsVc1(videoTestElement)) {
                videoCodecs.push('vc1');
            }
            if (supportsMpeg2Video()) {
                videoCodecs.push('mpeg2video');
            }
            break;
        case 'ts':
            supported = testCanPlayTs();
            videoCodecs.push('h264');
            if (((browser as any).tizen || browser.web0s) && canPlayHevc(videoTestElement, options)) {
                videoCodecs.push('hevc');
            }
            if (supportsVc1(videoTestElement)) {
                videoCodecs.push('vc1');
            }
            if (supportsMpeg2Video()) {
                videoCodecs.push('mpeg2video');
            }
            profileContainer = 'ts,mpegts';
            break;
        default:
            break;
    }

    return supported
        ? {
              Container: profileContainer,
              Type: 'Video',
              VideoCodec: videoCodecs.join(','),
              AudioCodec: videoAudioCodecs.join(',')
          }
        : null;
}

export function testCanPlayMkv(videoTestElement: HTMLMediaElement): boolean {
    if ((browser as any).vidaa) {
        return false;
    }

    if ((browser as any).tizen || browser.web0s) {
        return true;
    }

    if (browser.firefox) {
        return false;
    }

    if (
        videoTestElement.canPlayType('video/x-matroska').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mkv').replace(/no/, '')
    ) {
        return true;
    }

    if (browser.edgeChromium && (browser as any).windows) {
        return true;
    }

    return !!browser.edgeUwp;
}

export function testCanPlayTs(): boolean {
    return (browser as any).tizen || browser.web0s || browser.edgeUwp;
}

export function supportsMpeg2Video(): boolean {
    return (browser as any).tizen || browser.web0s || browser.edgeUwp;
}

export function supportsVc1(videoTestElement: HTMLMediaElement): string | boolean {
    return (
        (browser as any).tizen ||
        browser.web0s ||
        browser.edgeUwp ||
        videoTestElement.canPlayType('video/mp4; codecs="vc-1"').replace(/no/, '')
    );
}
