import { describe, expect, it } from 'vitest';

import { getTargetUrl } from './targetUrl';

describe('getTargetUrl', () => {
    it('returns app-relative paths', () => {
        expect(getTargetUrl('/movies?topParentId=abc')).toBe('/movies?topParentId=abc');
    });

    it('allows encoded characters', () => {
        expect(getTargetUrl('/search?query=star%20wars%5C')).toBe('/search?query=star%20wars%5C');
    });

    it.each([
        [ 'missing', undefined ],
        [ 'null', null ],
        [ 'empty', '' ],
        [ 'absolute', 'https://example.com/home' ],
        [ 'protocol-relative', '//example.com/home' ],
        [ 'backslash protocol-relative', '/\\example.com/home' ],
        [ 'relative', 'home' ],
        [ 'tab protocol-relative', '/\t/example.com/home' ],
        [ 'newline protocol-relative', '/\n/example.com/home' ],
        [ 'carriage return', '/\r/example.com/home' ],
        [ 'NUL', '/movies\0/home' ],
        [ 'DEL', '/home\x7f' ],
        [ 'space', '/ /example.com/home' ],
        [ 'backslash', '/movies\\..\\example.com' ]
    ])('falls back to the home page for %s urls', (_, url) => {
        expect(getTargetUrl(url)).toBe('/home');
    });
});
