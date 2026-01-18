import browser from '../browser';
import { supportsAc3, supportsEac3, canPlayAudioFormat } from '../codecSupport/audioCodecs';

export function canPlaySecondaryAudio(videoTestElement) {
    return !!videoTestElement.audioTracks
        && !browser.firefox
        && (browser.tizenVersion >= 5.5 && browser.tizenVersion < 8 || !browser.tizen)
        && (browser.web0sVersion >= 4.0 || !browser.web0sVersion);
}
