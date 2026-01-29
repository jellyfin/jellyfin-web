import { describe, expect, it } from 'vitest';

import { calculateTotal, calculateUsedPercentage } from './space';

describe('calculateTotal()', () => {
    it('should return the total', () => {
        expect(calculateTotal({ FreeSpace: 1, UsedSpace: 2 })).toBe(3);
    });

    it('should return -1 for invalid used space values', () => {
        expect(calculateTotal({ FreeSpace: 1 })).toBe(-1);
        expect(calculateTotal({ FreeSpace: 1, UsedSpace: -1 })).toBe(-1);
    });

    it('should treat invalid free space values as 0', () => {
        expect(calculateTotal({ UsedSpace: 1 })).toBe(1);
        expect(calculateTotal({ FreeSpace: -1, UsedSpace: 1 })).toBe(1);
    });
});

describe('calculateUsedPercentage', () => {
    it('should return the percentage used', () => {
        expect(calculateUsedPercentage({ FreeSpace: 1, UsedSpace: 3 })).toBe(75);
    });

    it('should return 0 for invalid used space values', () => {
        expect(calculateUsedPercentage({ FreeSpace: 1 })).toBe(0);
        expect(calculateUsedPercentage({ FreeSpace: 1, UsedSpace: -1 })).toBe(0);
    });

    it('should return 100 for invalid free space values', () => {
        expect(calculateUsedPercentage({ UsedSpace: 1 })).toBe(100);
        expect(calculateUsedPercentage({ FreeSpace: -1, UsedSpace: 1 })).toBe(100);
    });
});
