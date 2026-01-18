import browser from '../browser';
import * as userSettings from '../settings/userSettings';

function getMaxBitrate() {
    return 120000000;
}

function getGlobalMaxVideoBitrate() {
    let isTizenFhd = false;
    if (browser.tizen) {
        try {
            const isTizenUhd = webapis.productinfo.isUdPanelSupported();
            isTizenFhd = !isTizenUhd;
            console.debug('isTizenFhd = ' + isTizenFhd);
        } catch (error) {
            console.error('isUdPanelSupported() error code = ' + error.code);
        }
    }

    let bitrate = null;
    if (browser.ps4) {
        bitrate = 8000000;
    } else if (browser.xboxOne) {
        bitrate = 12000000;
    } else if (browser.tizen && isTizenFhd) {
        bitrate = 20000000;
    }

    return bitrate;
}

let maxChannelCount = null;

function getSpeakerCount() {
    if (maxChannelCount != null) {
        return maxChannelCount;
    }

    maxChannelCount = -1;

    const AudioContext = window.AudioContext || window.webkitAudioContext || false;

    if (AudioContext) {
        const audioCtx = new AudioContext();

        maxChannelCount = audioCtx.destination.maxChannelCount;
    }

    return maxChannelCount;
}

function getPhysicalAudioChannels(options, videoTestElement) {
    const allowedAudioChannels = parseInt(userSettings.allowedAudioChannels(), 10);

    if (allowedAudioChannels > 0) {
        return allowedAudioChannels;
    }

    if (options.audioChannels) {
        return options.audioChannels;
    }

    const isSurroundSoundSupportedBrowser = browser.safari || browser.chrome || browser.edgeChromium || browser.firefox || browser.tv || browser.ps4 || browser.xboxOne;
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

export { getMaxBitrate, getGlobalMaxVideoBitrate, getSpeakerCount, getPhysicalAudioChannels };
