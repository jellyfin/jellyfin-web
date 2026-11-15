import { describe, expect, it } from 'vitest';

import { DURATION_PRESETS, formatExpiration, getDefaultPreset } from './shareLinkDurations';

describe('shareLinkDurations', () => {
    it('Should offer exactly the 2 hour, 24 hour and 7 day shortcuts', () => {
        expect(DURATION_PRESETS.map(p => p.durationSeconds)).toEqual([7200, 86400, 604800]);
    });

    it('Should not offer a 1 hour shortcut', () => {
        expect(DURATION_PRESETS.some(p => p.durationSeconds === 3600)).toBe(false);
    });

    it('Should default to the 24 hour shortcut', () => {
        expect(getDefaultPreset().durationSeconds).toBe(86400);
    });

    it('Should expose exactly one default preset', () => {
        expect(DURATION_PRESETS.filter(p => p.isDefault)).toHaveLength(1);
    });

    it('Should format the expiration as now plus the duration', () => {
        const now = new Date('2026-01-01T00:00:00Z').getTime();
        const expected = new Date('2026-01-01T02:00:00Z').toLocaleString();

        expect(formatExpiration(7200, now)).toBe(expected);
    });

    it('Should keep all presets within the server duration bounds', () => {
        // ShareLinkTokenService accepts 60..7,776,000 seconds.
        for (const preset of DURATION_PRESETS) {
            expect(preset.durationSeconds).toBeGreaterThanOrEqual(60);
            expect(preset.durationSeconds).toBeLessThanOrEqual(7776000);
        }
    });
});
