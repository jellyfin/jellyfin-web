import { describe, expect, it } from 'vitest';

import { codecName, rangeName } from './mediaNames';

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

describe('rangeName', () => {
    it('groups every Dolby Vision type', () => {
        expect(rangeName('DOVIWithEL')).toBe('Dolby Vision');
        expect(rangeName('DOVIWithHDR10')).toBe('Dolby Vision');
    });

    it('names HDR10+ and passes other HDR types through', () => {
        expect(rangeName('HDR10Plus')).toBe('HDR10+');
        expect(rangeName('HLG')).toBe('HLG');
    });

    it('treats missing and unknown ranges as SDR', () => {
        expect(rangeName()).toBe('SDR');
        expect(rangeName('Unknown')).toBe('SDR');
    });
});
