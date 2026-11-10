import { describe, expect, it } from 'vitest';

import { chunk, ensureArray } from './array';

describe('chunk', () => {
    it('splits an array into even chunks', () => {
        expect(chunk([ 1, 2, 3, 4 ], 2)).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('leaves a smaller last chunk', () => {
        expect(chunk([ 1, 2, 3, 4, 5 ], 2)).toEqual([ [ 1, 2 ], [ 3, 4 ], [ 5 ] ]);
    });

    it('returns an empty array for empty input', () => {
        expect(chunk([], 3)).toEqual([]);
    });

    it('returns a single chunk when size exceeds length', () => {
        expect(chunk([ 1, 2 ], 10)).toEqual([ [ 1, 2 ] ]);
    });
});

describe('ensureArray', () => {
    it('returns an empty array for null and undefined', () => {
        expect(ensureArray(null)).toEqual([]);
        expect(ensureArray(undefined)).toEqual([]);
    });

    it('returns the same array when given an array', () => {
        const arr = [ 1, 2 ];
        expect(ensureArray(arr)).toBe(arr);
    });

    it('wraps single values', () => {
        expect(ensureArray('a')).toEqual([ 'a' ]);
        expect(ensureArray(0)).toEqual([ 0 ]);
        expect(ensureArray('')).toEqual([ '' ]);
    });
});
