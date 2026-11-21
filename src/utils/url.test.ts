import escapeHtml from 'escape-html';
import { describe, expect, it, vi } from 'vitest';

import { getLocationSearch, getSafeExternalUrl, isValidUrl, safeDecodeURIComponent } from './url';

const mockLocation = (urlString: string) => {
    const url = new URL(urlString);
    vi.spyOn(window, 'location', 'get')
        .mockReturnValue({
            ...window.location,
            hash: url.hash,
            host: url.host,
            hostname: url.hostname,
            href: url.href,
            origin: url.origin,
            pathname: url.pathname,
            port: url.port,
            protocol: url.protocol,
            search: url.search
        });
};

describe('getLocationSearch', () => {
    it('Should work with standard url search', () => {
        mockLocation('https://example.com/path?foo#bar');
        expect(getLocationSearch()).toBe('?foo');
    });

    it('Should work with search in the url hash', () => {
        mockLocation('https://example.com/path#bar?foo');
        expect(getLocationSearch()).toBe('?foo');
    });

    it('Should work with search in the url hash and standard url search', () => {
        mockLocation('https://example.com/path?baz#bar?foo');
        expect(getLocationSearch()).toBe('?foo');
    });

    it('Should return an empty string if there is no search', () => {
        mockLocation('https://example.com');
        expect(getLocationSearch()).toBe('');
    });

    it('Should fallback to the href if there is no hash or search', () => {
        vi.spyOn(window, 'location', 'get')
            .mockReturnValue({
                ...window.location,
                hash: '',
                host: '',
                hostname: '',
                href: 'https://example.com/path#bar?foo',
                origin: '',
                pathname: '',
                port: '',
                protocol: '',
                search: ''
            });
        expect(getLocationSearch()).toBe('?foo');
    });
});

describe('safeDecodeURIComponent', () => {
    it('Should decode a properly encoded URI component', () => {
        expect(safeDecodeURIComponent(encodeURIComponent('Hello, World!'))).toBe('Hello, World!');
    });

    it('Should return the original value if decoding fails', () => {
        expect(safeDecodeURIComponent('Hello, World!%')).toBe('Hello, World!%');
    });
});

describe('getSafeExternalUrl', () => {
    it('Should allow http and https URLs', () => {
        expect(getSafeExternalUrl('http://example.com')).toBe('http://example.com/');
        expect(getSafeExternalUrl('https://www.imdb.com/title/tt0000001/?ref=x#top'))
            .toBe('https://www.imdb.com/title/tt0000001/?ref=x#top');
    });

    it('Should normalize the protocol case', () => {
        expect(getSafeExternalUrl('HTTPS://Example.com/Path')).toBe('https://example.com/Path');
    });

    it('Should reject javascript URLs', () => {
        // eslint-disable-next-line sonarjs/code-eval -- intentionally malicious fixture, asserts it is rejected
        expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull();
        // eslint-disable-next-line sonarjs/code-eval -- intentionally malicious fixture, asserts it is rejected
        expect(getSafeExternalUrl('JaVaScRiPt:alert(1)')).toBeNull();
        expect(getSafeExternalUrl(' \tjavascript:alert(1)')).toBeNull();
        expect(getSafeExternalUrl('java\nscript:alert(1)')).toBeNull();
    });

    it('Should reject data URLs', () => {
        expect(getSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('Should reject vbscript URLs', () => {
        expect(getSafeExternalUrl('vbscript:msgbox(1)')).toBeNull();
    });

    it('Should reject file URLs', () => {
        expect(getSafeExternalUrl('file:///etc/passwd')).toBeNull();
    });

    it('Should reject other non-http protocols', () => {
        expect(getSafeExternalUrl('ftp://example.com/file')).toBeNull();
        expect(getSafeExternalUrl('blob:https://example.com/uuid')).toBeNull();
        expect(getSafeExternalUrl('foo:"><img src=x onerror=alert(1)>')).toBeNull();
    });

    it('Should reject relative and protocol relative URLs', () => {
        expect(getSafeExternalUrl('/web/index.html')).toBeNull();
        expect(getSafeExternalUrl('example.com')).toBeNull();
        expect(getSafeExternalUrl('//example.com')).toBeNull();
        expect(getSafeExternalUrl('#/details?id=1')).toBeNull();
    });

    it('Should reject non-string and empty values', () => {
        expect(getSafeExternalUrl(undefined)).toBeNull();
        expect(getSafeExternalUrl(null)).toBeNull();
        expect(getSafeExternalUrl('')).toBeNull();
        expect(getSafeExternalUrl(42)).toBeNull();
        expect(getSafeExternalUrl({ href: 'https://example.com' })).toBeNull();
        expect(getSafeExternalUrl(new URL('https://example.com'))).toBeNull();
    });

    it('Should percent-encode quotes and angle brackets in the path, query, and fragment', () => {
        const url = getSafeExternalUrl('https://example.com/p"<>?q="<>#f"<>');
        expect(url).toBe('https://example.com/p%22%3C%3E?q=%22%3C%3E#f%22%3C%3E');
    });

    it('Should be safe to use in an href attribute once escaped', () => {
        // URL serialization does not percent-encode a double quote in the host,
        // so the result must still be HTML escaped when used in markup
        const url = getSafeExternalUrl('https://x"autofocus"onfocus="alert(1)/');
        expect(url).not.toBeNull();

        const container = document.createElement('div');
        container.innerHTML = `<a href="${escapeHtml(url ?? '')}">link</a>`;
        const anchor = container.querySelector('a');

        expect(anchor?.getAttributeNames()).toEqual([ 'href' ]);
        expect(anchor?.getAttribute('href')).toBe(url);
        expect(container.querySelector('[onfocus]')).toBeNull();
    });
});

describe('isValidUrl', () => {
    it('Should allow http and https URLs', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
        expect(isValidUrl('https://example.com/pin.txt')).toBe(true);
    });

    it('Should reject invalid URLs and other protocols', () => {
        expect(isValidUrl('not a url')).toBe(false);
        // eslint-disable-next-line sonarjs/code-eval -- intentionally malicious fixture, asserts it is rejected
        expect(isValidUrl('javascript:alert(1)')).toBe(false);
        expect(isValidUrl('file:///config/passwordreset.json')).toBe(false);
    });

    it('Should return false for non-string values without throwing', () => {
        expect(isValidUrl(undefined)).toBe(false);
        expect(isValidUrl(null)).toBe(false);
    });
});
