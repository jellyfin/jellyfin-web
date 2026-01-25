import { includesAny } from '../../../utils/container';
import { getMediaStreamAudioTracks } from './trackSupport';

export function isAudioStreamSupported(stream: any, deviceProfile: any, container: string): boolean {
    const codec = (stream.Codec || '').toLowerCase();
    if (!codec) return true;
    if (!deviceProfile) return true;

    const profiles = deviceProfile.DirectPlayProfiles || [];
    return profiles.some((p: any) => {
        return (
            p.Type === 'Video' &&
            includesAny((p.Container || '').toLowerCase(), container) &&
            includesAny((p.AudioCodec || '').toLowerCase(), codec)
        );
    });
}

export function getSupportedAudioStreams(mediaSource: any, _mediaElement: any, lastProfile: any): any[] {
    const profile = lastProfile;
    const container = (mediaSource.Container || '').toLowerCase();

    return getMediaStreamAudioTracks(mediaSource).filter((stream: any) => {
        return stream.Type === 'Audio' && isAudioStreamSupported(stream, profile, container);
    });
}

export function setAudioStreamIndex(index: number, mediaElement: any, mediaSource: any): void {
    const streams = getSupportedAudioStreams(mediaSource, mediaElement, null);
    if (streams.length < 2) return;

    let audioIndex = -1;
    for (const stream of streams) {
        audioIndex++;
        if (stream.Index === index) break;
    }

    if (audioIndex === -1 || !mediaElement) return;

    const elemAudioTracks = mediaElement.audioTracks || [];
    for (const [i, audioTrack] of Array.from(elemAudioTracks as any[]).entries()) {
        (audioTrack as any).enabled = audioIndex === i;
    }
}
