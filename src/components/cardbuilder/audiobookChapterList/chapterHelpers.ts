import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import datetime from 'scripts/datetime';

export type ChapterState = 'unplayed' | 'playing' | 'played';

/**
 * Computes chapter progress as a fraction 0-1, or null if not in this chapter.
 */
export function getChapterProgress(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    positionTicks: number | null
): number | null {
    if (positionTicks == null || positionTicks <= 0) return null;

    const chapterStart = chapter.StartPositionTicks ?? 0;
    const nextChapter = chapters[chapterIndex + 1];
    const chapterEnd = nextChapter ? nextChapter.StartPositionTicks ?? null : null;

    if (positionTicks < chapterStart) return null;
    if (chapterEnd != null && positionTicks >= chapterEnd) return 1;

    // Currently in this chapter
    if (chapterEnd == null) return 0; // last chapter, no end boundary known
    const duration = chapterEnd - chapterStart;
    if (duration <= 0) return 0;
    return (positionTicks - chapterStart) / duration;
}

export function getChapterState(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    positionTicks: number | null
): ChapterState {
    const progress = getChapterProgress(chapter, chapterIndex, chapters, positionTicks);
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
    const nextChapter = chapters[chapterIndex + 1];
    const chapterEnd = nextChapter ? nextChapter.StartPositionTicks ?? 0 : (itemRunTimeTicks || 0);
    return Math.max(0, chapterEnd - (chapter.StartPositionTicks ?? 0));
}

export function getChapterTimeDisplay(
    chapter: ChapterInfo,
    chapterIndex: number,
    chapters: ChapterInfo[],
    state: ChapterState,
    positionTicks: number | null,
    itemRunTimeTicks: number
): string {
    const chapterStart = chapter.StartPositionTicks ?? 0;
    const duration = getChapterDurationTicks(chapter, chapterIndex, chapters, itemRunTimeTicks);
    if (state === 'playing' && positionTicks != null && positionTicks > chapterStart) {
        const remaining = Math.max(0, (chapterStart + duration) - positionTicks);
        return '-' + datetime.getDisplayRunningTime(remaining);
    }
    return datetime.getDisplayRunningTime(duration);
}
