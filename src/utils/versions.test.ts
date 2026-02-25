import { describe, expect, it } from 'vitest';

import { compareVersions, getDisplayVersion } from './versions';

describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
        expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('should return -1 when the first version is lower', () => {
        expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
        expect(compareVersions('1.2.3', '1.3.0')).toBe(-1);
        expect(compareVersions('1.2.3', '2')).toBe(-1);
    });

    it('should return 1 when the first version is higher', () => {
        expect(compareVersions('1.2.4', '1.2.3')).toBe(1);
        expect(compareVersions('1.3.0', '1.2.3')).toBe(1);
        expect(compareVersions('2', '1.2.3')).toBe(1);
    });
});

describe('getDisplayVersion', () => {
    it('should return undefined for null or undefined input', () => {
        expect(getDisplayVersion(null)).toBeUndefined();
        expect(getDisplayVersion(undefined)).toBeUndefined();
    });

    it('should return the full version for versions below 11.0.0', () => {
        expect(getDisplayVersion('10.11.6')).toBe('10.11.6');
    });

    it('should return only major.minor for versions above 10.0.0', () => {
        expect(getDisplayVersion('11.0.0')).toBe('11.0');
        expect(getDisplayVersion('12.3.4')).toBe('12.3');
    });
});
