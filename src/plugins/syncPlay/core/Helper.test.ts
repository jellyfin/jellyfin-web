import { afterEach, describe, expect, it, vi } from 'vitest';

import { waitForEventOnce } from './Helper';

describe('SyncPlay Helper', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('removes the event listener after timing out', async () => {
        vi.useFakeTimers();
        const emitter: { _callbacks?: Record<string, unknown[]> } = {};
        const eventPromise = waitForEventOnce(emitter, 'ready', 100);
        const rejection = expect(eventPromise).rejects.toThrow('Timed out.');

        expect(emitter._callbacks?.ready).toHaveLength(1);

        await vi.advanceTimersByTimeAsync(100);
        await rejection;

        expect(emitter._callbacks?.ready).toHaveLength(0);
    });
});
