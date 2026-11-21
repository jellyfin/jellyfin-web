import { describe, expect, it } from 'vitest';

import { isSameLanguage, normalizeLanguage } from './language';

describe('normalizeLanguage', () => {
    it('Should return an empty string for missing or undetermined languages', () => {
        expect(normalizeLanguage()).toBe('');
        expect(normalizeLanguage(null)).toBe('');
        expect(normalizeLanguage('')).toBe('');
        expect(normalizeLanguage('   ')).toBe('');
        expect(normalizeLanguage('und')).toBe('');
    });

    it('Should ignore casing and whitespace', () => {
        expect(normalizeLanguage(' RO ')).toBe('ro');
        expect(normalizeLanguage('Eng')).toBe('en');
    });

    it('Should normalize ISO 639-1, ISO 639-2/T and ISO 639-2/B codes', () => {
        expect(normalizeLanguage('ro')).toBe('ro');
        expect(normalizeLanguage('ron')).toBe('ro');
        expect(normalizeLanguage('rum')).toBe('ro');

        expect(normalizeLanguage('de')).toBe('de');
        expect(normalizeLanguage('deu')).toBe('de');
        expect(normalizeLanguage('ger')).toBe('de');
    });

    it('Should drop the region and script subtags', () => {
        expect(normalizeLanguage('ro-RO')).toBe('ro');
        expect(normalizeLanguage('zh-Hans-CN')).toBe('zh');
        expect(normalizeLanguage('chi')).toBe('zh');
    });

    it('Should keep unknown codes as they are', () => {
        expect(normalizeLanguage('qaa')).toBe('qaa');
    });
});

describe('isSameLanguage', () => {
    it('Should match the different spellings of the same language', () => {
        expect(isSameLanguage('ro', 'rum')).toBe(true);
        expect(isSameLanguage('ron', 'ro-RO')).toBe(true);
        expect(isSameLanguage('en', 'eng')).toBe(true);
        expect(isSameLanguage('ger', 'deu')).toBe(true);
    });

    it('Should not match different languages', () => {
        expect(isSameLanguage('ro', 'en')).toBe(false);
        expect(isSameLanguage('ro', 'ru')).toBe(false);
    });

    it('Should never match unknown languages', () => {
        expect(isSameLanguage()).toBe(false);
        expect(isSameLanguage('', 'eng')).toBe(false);
        expect(isSameLanguage('und', 'und')).toBe(false);
    });
});
