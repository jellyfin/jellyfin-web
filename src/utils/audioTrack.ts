import { isSameLanguage } from './language';

/** The subset of a Jellyfin media stream needed to pick an audio track. */
export interface AudioStreamLike {
    Index: number
    Language?: string | null
}

/** The subset of HTMLMediaElement.audioTracks entries we rely on. */
export interface AudioTrackLike {
    language?: string
    enabled?: boolean
}

/**
 * Returns the index of the element track that matches the requested media
 * stream.
 *
 * {@link HTMLMediaElement.audioTracks} is not guaranteed to be in the same
 * order as `MediaStreams`; webOS for example hoists the default track to the
 * top of the list. Match on the language therefore and only use the position
 * as a fallback, keeping duplicate languages (e.g. commentaries) in order.
 *
 * @param streams Audio streams of the media source, in media source order.
 * @param tracks Audio tracks exposed by the media element.
 * @param streamIndex Index of the media stream to select.
 * @returns Index into `tracks`, or -1 when the stream does not exist.
 */
export function findAudioTrackIndex(
    streams: readonly AudioStreamLike[],
    tracks: ArrayLike<AudioTrackLike>,
    streamIndex: number
): number {
    const position = streams.findIndex((stream) => stream.Index === streamIndex);

    if (position === -1) {
        return -1;
    }

    const target = streams[position];
    const tracksArray = Array.from(tracks);

    if (target.Language) {
        // Only try to match by language when the element exposes every track,
        // otherwise the occurrence of a language cannot be mapped reliably.
        const sameLanguageStreams = streams.filter((stream) => isSameLanguage(stream.Language, target.Language));
        const occurrence = sameLanguageStreams.findIndex((stream) => stream.Index === target.Index);

        const matchingTracks = tracksArray
            .map((track, index) => ({ track, index }))
            .filter(({ track }) => isSameLanguage(track.language, target.Language));

        if (matchingTracks.length > 0 && tracksArray.length === streams.length) {
            return (matchingTracks[occurrence] ?? matchingTracks[0]).index;
        }
    }

    // No usable language information: assume the element kept the stream order.
    return position;
}
