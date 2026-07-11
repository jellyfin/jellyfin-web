import { describe, expect, it } from 'vitest';

import {
    getPlaybackRetryStartTicks,
    PlaybackTimeCache
} from './playbackPosition';

describe('PlaybackTimeCache', () => {
    it('starts without a cached time', () => {
        const cache = new PlaybackTimeCache();

        expect(cache.get()).toBeNull();
    });

    it('does not cache an initial observed zero', () => {
        const cache = new PlaybackTimeCache();

        cache.update(0);

        expect(cache.get()).toBeNull();
    });

    it('preserves the last playback time across a transient zero', () => {
        const cache = new PlaybackTimeCache();
        cache.update(600);

        cache.update(0);

        expect(cache.get()).toBe(600);
    });

    it('updates as playback advances', () => {
        const cache = new PlaybackTimeCache();
        cache.update(600);

        cache.update(720);

        expect(cache.get()).toBe(720);
    });

    it('accepts an explicit seek to zero', () => {
        const cache = new PlaybackTimeCache();
        cache.update(600);

        cache.set(0);

        expect(cache.get()).toBe(0);
    });

    it('clears the previous playback time on reset', () => {
        const cache = new PlaybackTimeCache();
        cache.update(600);

        cache.reset();

        expect(cache.get()).toBeNull();
    });
});

describe('getPlaybackRetryStartTicks', () => {
    it('uses the requested start position before playback starts', () => {
        expect(getPlaybackRetryStartTicks(0, 300, false)).toBe(300);
    });

    it('uses the current position after playback starts', () => {
        expect(getPlaybackRetryStartTicks(900, 300, true)).toBe(900);
    });

    it('preserves an intentional seek to zero after playback starts', () => {
        expect(getPlaybackRetryStartTicks(0, 300, true)).toBe(0);
    });

    it('falls back to the requested start position for an invalid current position', () => {
        expect(getPlaybackRetryStartTicks(Number.NaN, 300, true)).toBe(300);
    });
});
