import { describe, expect, it } from 'vitest';

import { findAudioTrackIndex } from './audioTrack';

const streams = [
    { Index: 1, Language: 'eng' },
    { Index: 2, Language: 'rum' }
];

describe('findAudioTrackIndex', () => {
    it('Should use the stream position when the tracks are in the same order', () => {
        const tracks = [
            { language: 'eng' },
            { language: 'rum' }
        ];

        expect(findAudioTrackIndex(streams, tracks, 2)).toBe(1);
        expect(findAudioTrackIndex(streams, tracks, 1)).toBe(0);
    });

    it('Should match by language when the element reorders the tracks', () => {
        // webOS hoists the default track to the top of the list
        const tracks = [
            { language: 'rum' },
            { language: 'eng' }
        ];

        expect(findAudioTrackIndex(streams, tracks, 2)).toBe(0);
        expect(findAudioTrackIndex(streams, tracks, 1)).toBe(1);
    });

    it('Should match equivalent language codes', () => {
        const tracks = [
            { language: 'en' },
            { language: 'ro' }
        ];

        expect(findAudioTrackIndex(streams, tracks, 2)).toBe(1);
    });

    it('Should keep tracks with the same language in order', () => {
        const commentaryStreams = [
            { Index: 1, Language: 'eng' },
            { Index: 2, Language: 'eng' }
        ];
        const tracks = [
            { language: 'eng' },
            { language: 'eng' }
        ];

        expect(findAudioTrackIndex(commentaryStreams, tracks, 1)).toBe(0);
        expect(findAudioTrackIndex(commentaryStreams, tracks, 2)).toBe(1);
    });

    it('Should fall back to the position when the language is unknown', () => {
        const unknownStreams = [
            { Index: 1 },
            { Index: 2 }
        ];
        const tracks = [
            { language: 'rum' },
            { language: 'eng' }
        ];

        expect(findAudioTrackIndex(unknownStreams, tracks, 2)).toBe(1);
    });

    it('Should fall back to the position when the element exposes fewer tracks', () => {
        const tracks = [{ language: 'rum' }];

        expect(findAudioTrackIndex(streams, tracks, 2)).toBe(1);
    });

    it('Should return -1 for an unknown stream index', () => {
        const tracks = [
            { language: 'eng' },
            { language: 'rum' }
        ];

        expect(findAudioTrackIndex(streams, tracks, 99)).toBe(-1);
    });
});
