import { describe, expect, it, vi } from 'vitest';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

// datetime pulls in globalize/locale; stub it to echo the tick count so the
// display helpers can be asserted deterministically.
vi.mock('scripts/datetime', () => ({
    default: { getDisplayRunningTime: vi.fn((ticks: number) => String(ticks)) }
}));

import datetime from 'scripts/datetime';
import {
    getChapterDurationTicks,
    getChapterProgress,
    getChapterState,
    getChapterTimeDisplay
} from './chapterHelpers';

// Shared 3-chapter fixture: starts at 0, 100, 250; item runtime 400.
// Chapter durations are therefore 100, 150, and 150 (400 - 250).
const CHAPTERS: ChapterInfo[] = [
    { StartPositionTicks: 0 },
    { StartPositionTicks: 100 },
    { StartPositionTicks: 250 }
];
const RUNTIME = 400;

describe('chapterHelpers: getChapterProgress', () => {
    it('returns null for a null or non-positive position', () => {
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, null, RUNTIME)).toBeNull();
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, 0, RUNTIME)).toBeNull();
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, -5, RUNTIME)).toBeNull();
    });

    it('returns null when the position is before the chapter start', () => {
        expect(getChapterProgress(CHAPTERS[1], 1, CHAPTERS, 50, RUNTIME)).toBeNull();
    });

    it('returns the fraction through the chapter mid-chapter', () => {
        // pos 50 within chapter 0 [0,100) -> 0.5
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, 50, RUNTIME)).toBe(0.5);
        // pos 175 within chapter 1 [100,250) -> 75/150 = 0.5
        expect(getChapterProgress(CHAPTERS[1], 1, CHAPTERS, 175, RUNTIME)).toBe(0.5);
    });

    it('returns 1 at or past the chapter end', () => {
        // At the next chapter's start.
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, 100, RUNTIME)).toBe(1);
        expect(getChapterProgress(CHAPTERS[0], 0, CHAPTERS, 150, RUNTIME)).toBe(1);
    });

    it('uses the item runtime as the end of the last chapter', () => {
        // Last chapter [250,400): pos 325 -> 75/150 = 0.5
        expect(getChapterProgress(CHAPTERS[2], 2, CHAPTERS, 325, RUNTIME)).toBe(0.5);
        // At/past runtime -> 1
        expect(getChapterProgress(CHAPTERS[2], 2, CHAPTERS, 400, RUNTIME)).toBe(1);
    });

    it('returns 0 for the last chapter when the runtime is unknown', () => {
        // runtime falsy -> end boundary unknown -> 0
        expect(getChapterProgress(CHAPTERS[2], 2, CHAPTERS, 325, 0)).toBe(0);
    });

    it('returns 0 when the next chapter has no start (unknown boundary)', () => {
        const chapters: ChapterInfo[] = [{ StartPositionTicks: 0 }, {}];
        expect(getChapterProgress(chapters[0], 0, chapters, 50, RUNTIME)).toBe(0);
    });

    it('treats a zero-length chapter (adjacent equal starts) as fully played', () => {
        // With chapterEnd === chapterStart, any position >= start also satisfies
        // position >= chapterEnd, so it resolves to 1 before the duration guard.
        const chapters: ChapterInfo[] = [
            { StartPositionTicks: 100 },
            { StartPositionTicks: 100 },
            { StartPositionTicks: 250 }
        ];
        expect(getChapterProgress(chapters[0], 0, chapters, 100, RUNTIME)).toBe(1);
    });

    it('treats a missing StartPositionTicks as 0', () => {
        const chapters: ChapterInfo[] = [{}, { StartPositionTicks: 100 }];
        expect(getChapterProgress(chapters[0], 0, chapters, 50, RUNTIME)).toBe(0.5);
    });
});

describe('chapterHelpers: getChapterState', () => {
    it('is unplayed when progress is null', () => {
        expect(getChapterState(CHAPTERS[0], 0, CHAPTERS, null, RUNTIME)).toBe('unplayed');
    });

    it('is played when progress is at least 1', () => {
        expect(getChapterState(CHAPTERS[0], 0, CHAPTERS, 100, RUNTIME)).toBe('played');
    });

    it('is playing for progress strictly between 0 and 1', () => {
        expect(getChapterState(CHAPTERS[0], 0, CHAPTERS, 50, RUNTIME)).toBe('playing');
    });

    it('is playing when progress is exactly 0 (unknown end boundary)', () => {
        // Last chapter, unknown runtime -> progress 0 -> still playing, not unplayed.
        expect(getChapterState(CHAPTERS[2], 2, CHAPTERS, 325, 0)).toBe('playing');
    });
});

describe('chapterHelpers: getChapterDurationTicks', () => {
    it('spans the gap to the next chapter', () => {
        expect(getChapterDurationTicks(CHAPTERS[0], 0, CHAPTERS, RUNTIME)).toBe(100);
        expect(getChapterDurationTicks(CHAPTERS[1], 1, CHAPTERS, RUNTIME)).toBe(150);
    });

    it('runs the last chapter to the item runtime', () => {
        expect(getChapterDurationTicks(CHAPTERS[2], 2, CHAPTERS, RUNTIME)).toBe(150);
    });

    it('clamps to 0 when the runtime is behind the last chapter start', () => {
        expect(getChapterDurationTicks(CHAPTERS[2], 2, CHAPTERS, 100)).toBe(0);
    });

    it('clamps to 0 when the next chapter starts before this one', () => {
        const chapters: ChapterInfo[] = [{ StartPositionTicks: 200 }, { StartPositionTicks: 100 }];
        expect(getChapterDurationTicks(chapters[0], 0, chapters, RUNTIME)).toBe(0);
    });

    it('treats a missing runtime on the last chapter as 0 length', () => {
        expect(getChapterDurationTicks(CHAPTERS[2], 2, CHAPTERS, 0)).toBe(0);
    });

    it('treats a next chapter with no start as end 0 (clamped to 0)', () => {
        const chapters: ChapterInfo[] = [{ StartPositionTicks: 50 }, {}];
        expect(getChapterDurationTicks(chapters[0], 0, chapters, RUNTIME)).toBe(0);
    });

    it('treats a missing StartPositionTicks as 0 when measuring duration', () => {
        const chapters: ChapterInfo[] = [{}, { StartPositionTicks: 120 }];
        expect(getChapterDurationTicks(chapters[0], 0, chapters, RUNTIME)).toBe(120);
    });
});

describe('chapterHelpers: getChapterTimeDisplay', () => {
    it('shows the remaining time while playing past the chapter start', () => {
        // Chapter 0 [0,100), pos 30 -> remaining 70 -> '-70'
        const out = getChapterTimeDisplay(CHAPTERS[0], 0, CHAPTERS, 'playing', 30, RUNTIME);
        expect(out).toBe('-70');
        expect(datetime.getDisplayRunningTime).toHaveBeenCalledWith(70);
    });

    it('clamps remaining time to 0 past the chapter end', () => {
        // pos 150 is past chapter 0's end (100): remaining clamps to 0 -> '-0'
        expect(getChapterTimeDisplay(CHAPTERS[0], 0, CHAPTERS, 'playing', 150, RUNTIME)).toBe('-0');
    });

    it('shows the full duration when not playing', () => {
        expect(getChapterTimeDisplay(CHAPTERS[0], 0, CHAPTERS, 'unplayed', null, RUNTIME)).toBe('100');
        expect(getChapterTimeDisplay(CHAPTERS[0], 0, CHAPTERS, 'played', 100, RUNTIME)).toBe('100');
    });

    it('shows the full duration while playing when the position is at the start', () => {
        // positionTicks == chapterStart -> no countdown, full duration.
        expect(getChapterTimeDisplay(CHAPTERS[1], 1, CHAPTERS, 'playing', 100, RUNTIME)).toBe('150');
    });

    it('shows the full duration while playing when the position is null', () => {
        expect(getChapterTimeDisplay(CHAPTERS[0], 0, CHAPTERS, 'playing', null, RUNTIME)).toBe('100');
    });
});
