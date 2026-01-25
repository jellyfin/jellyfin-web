import { describe, expect, it, vi } from 'vitest';

import { getLocationSearch } from './url';

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
