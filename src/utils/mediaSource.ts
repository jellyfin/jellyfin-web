import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';

/**
 * Checks if the media source is an HLS stream.
 * @param mediaSource The media source.
 * @returns _true_ if the media source is an HLS stream, _false_ otherwise.
 */
export function isHls(mediaSource: MediaSourceInfo|null|undefined): boolean {
    const protocol = mediaSource?.TranscodingSubProtocol || mediaSource?.Container;
    return protocol?.toUpperCase() === 'HLS';
}
