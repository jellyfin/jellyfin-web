import { describe, expect, it } from 'vitest';
import {
    DEFAULT_TEXT_SCALE,
    LEGACY_TEXT_SIZE_SCALES,
    resolveTextScale,
    getStyles
} from './subtitleappearancehelper';

describe('resolveTextScale', () => {
    it('uses the continuous textScale value when present', () => {
        expect(resolveTextScale({ textScale: 1.65 })).toBe(1.65);
    });

    it('accepts string values that parse to a number', () => {
        expect(resolveTextScale({ textScale: '1.2' })).toBe(1.2);
    });

    it('clamps extreme continuous values', () => {
        expect(resolveTextScale({ textScale: 0.01 })).toBe(0.1);
        expect(resolveTextScale({ textScale: 100 })).toBe(10);
    });

    it('ignores non-finite and negative values', () => {
        expect(resolveTextScale({ textScale: Number.NaN })).toBe(DEFAULT_TEXT_SCALE);
        expect(resolveTextScale({ textScale: -2 })).toBe(DEFAULT_TEXT_SCALE);
    });

    it.each(Object.entries(LEGACY_TEXT_SIZE_SCALES))('maps legacy size "%s" to %s', (legacy, expected) => {
        expect(resolveTextScale({ textSize: legacy })).toBe(expected);
    });

    it('maps an unset legacy size to the previous default', () => {
        expect(resolveTextScale({})).toBe(1.36);
        expect(resolveTextScale({ textSize: '' })).toBe(1.36);
    });

    it('falls back to the default for unknown legacy sizes', () => {
        expect(resolveTextScale({ textSize: 'gigantic' })).toBe(DEFAULT_TEXT_SCALE);
    });

    it('prefers textScale over legacy textSize', () => {
        expect(resolveTextScale({ textScale: 2, textSize: 'smaller' })).toBe(2);
    });
});

describe('getStyles text sizing', () => {
    function getFontSize(settings) {
        const styles = getStyles(settings).text;
        return styles.find((style) => style.name === 'font-size').value;
    }

    it('emits the continuous scale as em units', () => {
        expect(getFontSize({ textScale: 0.9 })).toBe('0.9em');
    });

    it('emits legacy sizes as equivalent em units', () => {
        expect(getFontSize({ textSize: 'extralarge' })).toBe('2.2em');
        expect(getFontSize({})).toBe('1.36em');
    });
});
