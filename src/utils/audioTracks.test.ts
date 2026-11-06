import { describe, expect, it } from 'vitest';

import { findAudioTrackPosition } from './audioTracks';

const streams = [
    { Index: 1, Language: 'fra' },
    { Index: 2, Language: 'hrv' }
];

describe('findAudioTrackPosition', () => {
    it('matches by language when the player lists the default track first', () => {
        const tracks = [{ language: 'hr' }, { language: 'fr' }];

        expect(findAudioTrackPosition(tracks, streams, 1)).toBe(1);
        expect(findAudioTrackPosition(tracks, streams, 2)).toBe(0);
    });

    it('keeps the position when the player lists the tracks in stream order', () => {
        const tracks = [{ language: 'fr' }, { language: 'hr' }];

        expect(findAudioTrackPosition(tracks, streams, 1)).toBe(0);
        expect(findAudioTrackPosition(tracks, streams, 2)).toBe(1);
    });

    it('matches ISO 639-2/B codes against 639-2/T codes', () => {
        const tracks = [{ language: 'fre' }, { language: 'hrv' }];

        expect(findAudioTrackPosition(tracks, streams, 1)).toBe(0);
    });

    it('falls back to the position when the languages do not tell the tracks apart', () => {
        const english = [
            { Index: 1, Language: 'eng' },
            { Index: 2, Language: 'eng' }
        ];

        expect(findAudioTrackPosition([{ language: 'en' }, { language: 'en' }], english, 2)).toBe(1);
        expect(findAudioTrackPosition([{ language: '' }, { language: '' }], streams, 2)).toBe(1);
    });

    it('returns -1 for an index that is not among the streams', () => {
        expect(findAudioTrackPosition([{ language: 'fr' }], streams, 5)).toBe(-1);
    });
});
