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

/**
 * Text-based chapter list for audiobooks, styled after the album track list,
 * with a seekable progress slider on the currently-playing chapter. A React
 * replacement for the legacy imperative audiobookChapterList module; it renders
 * into the detail page's children section via reactUtils.renderComponent.
 */
const AudiobookChapterList: FC<AudiobookChapterListProps> = ({ item, chapters }) => {
    const { positionTicks, isActiveForItem, isPaused } = usePlaybackProgress(item);
    const containerRef = useRef<HTMLDivElement>(null);

    const playingIndex = useMemo(() => (
        chapters.findIndex((chapter, i) => getChapterState(chapter, i, chapters, positionTicks) === 'playing')
    ), [chapters, positionTicks]);

    // Auto-scroll when the active chapter changes
    useEffect(() => {
        if (playingIndex < 0) return;
        const playing = containerRef.current?.querySelector('.chapterItem-playing');
        playing?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
