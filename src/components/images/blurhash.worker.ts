import { decode } from 'blurhash';
import { expose } from 'comlink';

/**
 * Decodes blurhash outside the main thread, in a web worker
 *
 * @param {string} hash - Hash to decode.
 * @param {number} width - Width of the decoded pixel array
 * @param {number} height - Height of the decoded pixel array.
 * @param {number} punch - Contrast of the decoded pixels
 * @returns {Uint8ClampedArray} - Returns the decoded pixels in the proxied response by Comlink
 */
function getPixels({
    hash,
    width,
    height
}): Uint8ClampedArray {
    try {
        return decode(hash, width, height);
    } catch {
        throw new TypeError(`Blurhash ${hash} is not valid`);
    }
}

expose(getPixels);
