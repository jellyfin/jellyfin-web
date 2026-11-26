import { describe, expect, it } from 'vitest';

import { resolveQueueLimit } from './queueLimit';

describe('resolveQueueLimit', () => {
    it('keeps an explicitly requested limit', () => {
        expect(resolveQueueLimit(50, 0, 0)).toBe(50);
        expect(resolveQueueLimit(1000, 0, 300)).toBe(1000);
    });

    it('uses the maximum queue size when no limit is requested', () => {
        expect(resolveQueueLimit(undefined, 0, 300)).toBe(300);
        expect(resolveQueueLimit(undefined, 0, 2000)).toBe(2000);
        expect(resolveQueueLimit(undefined, 0, 10)).toBe(10);
    });

    it('returns no limit when the maximum queue size is 0', () => {
        expect(resolveQueueLimit(undefined, 0, 0)).toBeUndefined();
        expect(resolveQueueLimit(undefined, 500, 0)).toBeUndefined();
    });

    it('never cuts id lists below the legacy limit', () => {
        expect(resolveQueueLimit(undefined, 15, 10)).toBe(300);
        expect(resolveQueueLimit(undefined, 1500, 2000)).toBe(2000);
    });
});
