import { describe, expect, it, vi } from 'vitest';

import { getReadableSize, readFileAsText } from './file';

describe('getReadableSize()', () => {
    it('should return correct units', () => {
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

    it('should return correct precision', () => {
        expect(getReadableSize(12345, 0)).toBe('12 KiB');
        expect(getReadableSize(12345, 2)).toBe('12.06 KiB');
        expect(getReadableSize(12345, 3)).toBe('12.056 KiB');
    });

    it('should handle zero bytes', () => {
        expect(getReadableSize(0)).toBe('0.0 Bytes');
    });

    it('should handle negative values', () => {
        expect(getReadableSize(-1)).toBe('-1.0 Bytes');
    });
});

describe('readFileAsText()', () => {
    it('should read file as text', async () => {
        const fileContent = 'test content';
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const file = new File([blob], 'test.txt');

        const result = await readFileAsText(file);
        expect(result).toBe(fileContent);
    });

    it('should handle empty file', async () => {
        const file = new File([], 'empty.txt');
        const result = await readFileAsText(file);
        expect(result).toBe('');
    });

    it('should handle unicode content', async () => {
        const unicodeContent = 'Hello 🌍 World';
        const blob = new Blob([unicodeContent], { type: 'text/plain' });
        const file = new File([blob], 'unicode.txt');

        const result = await readFileAsText(file);
        expect(result).toBe(unicodeContent);
    });
});
