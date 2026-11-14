import { describe, expect, it } from 'vitest';

import { codecName } from './mediaNames';

describe('codecName', () => {
    it('uses common names for known codecs', () => {
        expect(codecName('h264')).toBe('H.264');
        expect(codecName('HEVC')).toBe('HEVC');
        expect(codecName('av1')).toBe('AV1');
    });

    it('falls back to upper case for other codecs', () => {
        expect(codecName('prores')).toBe('PRORES');
    });

    it('returns an empty string when there is no codec', () => {
        expect(codecName()).toBe('');
    });
});
