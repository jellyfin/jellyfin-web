import { describe, expect, it } from 'vitest';

import { isBlank, isValidUsername, toBoolean, toFloat } from './string';

describe('isBlank', () => {
    it('Should return true if the string is blank', () => {
        let check = isBlank(undefined);
        expect(check).toBe(true);
        check = isBlank(null);
        expect(check).toBe(true);
        check = isBlank('');
        expect(check).toBe(true);
        check = isBlank(' \t\t   ');
        expect(check).toBe(true);
    });

    it('Should return false if the string is not blank', () => {
        const check = isBlank('not an empty string');
        expect(check).toBe(false);
    });
});

describe('toBoolean', () => {
    it('Should return the boolean represented by the string', () => {
        let bool = toBoolean('true');
        expect(bool).toBe(true);

        bool = toBoolean('false', true);
        expect(bool).toBe(false);
    });

    it('Should return default value for invalid values', () => {
        let bool = toBoolean('test');
        expect(bool).toBe(false);

        bool = toBoolean(undefined);
        expect(bool).toBe(false);

        bool = toBoolean(null, true);
        expect(bool).toBe(true);
    });
});

describe('isValidUsername()', () => {
    it('should accept letters, numbers, dashes, underscores, apostrophes, and periods', () => {
        expect(isValidUsername('john')).toBe(true);
        expect(isValidUsername('john.doe')).toBe(true);
        expect(isValidUsername('john-doe')).toBe(true);
        expect(isValidUsername('john_doe')).toBe(true);
        expect(isValidUsername("john'doe")).toBe(true);
        expect(isValidUsername('user123')).toBe(true);
    });

    it('should accept unicode letters and symbols', () => {
        expect(isValidUsername('ñoño')).toBe(true);
        expect(isValidUsername('用户')).toBe(true);
        expect(isValidUsername('Ångström')).toBe(true);
    });

    it('should reject spaces', () => {
        expect(isValidUsername('test user')).toBe(false);
        expect(isValidUsername('test / test')).toBe(false);
    });

    it('should reject special characters not in the allowed set', () => {
        expect(isValidUsername('test/test')).toBe(false);
        expect(isValidUsername('test+test')).toBe(false);
        expect(isValidUsername('test&test')).toBe(false);
        expect(isValidUsername('test@test')).toBe(false);
    });

    it('should reject empty strings', () => {
        expect(isValidUsername('')).toBe(false);
    });
});

describe('toFloat()', () => {
    it('Should return a float', () => {
        const number = toFloat('3.14159');
        expect(number).toBe(3.14159);
    });

    it('Should return default value for NaN', () => {
        let number = toFloat('test');
        expect(number).toBe(0);

        number = toFloat(undefined);
        expect(number).toBe(0);

        number = toFloat(null, -1);
        expect(number).toBe(-1);
    });
});
