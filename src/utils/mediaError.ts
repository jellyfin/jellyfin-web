import { MediaError } from 'types/mediaError';

/**
 * Maps a DOMException name to an equivalent {@link MediaError}.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
 */
export function getMediaError(e?: DOMException): MediaError {
    if (e?.name === 'NotSupportedError') return MediaError.MEDIA_NOT_SUPPORTED;
    return MediaError.PLAYER_ERROR;
}
