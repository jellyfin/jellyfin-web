import React, { forwardRef, useCallback } from 'react';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import datetime from 'scripts/datetime';
import { playbackManager } from 'components/playback/playbackmanager';
import Slider, { BubbleText, type JfSliderHandle } from 'elements/jf-slider/Slider';
import type { ItemDto } from 'types/base/models/item-dto';

const TEN_SECONDS_TICKS = 10 * 10000000;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

interface ChapterSeekSliderProps {
    item: ItemDto;
    chapter: ChapterInfo;
    chapterDurationTicks: number;
    /** Live progress within the chapter, 0-100. */
    progressPct: number;
    isActiveForItem: boolean;
    onActivate: () => void;
}

// Adapts jf-slider for a chapter row: maps the 0-100 percent scale to the
// chapter's tick range and commits seeks through playbackManager. Not
// focusable — the row owns the focus stop and drives it via the ref handle.
const ChapterSeekSlider = forwardRef<JfSliderHandle, ChapterSeekSliderProps>(({
    item,
    chapter,
    chapterDurationTicks,
    progressPct,
    isActiveForItem,
    onActivate
}, ref) => {
    const chapterStart = chapter.StartPositionTicks ?? 0;

    const percentToTicks = useCallback(
        (percent: number) => Math.round(chapterStart + (percent / 100) * chapterDurationTicks),
        [chapterStart, chapterDurationTicks]
    );

    const bubbleContent = useCallback(
        (percent: number) => <BubbleText>{datetime.getDisplayRunningTime(percentToTicks(percent))}</BubbleText>,
        [percentToTicks]
    );

    const onChange = useCallback((percent: number) => {
        const targetTicks = percentToTicks(clampPercent(percent));
        const player = playbackManager.getCurrentPlayer();
        if (player && isActiveForItem) {
            playbackManager.seek(targetTicks, player);
        } else {
            // Nothing active: start this item at the target position
            playbackManager.play({
                ids: [item.Id],
                serverId: item.ServerId,
                startPositionTicks: targetTicks
            }).catch(err => {
                console.error('[ChapterSeekSlider] failed to play', err);
            });
        }
    }, [percentToTicks, isActiveForItem, item.Id, item.ServerId]);

    // One D-pad press moves ~10 seconds, mirroring the now-playing seek bar
    const keyboardStep = chapterDurationTicks > 0 ?
        Math.min(10, Math.max(0.5, (TEN_SECONDS_TICKS / chapterDurationTicks) * 100)) :
        1;

    return (
        <Slider
            ref={ref}
            className='audiobookChapterSlider'
            value={clampPercent(progressPct)}
            min={0}
            max={100}
            step={0.01}
            focusable={false}
            keepProgress
            keyboardStep={keyboardStep}
            ariaLabel='Seek within chapter'
            bubbleContent={bubbleContent}
            onChange={onChange}
            onActivate={onActivate}
        />
    );
});

ChapterSeekSlider.displayName = 'ChapterSeekSlider';

export default ChapterSeekSlider;
