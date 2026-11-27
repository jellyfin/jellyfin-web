import { describe, expect, it } from 'vitest';

import { normalizeServerAddress } from './serverAddress';

describe('normalizeServerAddress', () => {
    it.each([
        [ 'surrounding whitespace', ' https://host:8096/ ', 'https://host:8096' ],
        [ 'a trailing slash after a path', 'https://host/jellyfin/', 'https://host/jellyfin' ],
        [ 'repeated trailing slashes', 'https://host///', 'https://host' ],
        [ 'tabs and newlines', '\thost:8096\n', 'host:8096' ]
    ])('removes %s', (_, input, expected) => {
        expect(normalizeServerAddress(input)).toBe(expected);
    });

    it('keeps the address otherwise as entered, without adding a protocol', () => {
        expect(normalizeServerAddress('host:8096')).toBe('host:8096');
        expect(normalizeServerAddress('https://host//jellyfin')).toBe('https://host//jellyfin');
    });

    it.each([
        [ 'empty', '' ],
        [ 'whitespace only', '   ' ],
        [ 'slashes only', ' // ' ]
    ])('returns an empty string for %s input', (_, input) => {
        expect(normalizeServerAddress(input)).toBe('');
    });
});
