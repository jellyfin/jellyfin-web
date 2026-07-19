import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';

// Control playback state directly instead of exercising the real hook.
const progress = vi.hoisted(() => ({
    value: { positionTicks: null as number | null, isActiveForItem: false, isPaused: false }
}));
vi.mock('./usePlaybackProgress', () => ({
    usePlaybackProgress: () => progress.value
}));

// The list renders the real Row + real Slider, which need these deps mocked.
vi.mock('components/layoutManager', () => ({ default: { tv: false } }));
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
vi.mock('scripts/datetime', () => ({
    default: { getDisplayRunningTime: (ticks: number) => String(ticks) }
}));
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
vi.mock('lib/globalize', () => ({ default: { getIsRTL: () => false, getIsElementRTL: () => false } }));
vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

import type { ItemDto } from 'types/base/models/item-dto';

import AudiobookChapterList from './AudiobookChapterList';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ITEM: ItemDto = { Id: 'item-1', ServerId: 'server-1', RunTimeTicks: 400 };
const CHAPTERS: ChapterInfo[] = [
    { StartPositionTicks: 0, Name: 'Intro' },
    { StartPositionTicks: 100, Name: 'Middle' },
    { StartPositionTicks: 250, Name: 'End' }
];

interface Harness {
    container: HTMLElement;
    root: Root;
    unmount: () => void;
}

const mounted: Harness[] = [];

function mount(chapters: ChapterInfo[] = CHAPTERS, item: ItemDto = ITEM): Harness {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
        root.render(<AudiobookChapterList item={item} chapters={chapters} />);
    });
    const harness: Harness = {
        container,
        root,
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

// jsdom implements neither; define them so the focus effect can be spied.
const scrollIntoView = vi.fn();
const focus = vi.fn();

beforeEach(() => {
    progress.value = { positionTicks: null, isActiveForItem: false, isPaused: false };
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(focus);
});

afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount();
    scrollIntoView.mockClear();
    focus.mockClear();
});

describe('AudiobookChapterList', () => {
    it('renders one row per chapter, in order', () => {
        const h = mount();
        const rows = h.container.querySelectorAll('.audiobookChapterItem');
        expect(rows).toHaveLength(3);
        const names = [...h.container.querySelectorAll('.audiobookChapterItem-name')].map(n => n.textContent);
        expect(names).toEqual(['Intro', 'Middle', 'End']);
    });

    it('renders an empty container with no rows for an empty chapter list', () => {
        const h = mount([]);
        expect(h.container.querySelector('.audiobookChapterList')).not.toBeNull();
        expect(h.container.querySelectorAll('.audiobookChapterItem')).toHaveLength(0);
    });

    it('scrolls and focuses the playing chapter', () => {
        // Position 50 lands inside chapter 0 -> playing.
        progress.value = { positionTicks: 50, isActiveForItem: true, isPaused: false };
        const h = mount();
        expect(h.container.querySelector('.chapterItem-playing')).not.toBeNull();
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
        expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('does not scroll or focus when no chapter is playing', () => {
        const h = mount();
        expect(h.container.querySelector('.chapterItem-playing')).toBeNull();
        expect(scrollIntoView).not.toHaveBeenCalled();
        expect(focus).not.toHaveBeenCalled();
    });

    it('computes the playing chapter when the item has no runtime', () => {
        // No RunTimeTicks -> the memo falls back to 0; last chapter with an
        // unknown end is still "playing" at a mid position.
        progress.value = { positionTicks: 300, isActiveForItem: true, isPaused: false };
        const item: ItemDto = { Id: 'item-1', ServerId: 'server-1' };
        const h = mount(CHAPTERS, item);
        expect(h.container.querySelector('.chapterItem-playing')).not.toBeNull();
        expect(scrollIntoView).toHaveBeenCalled();
    });
});
