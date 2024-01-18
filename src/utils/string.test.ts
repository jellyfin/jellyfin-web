import { describe, expect, it } from 'vitest';

import { toBoolean, toFloat } from './string';

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
