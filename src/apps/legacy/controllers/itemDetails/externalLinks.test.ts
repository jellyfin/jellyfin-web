import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSafeExternalUrl } from 'utils/url';

import { getExternalLinksHtml } from './externalLinks';

const parse = (links: string[]) => {
    const container = document.createElement('div');
    container.innerHTML = links.join(', ');
    return container;
};

const EXPECTED_ATTRIBUTES = [ 'is', 'class', 'href', 'target', 'rel' ];
const HOST_QUOTE_PAYLOAD = 'https://x"autofocus"onfocus="alert(1)/';

describe('getExternalLinksHtml', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    it('Should render an external link', () => {
        const links = getExternalLinksHtml({ Id: 'a', ExternalUrls: [ { Name: 'IMDb', Url: 'https://example.com' } ] });

        expect(links).toHaveLength(1);
        const anchor = parse(links).querySelector('a');
        expect(anchor?.getAttribute('href')).toBe('https://example.com/');
        expect(anchor?.textContent).toBe('IMDb');
        expect(anchor?.getAttribute('target')).toBe('_blank');
        expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
        expect(anchor?.getAttribute('is')).toBe('emby-linkbutton');
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('Should skip unsafe URLs without logging the URL', () => {
        const links = getExternalLinksHtml({
            Id: 'a',
            // eslint-disable-next-line sonarjs/code-eval -- intentionally malicious fixture, asserts it is rejected
            ExternalUrls: [ { Name: 'Evil', Url: 'javascript:alert(1)' } ]
        });

        expect(links).toEqual([]);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith('[renderLinks] Skipping invalid or unsafe external URL for item', 'a', 'Evil');
        for (const arg of warnSpy.mock.calls.flat()) {
            expect(String(arg)).not.toContain('javascript');
        }
    });

    it('Should escape a host-quote breakout in the URL', () => {
        const links = getExternalLinksHtml({ Id: 'a', ExternalUrls: [ { Name: 'IMDb', Url: HOST_QUOTE_PAYLOAD } ] });

        expect(links).toHaveLength(1);
        const container = parse(links);
        const anchor = container.querySelector('a');
        expect(anchor?.getAttributeNames()).toEqual(EXPECTED_ATTRIBUTES);
        expect(container.querySelector('[onfocus], [autofocus]')).toBeNull();
        expect(anchor?.getAttribute('href')).toBe(getSafeExternalUrl(HOST_QUOTE_PAYLOAD));
    });

    it('Should skip null entries and entries with missing or unsafe URLs', () => {
        let links: string[] = [];
        expect(() => {
            links = getExternalLinksHtml({
                Id: 'a',
                ExternalUrls: [
                    null,
                    undefined,
                    { Name: 'NoUrl' },
                    { Name: 'Data', Url: 'data:text/html,<script>alert(1)</script>' },
                    { Name: 'TMDB', Url: 'https://www.themoviedb.org/movie/1' }
                ]
            });
        }).not.toThrow();

        expect(links).toHaveLength(1);
        const anchor = parse(links).querySelector('a');
        expect(anchor?.textContent).toBe('TMDB');
        expect(anchor?.getAttribute('href')).toBe('https://www.themoviedb.org/movie/1');
        expect(warnSpy).toHaveBeenCalledTimes(4);
        expect(warnSpy).toHaveBeenCalledWith('[renderLinks] Skipping invalid or unsafe external URL for item', 'a', 'Data');
        for (const arg of warnSpy.mock.calls.flat()) {
            expect(String(arg)).not.toContain('data:');
        }
    });

    it('Should escape the link name', () => {
        const links = getExternalLinksHtml({
            Id: 'a',
            ExternalUrls: [ { Name: '<img src=x onerror=alert(1)>', Url: 'https://example.com' } ]
        });

        const container = parse(links);
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('a')?.textContent).toBe('<img src=x onerror=alert(1)>');
    });

    it('Should keep query strings intact after escaping', () => {
        const links = getExternalLinksHtml({ Id: 'a', ExternalUrls: [ { Name: 'IMDb', Url: 'https://example.com/?a=1&b=2' } ] });

        expect(links.join(', ')).toContain('&amp;b=2');
        expect(parse(links).querySelector('a')?.getAttribute('href')).toBe('https://example.com/?a=1&b=2');
    });

    it('Should render nothing for items without links', () => {
        expect(getExternalLinksHtml({ Id: 'a' })).toEqual([]);
        expect(getExternalLinksHtml({ Id: 'a', ExternalUrls: null })).toEqual([]);
        expect(getExternalLinksHtml({ Id: 'a', ExternalUrls: [] })).toEqual([]);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('Should render links in array order', () => {
        const links = getExternalLinksHtml({
            Id: 'a',
            ExternalUrls: [
                { Name: 'IMDb', Url: 'https://imdb.com/' },
                { Name: 'TMDB', Url: 'https://www.themoviedb.org/' }
            ]
        });

        const container = parse(links);
        const texts = Array.from(container.querySelectorAll('a'), anchor => anchor.textContent);
        expect(texts).toEqual([ 'IMDb', 'TMDB' ]);
        expect(container.textContent).toBe('IMDb, TMDB');
    });
});
