import browser from 'scripts/browser';
import * as userSettings from 'scripts/settings/userSettings';
import { logger } from 'utils/logger';

declare const webapis: any;

export function getMaxBitrate(): number {
    return 120000000;
}

export function getGlobalMaxVideoBitrate(): number | null {
    let isTizenFhd = false;
    if ((browser as any).tizen) {
        try {
            const isTizenUhd = webapis.productinfo.isUdPanelSupported();
            isTizenFhd = !isTizenUhd;
            logger.debug(`isTizenFhd = ${isTizenFhd}`, { component: 'BitrateProfile' });
        } catch (error: any) {
            logger.error(`isUdPanelSupported() error code = ${error.code}`, { component: 'BitrateProfile' }, error);
        }
    }

    let bitrate: number | null = null;
    if (browser.ps4) {
        bitrate = 8000000;
    } else if (browser.xboxOne) {
        bitrate = 12000000;
    } else if ((browser as any).tizen && isTizenFhd) {
        bitrate = 20000000;
    }

    return bitrate;
}

let maxChannelCount: number | null = null;

export function getSpeakerCount(): number {
    if (maxChannelCount != null) {
        return maxChannelCount;
    }

    maxChannelCount = -1;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        maxChannelCount = audioCtx.destination.maxChannelCount;
    }

    return maxChannelCount;
}

export function getPhysicalAudioChannels(options: any, _videoTestElement: HTMLMediaElement): number {
    const allowedAudioChannels = parseInt((userSettings as any).allowedAudioChannels(), 10);

    if (allowedAudioChannels > 0) {
        return allowedAudioChannels;
    }

    if (options.audioChannels) {
        return options.audioChannels;
    }

    const isSurroundSoundSupportedBrowser =
        browser.safari ||
        browser.chrome ||
        browser.edgeChromium ||
        browser.firefox ||
        browser.tv ||
        browser.ps4 ||
        browser.xboxOne;
    const speakerCount = getSpeakerCount();

    if (speakerCount > 2) {
        if (isSurroundSoundSupportedBrowser) {
            return speakerCount;
        }

        return 2;
    }

    if (speakerCount > 0) {
        return speakerCount;
    }

    if (isSurroundSoundSupportedBrowser) {
        return 6;
    }

    return 2;
}
