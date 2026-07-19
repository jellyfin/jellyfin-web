import React, { act, createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

vi.mock('components/layoutManager', () => ({ default: { tv: false } }));
vi.mock('components/playback/playbackmanager', () => ({
    playbackManager: {
        play: vi.fn(() => Promise.resolve()),
        seek: vi.fn(),
        getCurrentPlayer: vi.fn(() => ({}))
    }
}));
// Echo ticks so the bubble text is assertable.
vi.mock('scripts/datetime', () => ({
    default: { getDisplayRunningTime: (ticks: number) => `t${ticks}` }
}));
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
vi.mock('lib/globalize', () => ({ default: { getIsRTL: () => false, getIsElementRTL: () => false } }));
vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

import { playbackManager } from 'components/playback/playbackmanager';
import type { JfSliderHandle } from 'elements/jf-slider/Slider';
import type { ItemDto } from 'types/base/models/item-dto';

import ChapterSeekSlider from './ChapterSeekSlider';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const pm = vi.mocked(playbackManager);

const ITEM: ItemDto = { Id: 'item-1', ServerId: 'server-1' };
// Chapter starts at 100 ticks and runs for 200 ticks (100..300).
const CHAPTER: ChapterInfo = { StartPositionTicks: 100 };
const DURATION = 200;

interface SliderProps {
    chapterDurationTicks?: number;
    progressPct?: number;
    isActiveForItem?: boolean;
    onActivate?: () => void;
    chapter?: ChapterInfo;
}

interface Harness {
    container: HTMLElement;
    root: Root;
    ref: React.RefObject<JfSliderHandle>;
    input: () => HTMLInputElement;
    track: () => HTMLElement;
    unmount: () => void;
}

const mounted: Harness[] = [];

function mount(props: SliderProps = {}): Harness {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const ref = createRef<JfSliderHandle>();

    act(() => {
        root.render(
            <ChapterSeekSlider
                ref={ref}
                item={ITEM}
                chapter={props.chapter ?? CHAPTER}
                chapterDurationTicks={props.chapterDurationTicks ?? DURATION}
                progressPct={props.progressPct ?? 0}
                isActiveForItem={props.isActiveForItem ?? false}
                onActivate={props.onActivate ?? (() => { /* noop */ })}
            />
        );
    });

    const harness: Harness = {
        container,
        root,
        ref: ref as React.RefObject<JfSliderHandle>,
        input: () => {
            const el = container.querySelector('input');
            if (!el) throw new Error('input not rendered');
            return el;
        },
        track: () => {
            const el = container.querySelector<HTMLElement>('.audiobookChapterSlider');
            if (!el) throw new Error('track not rendered');
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

function setNativeValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    setter?.set?.call(input, value);
}

// Drive a drag tick so the bubble renders (needed to exercise updateBubbleHtml).
function dragTick(input: HTMLInputElement, value: string) {
    act(() => {
        setNativeValue(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

// Commit a seek: the change handler reads input.value.
function commit(input: HTMLInputElement, value: string) {
    act(() => {
        setNativeValue(input, value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function stubTrackRect(track: HTMLElement, { left = 0, width = 100 } = {}) {
    Object.defineProperty(track, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            left, right: left + width, width, top: 20, bottom: 20, height: 0, x: left, y: 20, toJSON: () => ''
        })
    });
}

beforeEach(() => {
    pm.getCurrentPlayer.mockReturnValue({});
});

afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount();
});

describe('ChapterSeekSlider: rendering', () => {
    it('renders the slider clamped to the 0-100 progress range', () => {
        const h = mount({ progressPct: 150 });
        // clampPercent(150) -> 100
        expect(h.input().value).toBe('100');
    });

    it('clamps a negative progress to 0', () => {
        const h = mount({ progressPct: -20 });
        expect(h.input().value).toBe('0');
    });
});

describe('ChapterSeekSlider: onChange -> seek or play', () => {
    it('seeks on the current player when active', () => {
        const player = {};
        pm.getCurrentPlayer.mockReturnValue(player);
        const h = mount({ isActiveForItem: true });
        // 50% of [100..300] -> tick 200.
        commit(h.input(), '50');
        expect(pm.seek).toHaveBeenCalledWith(200, player);
        expect(pm.play).not.toHaveBeenCalled();
    });

    it('starts playback at the target tick when no player is active', () => {
        pm.getCurrentPlayer.mockReturnValue(undefined);
        const h = mount({ isActiveForItem: false });
        commit(h.input(), '25'); // -> tick 150
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 150
        });
        expect(pm.seek).not.toHaveBeenCalled();
    });

    it('starts playback when a player exists but this item is not active', () => {
        pm.getCurrentPlayer.mockReturnValue({});
        const h = mount({ isActiveForItem: false });
        commit(h.input(), '100'); // -> tick 300
        expect(pm.play).toHaveBeenCalledWith({
            ids: ['item-1'],
            serverId: 'server-1',
            startPositionTicks: 300
        });
        expect(pm.seek).not.toHaveBeenCalled();
    });

    it('logs when a play started from the slider rejects', async () => {
        const err = new Error('boom');
        pm.getCurrentPlayer.mockReturnValue(undefined);
        pm.play.mockReturnValueOnce(Promise.reject(err));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { /* silence */ });
        const h = mount({ isActiveForItem: false });
        commit(h.input(), '25');
        await Promise.resolve();
        expect(spy).toHaveBeenCalledWith('[ChapterSeekSlider] failed to play', err);
        spy.mockRestore();
    });
});

describe('ChapterSeekSlider: tick mapping edge cases', () => {
    it('treats a missing chapter start as 0 and a zero duration as no offset', () => {
        // chapterDurationTicks 0 also exercises the keyboardStep fallback branch.
        const h = mount({ chapter: {}, chapterDurationTicks: 0, isActiveForItem: true });
        commit(h.input(), '50'); // start 0 + 50% * 0 -> 0
        expect(pm.seek).toHaveBeenCalledWith(0, expect.anything());
    });
});

describe('ChapterSeekSlider: bubble text', () => {
    it('maps the drag percent to a chapter tick and formats it', () => {
        const h = mount();
        stubTrackRect(h.track());
        dragTick(h.input(), '50'); // 50% of [100..300] -> tick 200
        expect(h.container.querySelector('.jfSlider-bubbleText')?.textContent).toBe('t200');
    });

    it('positions the bubble with fixed coordinates during a drag', () => {
        const h = mount();
        stubTrackRect(h.track(), { left: 0, width: 100 });
        dragTick(h.input(), '50');
        const bubble = h.container.querySelector<HTMLElement>('.jfSlider-bubble');
        expect(bubble).not.toBeNull();
        // updateBubbleHtml pins the bubble to viewport coords.
        expect(bubble!.style.position).toBe('fixed');
    });
});
