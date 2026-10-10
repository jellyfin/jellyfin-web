import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKS_PER_SECOND } from 'constants/time';
import { createVideoSeekQueue } from './videoSeekQueue';

const ticks = (seconds: number) => seconds * TICKS_PER_SECOND;

describe('pending video gesture seeks', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });
    afterEach(() => vi.useRealTimers());

    it('accumulates 10/20/40 offsets with stale positions and dispatches only the latest queued target', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100), ticks(300));
        queue.request(1, ticks(100), ticks(300));
        queue.request(1, ticks(100), ticks(300));
        expect(seek.mock.calls).toEqual([[ticks(110)]]);
        queue.observe(ticks(100));
        expect(seek).toHaveBeenCalledTimes(1);
        queue.observe(ticks(110));
        expect(seek.mock.calls).toEqual([[ticks(110)], [ticks(170)]]);
        queue.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(2);
        queue.observe(ticks(170));
        queue.request(1, ticks(172), ticks(300));
        expect(seek).toHaveBeenLastCalledWith(ticks(252));
        queue.reset();
    });

    it('resets the offset on direction change while preserving the outstanding target', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100));
        queue.request(-1, ticks(100));
        queue.observe(ticks(110));
        expect(seek).toHaveBeenLastCalledWith(ticks(100));
        queue.reset();
    });

    it('requires finite acknowledgment within the tolerance and ignores duplicates', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100));
        queue.request(1, ticks(100));
        queue.observe(NaN);
        queue.observe(ticks(108.99));
        expect(seek).toHaveBeenCalledTimes(1);
        queue.observe(ticks(109));
        expect(seek).toHaveBeenLastCalledWith(ticks(130));
        queue.observe(ticks(109));
        expect(seek).toHaveBeenCalledTimes(2);
        queue.reset();
    });

    it('drops stalled queued work without dispatching overlapping retries, then recovers on acknowledgment', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100));
        queue.request(1, ticks(100));
        vi.advanceTimersByTime(10_000);
        expect(queue.request(1, ticks(100))).toBe(false);
        expect(seek).toHaveBeenCalledTimes(1);
        queue.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(1);
        queue.request(1, ticks(111));
        expect(seek).toHaveBeenLastCalledWith(ticks(121));
        queue.reset();
    });

    it('external seeking invalidates queued offsets without letting later acknowledgment overwrite it', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100));
        queue.request(1, ticks(100));
        queue.invalidate();
        queue.observe(ticks(200));
        expect(queue.request(-1, ticks(200))).toBe(false);
        queue.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(1);
        queue.request(-1, ticks(200));
        expect(seek).toHaveBeenLastCalledWith(ticks(190));
        queue.reset();
    });

    it('clamps pending targets and does not dispatch a redundant boundary seek', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(95), ticks(100));
        queue.request(1, ticks(95), ticks(100));
        queue.observe(ticks(100));
        queue.request(1, ticks(100), ticks(100));
        expect(seek.mock.calls).toEqual([[ticks(100)]]);
        queue.request(-1, ticks(5), ticks(100));
        expect(seek).toHaveBeenLastCalledWith(0);
        queue.reset();
    });

    it('rejects invalid positions and treats invalid duration as unknown', () => {
        const seek = vi.fn();
        const queue = createVideoSeekQueue(seek);
        expect(queue.request(1, NaN)).toBe(false);
        expect(queue.request(1, Infinity)).toBe(false);
        queue.request(1, ticks(100), NaN);
        expect(seek).toHaveBeenLastCalledWith(ticks(110));
        queue.reset();
    });

    it('recovers after a synchronous failure and isolates old rejections from new playback', async () => {
        const seek = vi.fn().mockImplementationOnce(() => {
            throw new Error('seek failed');
        });
        const queue = createVideoSeekQueue(seek);
        expect(queue.request(1, ticks(100))).toBe(false);
        let rejectOld: () => void = () => undefined;
        seek.mockImplementationOnce(() => new Promise((_resolve, reject) => {
            rejectOld = () => reject(new Error('old stream failed'));
        }));
        queue.request(1, ticks(100));
        queue.reset();
        queue.request(1, ticks(200));
        rejectOld();
        await Promise.resolve();
        queue.request(1, ticks(200));
        queue.observe(ticks(210));
        expect(seek).toHaveBeenLastCalledWith(ticks(230));
        queue.reset();
    });

    it('discards queued work after rejection while retaining the outstanding barrier', async () => {
        const seek = vi.fn().mockRejectedValue(new Error('stream failed'));
        const queue = createVideoSeekQueue(seek);
        queue.request(1, ticks(100));
        queue.request(1, ticks(100));
        await Promise.resolve();
        expect(queue.request(1, ticks(100))).toBe(false);
        queue.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(1);
        queue.reset();
    });
});
