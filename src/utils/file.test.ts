import { describe, expect, it } from 'vitest';
import { getReadableSize } from './file';

describe('getReadableSize()', () => {
    it('should return the correct units', () => {
        expect(getReadableSize(5)).toBe('5.0 Bytes');
        expect(getReadableSize(1024)).toBe('1.0 KiB');
        expect(getReadableSize(1024 * 1024)).toBe('1.0 MiB');
        expect(getReadableSize(1024 * 1024 * 1024)).toBe('1.0 GiB');
        expect(getReadableSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TiB');
        expect(getReadableSize(1024 * 1024 * 1024 * 1024 * 1024)).toBe('1.0 PiB');
        expect(getReadableSize(1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('1.0 EiB');
        expect(getReadableSize(1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('1.0 ZiB');
        expect(getReadableSize(1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('1.0 YiB');
    });

    it('should return the correct precision', () => {
        expect(getReadableSize(12345, 0)).toBe('12 KiB');
        expect(getReadableSize(12345, 2)).toBe('12.06 KiB');
        expect(getReadableSize(12345, 3)).toBe('12.056 KiB');
    });
});
