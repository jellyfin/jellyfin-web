import { describe, expect, it } from 'vitest';

import { TICKS_PER_SECOND, formatEtaSeconds, ticksToTimeString, timeStringToTicks } from './clipSaverTime';

describe('ticksToTimeString()', () => {
    it('Should format zero ticks to 00:00:00.000', () => {
        expect(ticksToTimeString(0)).toBe('00:00:00.000');
    });

    it('Should format one second correctly', () => {
        expect(ticksToTimeString(TICKS_PER_SECOND)).toBe('00:00:01.000');
    });

    it('Should format milliseconds correctly', () => {
        expect(ticksToTimeString(1500 * 10000)).toBe('00:00:01.500');
    });

    it('Should format hours, minutes and seconds correctly', () => {
        const ticks = (1 * 3600 + 23 * 60 + 45) * TICKS_PER_SECOND;
        expect(ticksToTimeString(ticks)).toBe('01:23:45.000');
    });

    it('Should return 00:00:00.000 for NaN', () => {
        expect(ticksToTimeString(NaN)).toBe('00:00:00.000');
    });

    it('Should return 00:00:00.000 for negative values', () => {
        expect(ticksToTimeString(-1)).toBe('00:00:00.000');
    });
});

describe('timeStringToTicks()', () => {
    it('Should parse one second correctly', () => {
        expect(timeStringToTicks('00:00:01.000')).toBe(TICKS_PER_SECOND);
    });

    it('Should parse without milliseconds', () => {
        expect(timeStringToTicks('00:01:00')).toBe(60 * TICKS_PER_SECOND);
    });

    it('Should return null for invalid strings', () => {
        expect(timeStringToTicks('abc')).toBeNull();
        expect(timeStringToTicks('')).toBeNull();
        expect(timeStringToTicks('1:2:3:4')).toBeNull();
    });

    it('Should return null for minutes >= 60', () => {
        expect(timeStringToTicks('00:60:00')).toBeNull();
    });

    it('Should return null for seconds >= 60', () => {
        expect(timeStringToTicks('00:00:60')).toBeNull();
    });

    it('Should round-trip with ticksToTimeString', () => {
        const ticks = (2 * 3600 + 15 * 60 + 33) * TICKS_PER_SECOND + 250 * 10000;
        expect(timeStringToTicks(ticksToTimeString(ticks))).toBe(ticks);
    });
});

describe('formatEtaSeconds()', () => {
    it('Should format zero as 0:00', () => {
        expect(formatEtaSeconds(0)).toBe('0:00');
    });

    it('Should format minutes and seconds without hours', () => {
        expect(formatEtaSeconds(90)).toBe('1:30');
    });

    it('Should format with hours when >= 3600', () => {
        expect(formatEtaSeconds(3661)).toBe('1:01:01');
    });

    it('Should return --:-- for negative values', () => {
        expect(formatEtaSeconds(-1)).toBe('--:--');
    });
});
