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
    isAudioStreamSupported,
    getSupportedAudioStreams,
    setAudioStreamIndex
} from './features/trackManagement';

export {
    getDefaultProfile
} from './stream/profileHelper';

export {
    setSubtitleStreamIndex,
    setSecondarySubtitleStreamIndex,
    resetSubtitleOffset,
    enableShowingSubtitleOffset,
    disableShowingSubtitleOffset,
    isShowingSubtitleOffsetEnabled,
    getTextTracks
} from './features/trackManagement';
