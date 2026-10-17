import type { MediaStream } from '@jellyfin/sdk/lib/generated-client';

function toLanguage(code: string | null | undefined): string | undefined {
    try {
        return code ? new Intl.Locale(code).language : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Finds the position in the player's audio track list of the stream with the given index.
 * @param tracks The audio tracks reported by the player.
 * @param streams The audio streams of the media source, in Jellyfin's order.
 * @param index The index of the stream to find.
 * @returns The position of the matching track, or -1 if the index is not among the streams.
 * @remarks Some players (e.g. webOS) list the default track first, so a track is matched by its language when that
 * language is unique, and by its position in the stream list otherwise.
 */
export function findAudioTrackPosition(
    tracks: ArrayLike<{ language: string }>,
    streams: MediaStream[],
    index: number
): number {
    const position = streams.findIndex(stream => stream.Index === index);
    if (position === -1) {
        return -1;
    }

    const streamLanguages = streams.map(stream => toLanguage(stream.Language));
    const language = streamLanguages[position];
    if (!language || streamLanguages.indexOf(language) !== streamLanguages.lastIndexOf(language)) {
        return position;
    }

    const trackLanguages = Array.from(tracks, track => toLanguage(track.language));
    const match = trackLanguages.indexOf(language);

    return match !== -1 && match === trackLanguages.lastIndexOf(language) ? match : position;
}
