import { describe, expect, it, vi } from 'vitest';

import { getLocationSearch, replaceLocationSearchParam, safeDecodeURIComponent } from './url';

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

describe('replaceLocationSearchParam', () => {
    const mockReplaceState = () => vi.spyOn(window.history, 'replaceState')
        .mockImplementation(() => undefined);

    it('Should add a parameter to the hash search', () => {
        mockLocation('https://example.com/web/#/details?id=1');
        const replaceState = mockReplaceState();

        expect(replaceLocationSearchParam('seasonId', '2')).toBe('/details?id=1&seasonId=2');
        expect(replaceState).toHaveBeenCalledWith(
            null, '', '/web/#/details?id=1&seasonId=2'
        );
    });

    it('Should replace an existing parameter', () => {
        mockLocation('https://example.com/web/#/details?id=1&seasonId=2');
        mockReplaceState();

        expect(replaceLocationSearchParam('seasonId', '3')).toBe('/details?id=1&seasonId=3');
    });

    it('Should remove the parameter if the value is empty', () => {
        mockLocation('https://example.com/web/#/details?id=1&seasonId=2');
        mockReplaceState();

        expect(replaceLocationSearchParam('seasonId')).toBe('/details?id=1');
        expect(replaceLocationSearchParam('seasonId', null)).toBe('/details?id=1');
        expect(replaceLocationSearchParam('seasonId', '')).toBe('/details?id=1');
    });

    it('Should add a search string if the hash has none', () => {
        mockLocation('https://example.com/web/#/details');
        mockReplaceState();

        expect(replaceLocationSearchParam('seasonId', '2')).toBe('/details?seasonId=2');
    });

    it('Should preserve the existing history state', () => {
        mockLocation('https://example.com/web/#/details?id=1');
        const replaceState = mockReplaceState();
        vi.spyOn(window.history, 'state', 'get').mockReturnValue({ idx: 4 });

        replaceLocationSearchParam('seasonId', '2');

        expect(replaceState).toHaveBeenCalledWith({ idx: 4 }, '', expect.any(String));
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
