import { describe, expect, it } from 'vitest';

import { getAudiobookCumulativeOffsetTicks, getAudiobookPartForGlobalTicks } from './audiobookTimeline';

const sources = [
    { Id: 'a', RunTimeTicks: 1000 },
    { Id: 'b', RunTimeTicks: 2000 },
    { Id: 'c', RunTimeTicks: 3000 }
];

describe('getAudiobookCumulativeOffsetTicks', () => {
    it('returns 0 for the first part', () => {
        expect(getAudiobookCumulativeOffsetTicks(sources, 0)).toBe(0);
    });

    it('sums the runtimes of the preceding parts', () => {
        expect(getAudiobookCumulativeOffsetTicks(sources, 1)).toBe(1000);
        expect(getAudiobookCumulativeOffsetTicks(sources, 2)).toBe(3000);
    });

    it('treats a missing RunTimeTicks as zero', () => {
        const withGap = [{ Id: 'a' }, { Id: 'b', RunTimeTicks: 2000 }];
        expect(getAudiobookCumulativeOffsetTicks(withGap, 1)).toBe(0);
    });
});

describe('getAudiobookPartForGlobalTicks', () => {
    it('returns null when there are fewer than two parts', () => {
        expect(getAudiobookPartForGlobalTicks(null, 0)).toBeNull();
        expect(getAudiobookPartForGlobalTicks([], 0)).toBeNull();
        expect(getAudiobookPartForGlobalTicks([{ Id: 'a', RunTimeTicks: 1000 }], 500)).toBeNull();
    });

    it('maps tick 0 to the start of the first part', () => {
        expect(getAudiobookPartForGlobalTicks(sources, 0)).toEqual({ index: 0, source: sources[0], localTicks: 0 });
    });

    it('maps a tick inside the first part', () => {
        expect(getAudiobookPartForGlobalTicks(sources, 500)).toEqual({ index: 0, source: sources[0], localTicks: 500 });
    });

    it('maps a tick inside a later part to a local offset', () => {
        expect(getAudiobookPartForGlobalTicks(sources, 3500)).toEqual({ index: 2, source: sources[2], localTicks: 500 });
    });

    it('treats a part boundary as the start of the next part', () => {
        expect(getAudiobookPartForGlobalTicks(sources, 1000)).toEqual({ index: 1, source: sources[1], localTicks: 0 });
    });

    it('clamps a tick past the end to the last part', () => {
        expect(getAudiobookPartForGlobalTicks(sources, 10000)).toEqual({ index: 2, source: sources[2], localTicks: 7000 });
    });
});
