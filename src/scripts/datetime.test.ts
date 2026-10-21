import { afterEach, describe, expect, it, vi } from 'vitest';

// datetime.js imports globalize, which pulls in a heavy runtime chain that
// relies on webpack-defined globals. isRelativeDay does not use globalize, so
// stub it to keep this unit test isolated.
vi.mock('lib/globalize', () => ({ default: {} }));

import { isRelativeDay } from './datetime';

describe('isRelativeDay', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    const setToday = (year: number, monthIndex: number, day: number) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(year, monthIndex, day, 12, 0, 0));
    };

    it('should throw an error if date is null', () => {
        expect(() => isRelativeDay(null, -1)).toThrowError(new Error('date cannot be null'));
    });

    describe('offset -1 (yesterday)', () => {
        it('should match yesterday within the same month', () => {
            setToday(2025, 7, 15); // Aug 15
            expect(isRelativeDay(new Date(2025, 7, 14), -1)).toBe(true);
        });

        it('should match yesterday across a month boundary', () => {
            setToday(2025, 7, 1); // Aug 1
            expect(isRelativeDay(new Date(2025, 6, 31), -1)).toBe(true); // Jul 31
        });

        it('should match yesterday across a year boundary', () => {
            setToday(2025, 0, 1); // Jan 1, 2025
            expect(isRelativeDay(new Date(2024, 11, 31), -1)).toBe(true); // Dec 31, 2024
        });

        it('should not match a day that is not yesterday', () => {
            setToday(2025, 7, 15);
            expect(isRelativeDay(new Date(2025, 7, 13), -1)).toBe(false);
        });

        it('should ignore the time of day', () => {
            setToday(2025, 7, 15);
            expect(isRelativeDay(new Date(2025, 7, 14, 23, 59, 59), -1)).toBe(true);
        });
    });

    describe('other offsets', () => {
        it('should match today with an offset of 0', () => {
            setToday(2025, 7, 15);
            expect(isRelativeDay(new Date(2025, 7, 15), 0)).toBe(true);
        });

        it('should match tomorrow with an offset of +1', () => {
            setToday(2025, 7, 15);
            expect(isRelativeDay(new Date(2025, 7, 16), 1)).toBe(true);
        });

        it('should match tomorrow across a month boundary with an offset of +1', () => {
            setToday(2025, 7, 31); // Aug 31
            expect(isRelativeDay(new Date(2025, 8, 1), 1)).toBe(true); // Sep 1
        });
    });

    it('should not match the same month and day in a different year', () => {
        setToday(2025, 7, 15);
        expect(isRelativeDay(new Date(2024, 7, 15), -1)).toBe(false);
    });
});
