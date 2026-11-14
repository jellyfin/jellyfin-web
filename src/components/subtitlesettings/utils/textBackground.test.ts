import { describe, expect, it } from 'vitest';

import { hexToRgba, parseTextBackground } from './textBackground';

describe('hexToRgba', () => {
    it('returns fully transparent color for zero opacity', () => {
        expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
    });

    it('converts opacity from a percentage to a decimal', () => {
        expect(hexToRgba('#000000', 80)).toBe('rgba(0, 0, 0, 0.8)');
        expect(hexToRgba('#000000', 7)).toBe('rgba(0, 0, 0, 0.07)');
    });

    it('converts each hex pair to a color channel', () => {
        expect(hexToRgba('#FF0000', 100)).toBe('rgba(255, 0, 0, 1)');
        expect(hexToRgba('#00FF00', 100)).toBe('rgba(0, 255, 0, 1)');
        expect(hexToRgba('#0000FF', 100)).toBe('rgba(0, 0, 255, 1)');
    });

    it('clamps opacity to 0-100 range', () => {
        expect(hexToRgba('#000000', -10)).toBe('rgba(0, 0, 0, 0)');
        expect(hexToRgba('#000000', 110)).toBe('rgba(0, 0, 0, 1)');
    });
});

describe('parseTextBackground', () => {
    it('returns a transparent background for missing values', () => {
        expect(parseTextBackground()).toEqual({ hex: '#000000', opacity: 0 });
    });

    it('returns a transparent background for legacy transparent value', () => {
        expect(parseTextBackground('transparent')).toEqual({ hex: '#000000', opacity: 0 });
    });

    it('returns a transparent background for parsing failed values', () => {
        expect(parseTextBackground('im groot')).toEqual({ hex: '#000000', opacity: 0 });
        expect(parseTextBackground('rgba(0, 0, 0, 6.9.3)')).toEqual({ hex: '#000000', opacity: 0 });
    });

    it('parses rgba values', () => {
        expect(parseTextBackground('rgba(255, 128, 0, 0.8)')).toEqual({ hex: '#ff8000', opacity: 80 });
    });

    it('parses rgba values without spaces', () => {
        expect(parseTextBackground('rgba(255,128,0,0.8)')).toEqual({ hex: '#ff8000', opacity: 80 });
    });

    it('pads single digit hex channels', () => {
        expect(parseTextBackground('rgba(8, 8, 8, 1)')).toEqual({ hex: '#080808', opacity: 100 });
    });

    it('rounds opacity to a whole percentage', () => {
        expect(parseTextBackground('rgba(0, 0, 0, 0.07)')).toEqual({ hex: '#000000', opacity: 7 });
        expect(parseTextBackground('rgba(0, 0, 0, 2)')).toEqual({ hex: '#000000', opacity: 100 });
    });

    it('reverses hexToRgba', () => {
        for (let opacity = 0; opacity <= 100; opacity++) {
            expect(parseTextBackground(hexToRgba('#696969', opacity))).toEqual({ hex: '#696969', opacity });
        }
    });
});
