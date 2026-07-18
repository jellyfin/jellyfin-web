import React, { type FC, useCallback, useRef } from 'react';
import classNames from 'classnames';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

import layoutManager from 'components/layoutManager';
import { playbackManager } from 'components/playback/playbackmanager';
import { getKeyName } from 'scripts/keyboardNavigation';
import type { JfSliderHandle } from 'elements/jf-slider/Slider';
import type { ItemDto } from 'types/base/models/item-dto';

import ChapterSeekSlider from './ChapterSeekSlider';
import {
    getChapterDurationTicks,
    getChapterProgress,
    getChapterState,
    getChapterTimeDisplay,
    type ChapterState
} from './chapterHelpers';

interface AudiobookChapterRowProps {
    item: ItemDto;
    chapter: ChapterInfo;
    chapterIndex: number;
    chapters: ChapterInfo[];
    positionTicks: number | null;
    isActiveForItem: boolean;
    isPaused: boolean;
}

function StatusGlyph({ state, isActiveForItem, isPaused }: Readonly<{
    state: ChapterState;
    isActiveForItem: boolean;
    isPaused: boolean;
}>) {
    if (state === 'playing') {
        const iconName = (isActiveForItem && !isPaused) ? 'pause' : 'play_arrow';
        return <span className={`material-icons audiobookChapterItem-iconPlaying ${iconName}`} aria-hidden='true' />;
    }
    // Resting glyph (check for played, nothing for unplayed) swaps to a play
    // button on hover/focus, revealed by CSS
    return (
        <>
            {state === 'played' && (
                <span className='material-icons audiobookChapterItem-iconComplete check' aria-hidden='true' />
            )}
            <span className='material-icons audiobookChapterItem-iconPlay play_arrow' aria-hidden='true' />
        </>
    );
}

const AudiobookChapterRow: FC<AudiobookChapterRowProps> = ({
    item,
    chapter,
    chapterIndex,
    chapters,
    positionTicks,
    isActiveForItem,
    isPaused
}) => {
    const sliderRef = useRef<JfSliderHandle>(null);

    const runTimeTicks = item.RunTimeTicks || 0;
    const state = getChapterState(chapter, chapterIndex, chapters, positionTicks, runTimeTicks);
    const progress = getChapterProgress(chapter, chapterIndex, chapters, positionTicks, runTimeTicks);
    const chapterStart = chapter.StartPositionTicks ?? 0;
    const chapterDurationTicks = getChapterDurationTicks(chapter, chapterIndex, chapters, runTimeTicks);
    const timeDisplay = getChapterTimeDisplay(chapter, chapterIndex, chapters, state, positionTicks, runTimeTicks);
    const chapterName = chapter.Name || `Chapter ${chapterIndex + 1}`;
    const isPlaying = state === 'playing';
    const progressPct = isPlaying ? (progress || 0) * 100 : 0;

    // The playing chapter resumes at the saved position; others start at
    // their chapter boundary.
    const playTicks = isPlaying && positionTicks ? Math.round(positionTicks) : chapterStart;

    const play = useCallback((ticks: number) => {
        playbackManager.play({
            ids: [item.Id],
            serverId: item.ServerId,
            startPositionTicks: ticks
        }).catch(err => {
            console.error('[AudiobookChapterRow] failed to play', err);
        });
    }, [item.Id, item.ServerId]);

    const activateRow = useCallback(() => {
        // Toggle play/pause when re-activating the row for the actively-loaded item
        if (isPlaying && isActiveForItem) {
            playbackManager.playPause();
        } else {
            play(playTicks);
        }
    }, [isPlaying, isActiveForItem, play, playTicks]);

    const onRestartClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActiveForItem) {
            playbackManager.seek(chapterStart);
        } else {
            play(chapterStart);
        }
    }, [isActiveForItem, chapterStart, play]);

    const onRestartKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        onRestartClick(e as unknown as React.MouseEvent);
    }, [onRestartClick]);

    // The row is the focus stop (focusManager can't focus a range input, so the
    // slider stays passive). On TV the row proxies the D-pad into the slider:
    // Left/Right stage a pending seek, OK commits it (or toggles play/pause when
    // nothing is staged), Up/Down/Back abandon it and navigate away.
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const slider = sliderRef.current;

        if (layoutManager.tv && isPlaying && slider) {
            const key = getKeyName(e.nativeEvent);

            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                slider.nudge(key === 'ArrowLeft' ? 'left' : 'right');
                return;
            }

            if (slider.hasPendingSeek()
                    && (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Escape' || key === 'Back')) {
                slider.clearPendingSeek();
            }
        }

        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        // With a pending seek staged, OK commits it instead of toggling play
        if (slider?.commitPendingSeek()) {
            e.stopPropagation();
            return;
        }

        activateRow();
    }, [isPlaying, activateRow]);

    // Losing focus abandons the playing row's pending seek
    const onBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        sliderRef.current?.clearPendingSeek();
    }, []);

    return (
        <div
            className={classNames(
                'listItem', 'listItem-border', 'audiobookChapterItem', 'itemAction',
                { focusable: layoutManager.tv },
                `chapterItem-${state}`
            )}
            role='button'
            tabIndex={0}
            onClick={activateRow}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
        >
            <div className='audiobookChapterItem-status'>
                <StatusGlyph state={state} isActiveForItem={isActiveForItem} isPaused={isPaused} />
            </div>
            <div className='audiobookChapterItem-index'>{chapterIndex + 1}</div>
            <div className='listItemBody audiobookChapterItem-body'>
                <div className='listItemBodyText audiobookChapterItem-name'>{chapterName}</div>
            </div>
            {isPlaying && (
                <span
                    className='audiobookChapterItem-restart material-icons replay'
                    role='button'
                    tabIndex={-1}
                    title='Restart chapter'
                    onClick={onRestartClick}
                    onKeyDown={onRestartKeyDown}
                />
            )}
            <div className='secondary audiobookChapterItem-time'>{timeDisplay}</div>
            {isPlaying && (
                <ChapterSeekSlider
                    ref={sliderRef}
                    item={item}
                    chapter={chapter}
                    chapterDurationTicks={chapterDurationTicks}
                    progressPct={progressPct}
                    isActiveForItem={isActiveForItem}
                    onActivate={activateRow}
                />
            )}
        </div>
    );
};

export default AudiobookChapterRow;
