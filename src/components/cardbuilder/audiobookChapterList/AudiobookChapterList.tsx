import React, { type FC, useEffect, useMemo, useRef } from 'react';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import type { ItemDto } from 'types/base/models/item-dto';

import AudiobookChapterRow from './AudiobookChapterRow';
import { getChapterState } from './chapterHelpers';
import { usePlaybackProgress } from './usePlaybackProgress';

import './audiobookChapterList.scss';

interface AudiobookChapterListProps {
    item: ItemDto;
    chapters: ChapterInfo[];
}

// Chapter list for audiobooks, styled after the album track list, with a
// seek slider on the playing chapter. Rendered into the detail page's
// children container by the legacy itemDetails controller.
const AudiobookChapterList: FC<AudiobookChapterListProps> = ({ item, chapters }) => {
    const { positionTicks, isActiveForItem, isPaused } = usePlaybackProgress(item);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasFocusedPlayingRef = useRef(false);

    const playingIndex = useMemo(() => (
        chapters.findIndex((chapter, i) => getChapterState(chapter, i, chapters, positionTicks, item.RunTimeTicks || 0) === 'playing')
    ), [chapters, positionTicks, item.RunTimeTicks]);

    // Keep the playing chapter visible as playback crosses chapter boundaries.
    useEffect(() => {
        if (playingIndex < 0) return;
        containerRef.current
            ?.querySelector<HTMLElement>('.chapterItem-playing')
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [playingIndex]);

    // Once, on the first render that has a playing chapter, pull focus onto it --
    // this claims focus back from the detail page's banner play button on TV
    // (autoFocuser is tv-only and runs from an async import, so the ordering
    // isn't guaranteed either way). Guarded so later chapter boundaries never
    // yank focus out from under the user.
    useEffect(() => {
        if (playingIndex < 0 || hasFocusedPlayingRef.current) return;
        hasFocusedPlayingRef.current = true;

        const container = containerRef.current;
        const playing = container?.querySelector<HTMLElement>('.chapterItem-playing');
        if (!playing) return;

        // Don't steal focus from an interaction already in progress. A freshly
        // loaded page leaves activeElement on the body, which is the case where
        // claiming focus is legitimate.
        const active = document.activeElement;
        if (active && active !== document.body && !container?.contains(active)) return;

        // preventScroll so focus doesn't fight the smooth scroll above.
        playing.focus({ preventScroll: true });
    }, [playingIndex]);

    return (
        <div ref={containerRef} className='audiobookChapterList'>
            {chapters.map((chapter, index) => (
                <AudiobookChapterRow
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    item={item}
                    chapter={chapter}
                    chapterIndex={index}
                    chapters={chapters}
                    positionTicks={positionTicks}
                    isActiveForItem={isActiveForItem}
                    isPaused={isPaused}
                />
            ))}
        </div>
    );
};

export default AudiobookChapterList;
