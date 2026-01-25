import { describe, expect, it } from 'vitest';

import { normalizeServerBaseUrl, resolveApiBaseUrl, type DevConfig } from './devConfig';

describe('normalizeServerBaseUrl', () => {
    it('adds https when protocol is missing', () => {
        expect(normalizeServerBaseUrl('example.com')).toBe('https://example.com');
    });

    it('keeps http and trims trailing slash', () => {
        expect(normalizeServerBaseUrl('http://example.com/')).toBe('http://example.com');
    });

    it('preserves base paths', () => {
        expect(normalizeServerBaseUrl('https://example.com/jellyfin/')).toBe('https://example.com/jellyfin');
    });

    it('returns empty string for blank input', () => {
        expect(normalizeServerBaseUrl('   ')).toBe('');
    });
});

describe('resolveApiBaseUrl', () => {
    it('uses proxy base path in dev when enabled', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://example.com',
            useProxy: true,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, true)).toBe('/__proxy__/jellyfin');
    });

    it('uses server base URL when proxy is disabled', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://example.com/jellyfin',
            useProxy: false,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, true)).toBe('https://example.com/jellyfin');
    });

    it('ignores proxy in production', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://example.com',
            useProxy: true,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, false)).toBe('https://example.com');
    });
});
