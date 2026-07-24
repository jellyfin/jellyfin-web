import { describe, expect, it } from 'vitest';

import { getMutationErrorMessage } from './errorMessage';

describe('getMutationErrorMessage', () => {
    it('extracts nested response messages', () => {
        expect(getMutationErrorMessage({ response: { data: { message: 'Invalid username' } } })).toBe('Invalid username');
        expect(getMutationErrorMessage({ response: { data: { Message: 'Uppercase message' } } })).toBe('Uppercase message');
    });

    it('extracts error instances and trims strings', () => {
        expect(getMutationErrorMessage(new Error('  Boom  '))).toBe('Boom');
        expect(getMutationErrorMessage({ error: { title: 'Bad request' } })).toBe('Bad request');
    });

    it('returns undefined for unsupported, empty, or overly deep values', () => {
        expect(getMutationErrorMessage('   ')).toBeUndefined();
        expect(getMutationErrorMessage(42)).toBeUndefined();
        expect(getMutationErrorMessage({ response: { data: { response: { data: { message: 'too deep' } } } } })).toBeUndefined();
    });
});
