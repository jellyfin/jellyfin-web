import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TICKS_PER_SECOND } from 'constants/time';

import { createDoubleClickSeek } from './doubleClickSeek';

const ticks = (seconds: number) => seconds * TICKS_PER_SECOND;

describe('double-click seeking', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([-1, 1] as const)('seeks 10, 20 and 40 seconds in direction %i', direction => {
        const gesture = createDoubleClickSeek();
        let position = ticks(100);

        for (const seconds of [10, 20, 40]) {
            const nextPosition = gesture.getPosition(direction, position, ticks(300));
            expect(nextPosition).toBe(position + direction * ticks(seconds));
            position = nextPosition;
            vi.advanceTimersByTime(5_000);
        }
    });

    it('continues at ten seconds and resets after ten seconds of inactivity', () => {
        const gesture = createDoubleClickSeek();
        gesture.getPosition(1, ticks(100));
        vi.advanceTimersByTime(10_000);
        expect(gesture.getPosition(1, ticks(110))).toBe(ticks(130));
        vi.advanceTimersByTime(10_001);
        expect(gesture.getPosition(1, ticks(130))).toBe(ticks(140));
    });

    it('starts at ten seconds whenever the direction changes', () => {
        const gesture = createDoubleClickSeek();
        gesture.getPosition(1, ticks(100));
        gesture.getPosition(1, ticks(110));
        expect(gesture.getPosition(-1, ticks(130))).toBe(ticks(120));
        expect(gesture.getPosition(1, ticks(120))).toBe(ticks(130));
    });

    it('clamps seeking to the start and end of the video', () => {
        const gesture = createDoubleClickSeek();
        expect(gesture.getPosition(-1, ticks(5), ticks(100))).toBe(0);
        expect(gesture.getPosition(1, ticks(95), ticks(100))).toBe(ticks(100));
    });

    it('resets the sequence when playback changes or the player closes', () => {
        const gesture = createDoubleClickSeek();
        gesture.getPosition(1, ticks(100));
        gesture.getPosition(1, ticks(110));
        gesture.reset();
        expect(gesture.getPosition(1, ticks(130))).toBe(ticks(140));
    });

    it('allows seeking when the stream has no known duration', () => {
        const gesture = createDoubleClickSeek();
        expect(gesture.getPosition(1, ticks(100))).toBe(ticks(110));
    });
});
