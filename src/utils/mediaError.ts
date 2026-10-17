import { MediaError } from 'types/mediaError';

/**
 * Maps a playback exception or HTML media error to an equivalent {@link MediaError}.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
 */
export function getMediaError(err?: { code?: number; name?: string }): MediaError {
    switch (err?.code) {
        case 2:
            return MediaError.NETWORK_ERROR;
        case 3:
            return MediaError.MEDIA_DECODE_ERROR;
        case 4:
            return MediaError.MEDIA_NOT_SUPPORTED;
    }

    if (err?.name === 'NotSupportedError') return MediaError.MEDIA_NOT_SUPPORTED;
    return MediaError.PLAYER_ERROR;
}
