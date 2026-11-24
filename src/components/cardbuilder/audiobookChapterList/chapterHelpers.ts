import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import datetime from 'scripts/datetime';

export type ChapterState = 'unplayed' | 'playing' | 'played';

export interface ChapterBounds {
    /** Chapter start in ticks; a missing StartPositionTicks counts as 0. */
    start: number;
    /**
     * Chapter end in ticks: the next chapter's start, or the item runtime for
     * the last chapter. Null when the boundary is unknown -- the next chapter
     * has no StartPositionTicks, or the item has no runtime. Callers must
     * distinguish "unknown" from a real end of 0.
     */
    end: number | null;
}

// Single source of truth for a chapter's tick range, so progress, duration and
// the time display can't drift apart.
export function getChapterBounds(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    itemRunTimeTicks: number
): ChapterBounds {
    const nextChapter = chapters[chapterIndex + 1];
    return {
        start: chapter.StartPositionTicks ?? 0,
        end: nextChapter ? nextChapter.StartPositionTicks ?? null : (itemRunTimeTicks || null)
    };
}

// Chapter length in ticks, clamped to 0. An unknown end measures as zero length.
function getBoundsDurationTicks({ start, end }: ChapterBounds): number {
    return Math.max(0, (end ?? 0) - start);
}

// Progress through this chapter as a fraction 0-1, or null if the position
// isn't inside it.
export function getChapterProgress(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    positionTicks: number | null,
    itemRunTimeTicks: number
): number | null {
    if (positionTicks == null || positionTicks <= 0) return null;

    const { start: chapterStart, end: chapterEnd } = getChapterBounds(chapter, chapterIndex, chapters, itemRunTimeTicks);

    if (positionTicks < chapterStart) return null;
    if (chapterEnd != null && positionTicks >= chapterEnd) return 1;
    if (chapterEnd == null) return 0; // end boundary unknown
    const duration = chapterEnd - chapterStart;
    if (duration <= 0) return 0;
    return (positionTicks - chapterStart) / duration;
}

export function getChapterState(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    positionTicks: number | null,
    itemRunTimeTicks: number
): ChapterState {
    const progress = getChapterProgress(chapter, chapterIndex, chapters, positionTicks, itemRunTimeTicks);
    if (progress === null) return 'unplayed';
    if (progress >= 1) return 'played';
    return 'playing';
}

export function getChapterDurationTicks(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    itemRunTimeTicks: number
): number {
    return getBoundsDurationTicks(getChapterBounds(chapter, chapterIndex, chapters, itemRunTimeTicks));
}

export function getChapterTimeDisplay(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    state: ChapterState,
    positionTicks: number | null,
    itemRunTimeTicks: number
): string {
    const bounds = getChapterBounds(chapter, chapterIndex, chapters, itemRunTimeTicks);
    const { start } = bounds;
    const duration = getBoundsDurationTicks(bounds);
    if (state === 'playing' && positionTicks != null && positionTicks > start) {
        const remaining = Math.max(0, (start + duration) - positionTicks);
        return '-' + datetime.getDisplayRunningTime(remaining);
    }
    return datetime.getDisplayRunningTime(duration);
}
