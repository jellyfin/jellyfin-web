import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

export const SUBTITLES_OFF_INDEX = -1;

/**
 * Picks the subtitle track to enable when subtitles are toggled back on.
 *
 * Preference order: the track that was last switched off, the media source default,
 * then the first available track. A remembered index can belong to a previously
 * played media source, so it is only used when the current tracks still contain it.
 * @param tracks The subtitle tracks of the current media source
 * @param lastIndex The stream index subtitles were last turned off from, if any
 * @param defaultIndex The media source's default subtitle stream index, if any
 * @returns The stream index to enable, or SUBTITLES_OFF_INDEX when there is nothing to enable
 */
export function getSubtitleIndexToEnable(
    tracks: MediaStream[] | null | undefined,
    lastIndex?: number | null,
    defaultIndex?: number | null
) {
    if (!tracks?.length) {
        return SUBTITLES_OFF_INDEX;
    }

    const isAvailable = (index?: number | null) => (
        index != null
        && index !== SUBTITLES_OFF_INDEX
        && tracks.some(track => track.Index === index)
    );

    if (isAvailable(lastIndex)) return lastIndex as number;
    if (isAvailable(defaultIndex)) return defaultIndex as number;

    return tracks[0].Index ?? SUBTITLES_OFF_INDEX;
}
