import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

// Mock the playbackManager singleton. It is also the target of the
// 'playerchange' event, so the object identity must be stable across the test.
vi.mock('components/playback/playbackmanager', () => ({
    playbackManager: {
        getCurrentPlayer: vi.fn(),
        currentItem: vi.fn(),
        getCurrentTicks: vi.fn(),
        paused: vi.fn()
    }
}));

import { playbackManager } from 'components/playback/playbackmanager';
import Events from 'utils/events';
import type { ItemDto } from 'types/base/models/item-dto';

import { usePlaybackProgress, type PlaybackProgress } from './usePlaybackProgress';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const pm = vi.mocked(playbackManager);

const ITEM: ItemDto = { Id: 'item-1', ServerId: 'server-1' };

// A player is just any object Events can attach callbacks to.
function makePlayer() {
    return {};
}

interface Harness {
    latest: () => PlaybackProgress;
    unmount: () => void;
}

const mounted: Harness[] = [];

// Render a probe component that captures the hook's return value each render.
function mount(item: ItemDto = ITEM): Harness {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    let latest: PlaybackProgress;

    const Probe = () => {
        latest = usePlaybackProgress(item);
        return null;
    };

    act(() => {
        root.render(<Probe />);
    });

    const harness: Harness = {
        latest: () => latest,
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

beforeEach(() => {
    // Clear the Events callback registry the hook attaches to the singleton.
    delete (playbackManager as unknown as { _callbacks?: unknown })._callbacks;
    pm.getCurrentPlayer.mockReturnValue(undefined);
    pm.currentItem.mockReturnValue(undefined);
    pm.getCurrentTicks.mockReturnValue(0);
    pm.paused.mockReturnValue(false);
});

afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount();
});

describe('usePlaybackProgress: idle read', () => {
    it('falls back to the saved resume position when no player is active', () => {
        const item: ItemDto = { ...ITEM, UserData: { Key: 'k', PlaybackPositionTicks: 1234 } };
        const h = mount(item);
        expect(h.latest()).toEqual({
            positionTicks: 1234,
            isActiveForItem: false,
            isPaused: false
        });
    });

    it('reports a null position when there is no saved resume position', () => {
        const h = mount(ITEM);
        expect(h.latest()).toEqual({
            positionTicks: null,
            isActiveForItem: false,
            isPaused: false
        });
    });

    it('is idle when a player is active for a different item', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: 'other-item' });
        const item: ItemDto = { ...ITEM, UserData: { Key: 'k', PlaybackPositionTicks: 42 } };
        const h = mount(item);
        expect(h.latest()).toEqual({
            positionTicks: 42,
            isActiveForItem: false,
            isPaused: false
        });
    });
});

describe('usePlaybackProgress: active read', () => {
    it('reports live ticks and paused state when the player is loaded with this item', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(5000);
        pm.paused.mockReturnValue(true);

        const h = mount(ITEM);
        expect(h.latest()).toEqual({
            positionTicks: 5000,
            isActiveForItem: true,
            isPaused: true
        });
    });
});

describe('usePlaybackProgress: reactivity', () => {
    it('updates on timeupdate only when the current item matches', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(1000);

        const h = mount(ITEM);
        expect(h.latest().positionTicks).toBe(1000);

        pm.getCurrentTicks.mockReturnValue(2000);
        act(() => Events.trigger(player, 'timeupdate'));
        expect(h.latest().positionTicks).toBe(2000);

        // A timeupdate for a different item is ignored.
        pm.currentItem.mockReturnValue({ Id: 'other' });
        pm.getCurrentTicks.mockReturnValue(9999);
        act(() => Events.trigger(player, 'timeupdate'));
        expect(h.latest().positionTicks).toBe(2000);
    });

    it('ignores a timeupdate once the current player has gone away', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(1000);

        const h = mount(ITEM);
        expect(h.latest().positionTicks).toBe(1000);

        // Player disappears; a late timeupdate on the old player must be ignored.
        pm.getCurrentPlayer.mockReturnValue(undefined);
        pm.getCurrentTicks.mockReturnValue(4000);
        act(() => Events.trigger(player, 'timeupdate'));
        expect(h.latest().positionTicks).toBe(1000);
    });

    it('updates on pause, unpause and playbackstop', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(1000);
        pm.paused.mockReturnValue(false);

        const h = mount(ITEM);
        expect(h.latest().isPaused).toBe(false);

        pm.paused.mockReturnValue(true);
        act(() => Events.trigger(player, 'pause'));
        expect(h.latest().isPaused).toBe(true);

        pm.paused.mockReturnValue(false);
        act(() => Events.trigger(player, 'unpause'));
        expect(h.latest().isPaused).toBe(false);

        // playbackstop just re-reads; nothing throws and state stays consistent.
        act(() => Events.trigger(player, 'playbackstop'));
        expect(h.latest().isActiveForItem).toBe(true);
    });
});

describe('usePlaybackProgress: playerchange rebinding', () => {
    it('binds the new player and unbinds the old one', () => {
        const oldPlayer = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(oldPlayer);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(100);

        const h = mount(ITEM);
        expect(h.latest().positionTicks).toBe(100);

        // Switch the current player, then fire playerchange on the singleton.
        const newPlayer = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(newPlayer);
        pm.getCurrentTicks.mockReturnValue(200);
        act(() => Events.trigger(playbackManager, 'playerchange'));
        expect(h.latest().positionTicks).toBe(200);

        // Events from the new player drive updates.
        pm.getCurrentTicks.mockReturnValue(300);
        act(() => Events.trigger(newPlayer, 'timeupdate'));
        expect(h.latest().positionTicks).toBe(300);

        // The old player is unbound: its events no longer update state.
        pm.getCurrentTicks.mockReturnValue(999);
        act(() => Events.trigger(oldPlayer, 'timeupdate'));
        expect(h.latest().positionTicks).toBe(300);
    });
});

describe('usePlaybackProgress: cleanup', () => {
    it('removes all listeners on unmount', () => {
        const player = makePlayer();
        pm.getCurrentPlayer.mockReturnValue(player);
        pm.currentItem.mockReturnValue({ Id: ITEM.Id });
        pm.getCurrentTicks.mockReturnValue(1000);

        const h = mount(ITEM);
        h.unmount();

        // Triggering after unmount must not throw or update anything.
        pm.getCurrentTicks.mockReturnValue(5000);
        expect(() => {
            act(() => Events.trigger(player, 'timeupdate'));
            act(() => Events.trigger(playbackManager, 'playerchange'));
        }).not.toThrow();
        expect(h.latest().positionTicks).toBe(1000);
    });
});
