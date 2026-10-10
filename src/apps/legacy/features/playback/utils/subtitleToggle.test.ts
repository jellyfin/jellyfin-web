import { describe, expect, it } from 'vitest';

import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

import { SUBTITLES_OFF_INDEX, getSubtitleIndexToEnable } from './subtitleToggle';

const tracks = [
    { Index: 2 },
    { Index: 3 },
    { Index: 4 }
] as MediaStream[];

describe('getSubtitleIndexToEnable', () => {
    it('Should return off when there are no tracks', () => {
        expect(getSubtitleIndexToEnable([], 3, 2)).toBe(SUBTITLES_OFF_INDEX);
        expect(getSubtitleIndexToEnable(null, 3, 2)).toBe(SUBTITLES_OFF_INDEX);
        expect(getSubtitleIndexToEnable(undefined, 3, 2)).toBe(SUBTITLES_OFF_INDEX);
    });

    it('Should prefer the last used track over the default', () => {
        expect(getSubtitleIndexToEnable(tracks, 4, 2)).toBe(4);
    });

    it('Should fall back to the default when there is no last used track', () => {
        expect(getSubtitleIndexToEnable(tracks, null, 3)).toBe(3);
        expect(getSubtitleIndexToEnable(tracks, undefined, 3)).toBe(3);
        expect(getSubtitleIndexToEnable(tracks, SUBTITLES_OFF_INDEX, 3)).toBe(3);
    });

    it('Should ignore a last used track from another media source', () => {
        expect(getSubtitleIndexToEnable(tracks, 99, 3)).toBe(3);
    });

    it('Should ignore a default index that is not an available track', () => {
        expect(getSubtitleIndexToEnable(tracks, null, 99)).toBe(2);
    });

    it('Should fall back to the first track when nothing else applies', () => {
        expect(getSubtitleIndexToEnable(tracks)).toBe(2);
        expect(getSubtitleIndexToEnable(tracks, SUBTITLES_OFF_INDEX, SUBTITLES_OFF_INDEX)).toBe(2);
    });
});
