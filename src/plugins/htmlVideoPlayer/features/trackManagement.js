import { includesAny } from '../../../utils/container';

export function isAudioStreamSupported(stream, deviceProfile, container) {
    const codec = (stream.Codec || '').toLowerCase();

    if (!codec) {
        return true;
    }

    if (!deviceProfile) {
        return true;
    }

    const profiles = deviceProfile.DirectPlayProfiles || [];

    return profiles.some((p) => {
        return p.Type === 'Video'
                    && includesAny((p.Container || '').toLowerCase(), container)
                    && includesAny((p.AudioCodec || '').toLowerCase(), codec);
    });
}

export function getSupportedAudioStreams(mediaSource, mediaElement, lastProfile) {
    const profile = lastProfile;

    const container = mediaSource.Container.toLowerCase();

    return mediaSource.MediaStreams.filter((stream) => {
        return stream.Type === 'Audio'
            && isAudioStreamSupported(stream, profile, container);
    });
}

export function setAudioStreamIndex(index, mediaElement, mediaSource) {
    const streams = getSupportedAudioStreams(mediaSource, mediaElement, null);

    if (streams.length < 2) {
        return;
    }

    let audioIndex = -1;

    for (const stream of streams) {
        audioIndex++;

        if (stream.Index === index) {
            break;
        }
    }

    if (audioIndex === -1) {
        return;
    }

    const elem = mediaElement;
    if (!elem) {
        return;
    }

    const elemAudioTracks = elem.audioTracks || [];

    for (const [i, audioTrack] of Array.from(elemAudioTracks).entries()) {
        if (audioIndex === i) {
            audioTrack.enabled = true;
        } else {
            audioTrack.enabled = false;
        }
    }
}

export function setSubtitleStreamIndex(index, mediaElement) {
    setCurrentTrackElement(index, mediaElement, PRIMARY_TEXT_TRACK_INDEX);
}

export function setSecondarySubtitleStreamIndex(index, mediaElement) {
    setCurrentTrackElement(index, mediaElement, SECONDARY_TEXT_TRACK_INDEX);
}
