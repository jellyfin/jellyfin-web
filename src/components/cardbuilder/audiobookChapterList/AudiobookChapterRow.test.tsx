import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

// Mutable so a describe block can flip TV on; both the Row and the real Slider
// read layoutManager.tv, so this drives the whole D-pad path. vi.hoisted keeps
// the object available inside the hoisted vi.mock factory.
const layout = vi.hoisted(() => ({ tv: false }));
vi.mock('components/layoutManager', () => ({ default: layout }));

vi.mock('components/playback/playbackmanager', () => ({
    playbackManager: {
        play: vi.fn(() => Promise.resolve()),
        playPause: vi.fn(),
        seek: vi.fn(),
        getCurrentPlayer: vi.fn(() => ({})),
        currentItem: vi.fn(),
        getCurrentTicks: vi.fn(),
        paused: vi.fn()
    }
}));

// datetime echoes ticks so the time column is assertable. Used by the Row's
// helpers and the real ChapterSeekSlider bubble.
vi.mock('scripts/datetime', () => ({
    default: { getDisplayRunningTime: (ticks: number) => String(ticks) }
}));

// Needed by both the Row and the real Slider for TV key handling.
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
// The real Slider (used here) also imports these two.
vi.mock('lib/globalize', () => ({ default: { getIsRTL: () => false, getIsElementRTL: () => false } }));
vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';

import AudiobookChapterRow from './AudiobookChapterRow';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const pm = vi.mocked(playbackManager);

const ITEM: ItemDto = { Id: 'item-1', ServerId: 'server-1', RunTimeTicks: 400 };
const CHAPTERS: ChapterInfo[] = [
    { StartPositionTicks: 0, Name: 'Intro' },
    { StartPositionTicks: 100, Name: 'Middle' },
    { StartPositionTicks: 250, Name: 'End' }
];

interface RowProps {
    item?: ItemDto;
    chapter?: ChapterInfo;
    chapterIndex?: number;
    chapters?: ChapterInfo[];
    positionTicks?: number | null;
    isActiveForItem?: boolean;
    isPaused?: boolean;
}

interface Harness {
    container: HTMLElement;
    root: Root;
    row: () => HTMLElement;
    unmount: () => void;
}

const mounted: Harness[] = [];

function mount(props: RowProps = {}): Harness {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const index = props.chapterIndex ?? 0;
    act(() => {
        root.render(
            <AudiobookChapterRow
                item={props.item ?? ITEM}
                chapter={props.chapter ?? CHAPTERS[index]}
                chapterIndex={index}
                chapters={props.chapters ?? CHAPTERS}
                positionTicks={props.positionTicks ?? null}
                isActiveForItem={props.isActiveForItem ?? false}
                isPaused={props.isPaused ?? false}
            />
        );
    });

    const harness: Harness = {
        container,
        root,
        row: () => {
            const el = container.querySelector<HTMLElement>('.audiobookChapterItem');
            if (!el) throw new Error('row not rendered');
            return el;
        },
        unmount: () => {
            act(() => {
                root.unmount();
            });
            container.remove();
        }
    };
    mounted.push(harness);
    return harness;
}

function click(el: HTMLElement) {
    act(() => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
}

function keydown(el: HTMLElement, key: string): KeyboardEvent {
    const evt = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => {
        el.dispatchEvent(evt);
    });
    return evt;
}

beforeEach(() => {
    layout.tv = false;
    pm.getCurrentPlayer.mockReturnValue({});
});

afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount();
});

describe('AudiobookChapterRow: rendering by state', () => {
    it('renders the index (1-based) and the chapter name', () => {
        const h = mount({ chapterIndex: 1 });
        expect(h.container.querySelector('.audiobookChapterItem-index')?.textContent).toBe('2');
        expect(h.container.querySelector('.audiobookChapterItem-name')?.textContent).toBe('Middle');
    });

    it('falls back to a numbered name when the chapter has none', () => {
        const h = mount({ chapter: { StartPositionTicks: 0 }, chapterIndex: 2 });
        expect(h.container.querySelector('.audiobookChapterItem-name')?.textContent).toBe('Chapter 3');
    });

    it('unplayed: no restart button, no slider, resting play glyph only', () => {
        const h = mount({ positionTicks: null });
        expect(h.row().classList.contains('chapterItem-unplayed')).toBe(true);
        expect(h.container.querySelector('.audiobookChapterItem-restart')).toBeNull();
        expect(h.container.querySelector('.audiobookChapterSlider')).toBeNull();
        expect(h.container.querySelector('.audiobookChapterItem-iconPlaying')).toBeNull();
        expect(h.container.querySelector('.audiobookChapterItem-iconComplete')).toBeNull();
    });

    it('played: shows the complete check glyph', () => {
        // Chapter 0 [0,100) with position past its end is played.
        const h = mount({ chapterIndex: 0, positionTicks: 150 });
        expect(h.row().classList.contains('chapterItem-played')).toBe(true);
        expect(h.container.querySelector('.audiobookChapterItem-iconComplete')).not.toBeNull();
    });

    it('playing + active + not paused: pause glyph, restart button and slider', () => {
        const h = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: true, isPaused: false });
        expect(h.row().classList.contains('chapterItem-playing')).toBe(true);
        expect(h.container.querySelector('.audiobookChapterItem-iconPlaying.pause')).not.toBeNull();
        expect(h.container.querySelector('.audiobookChapterItem-restart')).not.toBeNull();
        expect(h.container.querySelector('.audiobookChapterSlider')).not.toBeNull();
    });

    it('renders a playing last chapter when the item has no runtime (progress 0)', () => {
        // No RunTimeTicks -> runTimeTicks 0; last chapter, unknown end -> progress 0,
        // state still playing. Exercises the RunTimeTicks/StartPositionTicks/progress
        // fallbacks. Chapter missing its start defaults to 0.
        const item: ItemDto = { Id: 'item-1', ServerId: 'server-1' };
        const chapters: ChapterInfo[] = [{}];
        const h = mount({ item, chapters, chapter: chapters[0], chapterIndex: 0, positionTicks: 50 });
        expect(h.row().classList.contains('chapterItem-playing')).toBe(true);
        expect(h.container.querySelector('.audiobookChapterSlider')).not.toBeNull();
    });

    it('playing but paused or inactive: play glyph rather than pause', () => {
        const paused = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: true, isPaused: true });
        expect(paused.container.querySelector('.audiobookChapterItem-iconPlaying.play_arrow')).not.toBeNull();

        const inactive = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: false });
        expect(inactive.container.querySelector('.audiobookChapterItem-iconPlaying.play_arrow')).not.toBeNull();
    });
});

describe('AudiobookChapterRow: time display', () => {
    it('shows the full chapter duration when idle', () => {
        // Chapter 0 duration = 100.
        const h = mount({ chapterIndex: 0, positionTicks: null });
        expect(h.container.querySelector('.audiobookChapterItem-time')?.textContent).toBe('100');
    });

    it('shows the remaining time while playing', () => {
        // Chapter 0 [0,100), position 30 -> remaining 70 -> '-70'.
        const h = mount({ chapterIndex: 0, positionTicks: 30, isActiveForItem: true });
        expect(h.container.querySelector('.audiobookChapterItem-time')?.textContent).toBe('-70');
    });
});

describe('AudiobookChapterRow: row activation', () => {
    it('toggles play/pause when the playing row is already active', () => {
        const h = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: true });
        click(h.row());
        expect(pm.playPause).toHaveBeenCalledTimes(1);
        expect(pm.play).not.toHaveBeenCalled();
    });

    it('starts playback at the chapter boundary for a non-playing row', () => {
        const h = mount({ chapterIndex: 1, positionTicks: null });
        click(h.row());
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 100
        });
    });

    it('resumes at the saved position for a playing but inactive row', () => {
        // Playing chapter 0, not active -> resume at round(positionTicks).
        const h = mount({ chapterIndex: 0, positionTicks: 49.6, isActiveForItem: false });
        click(h.row());
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 50
        });
    });

    it('logs when playback fails to start', async () => {
        const err = new Error('boom');
        pm.play.mockReturnValueOnce(Promise.reject(err));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });
        const h = mount({ chapterIndex: 1, positionTicks: null });
        click(h.row());
        await Promise.resolve();
        expect(spy).toHaveBeenCalledWith('[AudiobookChapterRow] failed to play', err);
        spy.mockRestore();
    });
});

describe('AudiobookChapterRow: restart button', () => {
    it('seeks to the chapter start when active, without toggling play/pause', () => {
        const h = mount({ chapterIndex: 1, positionTicks: 175, isActiveForItem: true });
        const restart = h.container.querySelector<HTMLElement>('.audiobookChapterItem-restart');
        click(restart!);
        expect(pm.seek).toHaveBeenCalledWith(100);
        expect(pm.playPause).not.toHaveBeenCalled();
        expect(pm.play).not.toHaveBeenCalled();
    });

    it('starts playback at the chapter start when inactive', () => {
        const h = mount({ chapterIndex: 1, positionTicks: 175, isActiveForItem: false });
        const restart = h.container.querySelector<HTMLElement>('.audiobookChapterItem-restart');
        click(restart!);
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 100
        });
        expect(pm.seek).not.toHaveBeenCalled();
    });

    it('activates on Enter/Space and ignores other keys', () => {
        const h = mount({ chapterIndex: 1, positionTicks: 175, isActiveForItem: true });
        const restart = h.container.querySelector<HTMLElement>('.audiobookChapterItem-restart');

        keydown(restart!, 'Enter');
        expect(pm.seek).toHaveBeenCalledTimes(1);
        keydown(restart!, ' ');
        expect(pm.seek).toHaveBeenCalledTimes(2);
        keydown(restart!, 'a');
        expect(pm.seek).toHaveBeenCalledTimes(2);
    });
});

describe('AudiobookChapterRow: keyboard (non-TV)', () => {
    it('activates the row on Enter', () => {
        const h = mount({ chapterIndex: 1, positionTicks: null });
        keydown(h.row(), 'Enter');
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 100
        });
    });

    it('ignores non-activation keys', () => {
        const h = mount({ chapterIndex: 1, positionTicks: null });
        keydown(h.row(), 'ArrowRight');
        expect(pm.play).not.toHaveBeenCalled();
    });
});

describe('AudiobookChapterRow: TV D-pad seek proxy', () => {
    const playing = { chapterIndex: 0, positionTicks: 50, isActiveForItem: true } as const;

    beforeEach(() => {
        layout.tv = true;
    });

    it('stages a seek on ArrowRight without seeking yet', () => {
        const h = mount(playing);
        const evt = keydown(h.row(), 'ArrowRight');
        expect(evt.defaultPrevented).toBe(true);
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
        expect(pm.seek).not.toHaveBeenCalled();
        expect(pm.playPause).not.toHaveBeenCalled();
    });

    it('stages a seek on ArrowLeft (nudge left)', () => {
        const h = mount(playing);
        const evt = keydown(h.row(), 'ArrowLeft');
        expect(evt.defaultPrevented).toBe(true);
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
        expect(pm.seek).not.toHaveBeenCalled();
    });

    it('commits the staged seek on Enter instead of toggling play/pause', () => {
        const h = mount(playing);
        keydown(h.row(), 'ArrowRight');
        keydown(h.row(), 'Enter');
        // Active player + active item -> commit routes to seek.
        expect(pm.seek).toHaveBeenCalledTimes(1);
        expect(pm.playPause).not.toHaveBeenCalled();
        expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
    });

    it('Enter toggles play/pause when nothing is staged', () => {
        const h = mount(playing);
        keydown(h.row(), 'Enter');
        expect(pm.playPause).toHaveBeenCalledTimes(1);
    });

    it('abandons the staged seek on ArrowUp/Down/Escape/Back', () => {
        for (const key of ['ArrowUp', 'ArrowDown', 'Escape', 'Back']) {
            const h = mount(playing);
            keydown(h.row(), 'ArrowRight');
            expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
            keydown(h.row(), key);
            expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
        }
    });
});

describe('AudiobookChapterRow: blur', () => {
    beforeEach(() => {
        layout.tv = true;
    });

    it('clears a staged seek when focus leaves the row', () => {
        const h = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: true });
        keydown(h.row(), 'ArrowRight');
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();

        // relatedTarget outside the row -> clears.
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        act(() => {
            h.row().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
        });
        expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
        outside.remove();
    });

    it('keeps the staged seek when focus stays inside the row', () => {
        const h = mount({ chapterIndex: 0, positionTicks: 50, isActiveForItem: true });
        keydown(h.row(), 'ArrowRight');

        // relatedTarget inside the row -> no clear.
        const inside = h.row().querySelector<HTMLElement>('.audiobookChapterItem-restart')!;
        act(() => {
            h.row().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: inside }));
        });
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
    });
});
