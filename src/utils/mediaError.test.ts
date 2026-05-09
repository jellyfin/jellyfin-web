import { describe, expect, it } from 'vitest';

import { MediaError } from 'types/mediaError';
import { getMediaError } from './mediaError';

describe('getMediaError', () => {
    it('returns MEDIA_NOT_SUPPORTED for a NotSupportedError DOMException', () => {
        const e = new DOMException('codec not supported', 'NotSupportedError');
        expect(getMediaError(e)).toBe(MediaError.MEDIA_NOT_SUPPORTED);
    });

    it('returns PLAYER_ERROR for any other DOMException', () => {
        const e = new DOMException('aborted', 'AbortError');
        expect(getMediaError(e)).toBe(MediaError.PLAYER_ERROR);
    });

    it('returns PLAYER_ERROR when no error is passed', () => {
        expect(getMediaError()).toBe(MediaError.PLAYER_ERROR);
    });
});
