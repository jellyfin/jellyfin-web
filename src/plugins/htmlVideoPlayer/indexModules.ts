export {
    getSupportedAudioStreams,
    isAudioStreamSupported,
    setAudioStreamIndex
} from './features/trackManagement';

export {
    enableNativeTrackSupport,
    getMediaStreamAudioTracks,
    getMediaStreamTextTracks,
    getMediaStreamVideoTracks,
    getTextTrackUrl,
    isHls,
    requireHlsPlayer
} from './features/trackSupport';
export { getDefaultProfile } from './stream/profileHelper';
export { normalizeTrackEventText, resolveUrl, tryRemoveElement, zoomIn } from './utils/domHelpers';
