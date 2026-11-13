import { describe, expect, it } from 'vitest';

import { getSafeLocale } from './locale';

describe('getSafeLocale', () => {
    it('Should return undefined for undefined input', () => {
        const result = getSafeLocale(undefined);
        expect(result).toBeUndefined();
    });

    it('Should return the canonical form of a valid locale', () => {
        const result = getSafeLocale('en-us');
        expect(result).toBe('en-US');
    });

    it('Should return the locale as-is if already canonical', () => {
        const result = getSafeLocale('en-GB');
        expect(result).toBe('en-GB');
    });

    it('Should return en-US for invalid locale tags', () => {
        const result = getSafeLocale('invalid-locale-123');
        expect(result).toBe('en-US');
    });

    it('Should return en-US for malformed locale tags', () => {
        const result = getSafeLocale('i');
        expect(result).toBe('en-US');
    });

    it('Should handle complex valid locales', () => {
        const result = getSafeLocale('zh-CN');
        expect(result).toBe('zh-CN');
    });
});
