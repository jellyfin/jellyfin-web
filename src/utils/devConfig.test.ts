import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
    normalizeServerBaseUrl,
    resolveApiBaseUrl,
    fetchDevConfig,
    saveDevConfig,
    DEFAULT_DEV_CONFIG,
    type DevConfig
} from './devConfig';

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

    it('handles malformed server URLs gracefully', () => {
        const config: DevConfig = {
            serverBaseUrl: 'ht tp://invalid url with spaces',
            useProxy: false,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, true)).toBeUndefined();
    });
});

describe('fetchDevConfig', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        vi.unstubAllGlobals();
    });

    it('returns default config when fetch fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('returns default config when response is not ok', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('merges fetched config with defaults', async () => {
        const partialConfig = {
            serverBaseUrl: 'https://test.com',
            useProxy: true
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(partialConfig)
        });

        const result = await fetchDevConfig();
        expect(result).toEqual({
            ...DEFAULT_DEV_CONFIG,
            ...partialConfig
        });
    });
});

describe('saveDevConfig', () => {
    it('saves config successfully', async () => {
        const partialConfig = { serverBaseUrl: 'https://test.com' };
        const expectedResponse = { ...DEFAULT_DEV_CONFIG, ...partialConfig };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(partialConfig)
        });

        const result = await saveDevConfig(partialConfig);
        expect(fetch).toHaveBeenCalledWith('/__dev-config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partialConfig)
        });
        expect(result).toEqual(expectedResponse);
    });

    it('throws error when save fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow('Failed to save dev config');
    });
});
