import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import datetime from './datetime';

describe('parseISO8601Date', () => {
    test('date with timezone parses correctly', () => {
        const dateString = '2010-12-07T11:25:12.135-05:00';
        const dateUtc = new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135));

        // toLocal should not affect the result
        expect(datetime.parseISO8601Date(dateString)).toEqual(dateUtc);
        expect(datetime.parseISO8601Date(dateString, false)).toEqual(dateUtc);
    });

    test('date without timezone and toLocal is true parses as UTC', () => {
        expect(datetime.parseISO8601Date('2010-12-07T11:25:12.135Z')).toEqual(new Date(Date.UTC(2010, 11, 7, 11, 25, 12, 135)));
    });

    // Local timezone is configured in `vitest.setup.ts` to be UTC-05:00
    test('date without timezone and toLocal is false parses as local time', () => {
        expect(datetime.parseISO8601Date('2010-12-07T11:25:12.135Z', false)).toEqual(new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135)));
    });

    test('invalid string throws error', () => {
        expect(() => datetime.parseISO8601Date('2010-12-07')).toThrowError("Couldn't parse ISO 8601 date string '2010-12-07'");
    });
});

describe('getDisplayDuration', () => {
    test('less than a minute rounds to one', () => {
        expect(datetime.getDisplayDuration(0)).toEqual('1m');
        expect(datetime.getDisplayDuration(datetime.ticksPerSecond * 30)).toEqual('1m');
    });

    test('less than an hour displays only minutes', () => {
        expect(datetime.getDisplayDuration(datetime.ticksPerMinute * 30)).toEqual('30m');
        expect(datetime.getDisplayDuration(datetime.ticksPerMinute * 30 + datetime.ticksPerSecond * 30)).toEqual('31m');
    });

    test('more than an hour displays hours and minutes', () => {
        expect(datetime.getDisplayDuration(datetime.ticksPerHour)).toEqual('1h 0m');
        expect(datetime.getDisplayDuration(datetime.ticksPerHour + datetime.ticksPerMinute * 30)).toEqual('1h 30m');
    });
});

describe('getDisplayRunningTime', () => {
    test('less than an hour displays only minutes and seconds', () => {
        expect(datetime.getDisplayRunningTime(0)).toEqual('0:00');
        expect(datetime.getDisplayRunningTime(datetime.ticksPerSecond * 30)).toEqual('0:30');
        expect(datetime.getDisplayRunningTime(datetime.ticksPerMinute * 2 + datetime.ticksPerSecond * 30)).toEqual('2:30');
        expect(datetime.getDisplayRunningTime(datetime.ticksPerMinute * 30)).toEqual('30:00');
    });

    test('more than an hour displays hours, minutes and seconds', () => {
        expect(datetime.getDisplayRunningTime(datetime.ticksPerHour)).toEqual('1:00:00');
        expect(datetime.getDisplayRunningTime(datetime.ticksPerHour + datetime.ticksPerMinute * 30)).toEqual('1:30:00');
    });
});

describe('toLocaleString', () => {
    test('value is null throws error', () => {
        expect(() => datetime.toLocaleString(null)).toThrowError('value cannot be null');
    });

    test('value is undefined throws error', () => {
        expect(() => datetime.toLocaleString(undefined)).toThrowError('value cannot be null');
    });

    test('value is a date converts correctly', () => {
        expect(datetime.toLocaleString(new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135)))).toEqual('12/7/2010, 11:25:12 AM');
    });

    test('value is a number converts correctly', () => {
        expect(datetime.toLocaleString(1250.5)).toEqual('1,250.5');
    });
});

describe('toLocaleDateString', () => {
    test('date is null throws error', () => {
        expect(() => datetime.toLocaleDateString(null)).toThrowError('date cannot be null');
    });

    test('date is undefined throws error', () => {
        expect(() => datetime.toLocaleDateString(undefined)).toThrowError('date cannot be null');
    });

    test('date converts correctly', () => {
        expect(datetime.toLocaleDateString(new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135)))).toEqual('12/7/2010');
    });
});

describe('toLocaleTimeString', () => {
    test('date is null throws error', () => {
        expect(() => datetime.toLocaleTimeString(null)).toThrowError('date cannot be null');
    });

    test('date is undefined throws error', () => {
        expect(() => datetime.toLocaleTimeString(undefined)).toThrowError('date cannot be null');
    });

    test('date with no options returns correct value', () => {
        expect(datetime.toLocaleTimeString(new Date(Date.UTC(2010, 11, 7, 7, 25, 12, 135)))).toEqual('2:25:12 AM');
        expect(datetime.toLocaleTimeString(new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135)))).toEqual('11:25:12 AM');
        expect(datetime.toLocaleTimeString(new Date(Date.UTC(2010, 11, 7, 3, 25, 12, 135)))).toEqual('10:25:12 PM');
    });
});

describe('getDisplayTime', () => {
    test('date is null throws error', () => {
        expect(() => datetime.getDisplayTime(null)).toThrowError('date cannot be null');
    });

    test('date is undefined throws error', () => {
        expect(() => datetime.getDisplayTime(undefined)).toThrowError('date cannot be null');
    });

    test('date returns correct value', () => {
        expect(datetime.getDisplayTime(new Date(Date.UTC(2010, 11, 7, 7, 25, 12, 135)))).toEqual('2:25 AM');
        expect(datetime.getDisplayTime(new Date(Date.UTC(2010, 11, 7, 16, 25, 12, 135)))).toEqual('11:25 AM');
        expect(datetime.getDisplayTime(new Date(Date.UTC(2010, 11, 7, 3, 25, 12, 135)))).toEqual('10:25 PM');
    });

    test('string returns correct value', () => {
        expect(datetime.getDisplayTime('2010-12-07T02:25:12.135-05:00')).toEqual('2:25 AM');
        expect(datetime.getDisplayTime('2010-12-07T11:25:12.135-05:00')).toEqual('11:25 AM');
        expect(datetime.getDisplayTime('2010-12-07T22:25:12.135-05:00')).toEqual('10:25 PM');
    });
});

describe('isRelativeDay', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('date is null throws error', () => {
        expect(() => datetime.isRelativeDay(null, 0)).toThrowError('date cannot be null');
    });

    test('date is undefined throws error', () => {
        expect(() => datetime.isRelativeDay(undefined, 0)).toThrowError('date cannot be null');
    });

    test('date with same day returns true', () => {
        const currentDate = new Date(2023, 10, 10, 10);
        vi.setSystemTime(currentDate);

        const today = new Date(2023, 10, 10, 12);
        expect(datetime.isRelativeDay(today, 0)).toEqual(true);
    });

    test('date in future returns true', () => {
        const currentDate = new Date(2023, 10, 10, 10);
        vi.setSystemTime(currentDate);

        const tomorrow = new Date(2023, 10, 11, 10);
        expect(datetime.isRelativeDay(tomorrow, 0)).toEqual(false);
        expect(datetime.isRelativeDay(tomorrow, 1)).toEqual(true);
    });

    test('date in the future across different months returns true', () => {
        const currentDate = new Date(2023, 10, 30, 10);
        vi.setSystemTime(currentDate);

        const tomorrow = new Date(2023, 11, 1, 10);
        expect(datetime.isRelativeDay(tomorrow, 0)).toEqual(false);
        expect(datetime.isRelativeDay(tomorrow, 1)).toEqual(true);
    });

    test('date in the past returns true', () => {
        const currentDate = new Date(2023, 10, 10, 10);
        vi.setSystemTime(currentDate);

        const yesterday = new Date(2023, 10, 9, 10);
        expect(datetime.isRelativeDay(yesterday, 0)).toEqual(false);
        expect(datetime.isRelativeDay(yesterday, -1)).toEqual(true);
    });

    test('date in the past across different months returns true', () => {
        const currentDate = new Date(2023, 10, 1, 10);
        vi.setSystemTime(currentDate);

        const yesterday = new Date(2023, 9, 31, 10);
        expect(datetime.isRelativeDay(yesterday, 0)).toEqual(false);
        expect(datetime.isRelativeDay(yesterday, -1)).toEqual(true);
    });
});
