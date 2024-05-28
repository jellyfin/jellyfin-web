import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';

/**
 * Checks if the media source is an HLS stream.
 * @param mediaSource The media source.
 * @returns _true_ if the media source is an HLS stream, _false_ otherwise.
 */
export function isHls(mediaSource: MediaSourceInfo|null|undefined): boolean {
    if (mediaSource?.TranscodingSubProtocol?.toUpperCase() === 'HLS') {
        return true;
    }

    return mediaSource?.Container?.toUpperCase() === 'HLS';
}
