export {
    resolveUrl,
    tryRemoveElement,
    zoomIn,
    normalizeTrackEventText
} from './utils/domHelpers';

export {
    isHls,
    enableNativeTrackSupport,
    requireHlsPlayer,
    getMediaStreamVideoTracks,
    getMediaStreamAudioTracks,
    getMediaStreamTextTracks,
    getTextTrackUrl
} from './features/trackSupport';

export {
    getDefaultProfile
} from './stream/profileHelper';
