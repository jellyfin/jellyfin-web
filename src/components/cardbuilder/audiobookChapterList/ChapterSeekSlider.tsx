import React, { forwardRef, useCallback } from 'react';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import datetime from 'scripts/datetime';
import { playbackManager } from 'components/playback/playbackmanager';
import Slider, { type JfSliderHandle } from 'elements/jf-slider/Slider';
import type { ItemDto } from 'types/base/models/item-dto';

const TEN_SECONDS_TICKS = 10 * 10000000;

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

interface ChapterSeekSliderProps {
    item: ItemDto;
    chapter: ChapterInfo;
    /** Chapter length in ticks. */
    chapterDurationTicks: number;
    /** Live progress within the chapter, 0-100. */
    progressPct: number;
    isActiveForItem: boolean;
    /** Toggle play/pause; invoked on OK when no seek is staged. */
    onActivate: () => void;
}

/**
 * Seekable progress bar for the currently-playing chapter row, built on the
 * reusable jf-slider. This adapter maps the slider's 0-100 percent scale onto
 * the chapter's tick range, renders the time bubble, and commits seeks through
 * playbackManager. The slider input is not focusable (focusable={false}); the
 * chapter row owns the focus stop and proxies the D-pad in through the ref
 * handle, since focusManager can't focus a range input directly.
 */
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

    const getBubbleText = useCallback(
        (percent: number) => datetime.getDisplayRunningTime(percentToTicks(percent)),
        [percentToTicks]
    );

    // Render the bubble in fixed viewport coords so the scrollbox can't clip it.
    const updateBubbleHtml = useCallback((bubble: HTMLElement, percent: number) => {
        const track = bubble.parentElement;
        if (!track) return false;

        bubble.innerHTML = '<h1 class="jfSlider-bubbleText">' + getBubbleText(percent) + '</h1>';
        bubble.style.position = 'fixed';

        const trackRect = track.getBoundingClientRect();
        const pointerLeft = trackRect.left + (trackRect.width * percent / 100);

        // Anchor at 0,0 to find the containing block, then offset to target
        bubble.style.left = '0px';
        bubble.style.top = '0px';
        const zeroRect = bubble.getBoundingClientRect();
        bubble.style.transform = 'none';
        bubble.style.left = (pointerLeft - (zeroRect.width / 2) - zeroRect.left) + 'px';
        bubble.style.top = (trackRect.top - zeroRect.height - 6 - zeroRect.top) + 'px';
        return true;
    }, [getBubbleText]);

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
            getBubbleText={getBubbleText}
            updateBubbleHtml={updateBubbleHtml}
            onChange={onChange}
            onActivate={onActivate}
        />
    );
});

ChapterSeekSlider.displayName = 'ChapterSeekSlider';

export default ChapterSeekSlider;
