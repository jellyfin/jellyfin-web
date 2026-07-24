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

    const playingIndex = useMemo(() => (
        chapters.findIndex((chapter, i) => getChapterState(chapter, i, chapters, positionTicks, item.RunTimeTicks || 0) === 'playing')
    ), [chapters, positionTicks, item.RunTimeTicks]);

    // Scroll the playing chapter into view and focus it, stealing focus back
    // from the detail page's banner play button (that auto-focus runs
    // synchronously, before this effect).
    useEffect(() => {
        if (playingIndex < 0) return;
        const playing = containerRef.current?.querySelector<HTMLElement>('.chapterItem-playing');
        playing?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        // preventScroll so focus doesn't fight the smooth scroll above.
        playing?.focus({ preventScroll: true });
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
