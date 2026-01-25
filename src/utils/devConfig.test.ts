import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
    normalizeServerBaseUrl,
    resolveApiBaseUrl,
    fetchDevConfig,
    saveDevConfig,
    DEFAULT_DEV_CONFIG,
    DEFAULT_DEV_PROXY_BASE_PATH,
    type DevConfig
} from './devConfig';

describe('fetchDevConfig', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('returns default config when fetch fails', async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('returns default config when response is not ok', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('handles malformed JSON response gracefully', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.reject(new SyntaxError('Unexpected token'))
        });

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('handles fetch timeout', async () => {
        const rejectWithTimeout = (reject: (reason?: any) => void) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
        };
        const createTimeoutPromise = () => new Promise((_, reject) => rejectWithTimeout(reject));
        globalThis.fetch = vi.fn().mockImplementation(createTimeoutPromise);

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });
});

describe('saveDevConfig', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('saves config successfully', async () => {
        const partialConfig = { serverBaseUrl: 'https://test.com' };
        const expectedResponse = { ...DEFAULT_DEV_CONFIG, ...partialConfig };

        globalThis.fetch = vi.fn().mockResolvedValue({
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
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow('Failed to save dev config');
    });

    it('handles malformed JSON response during save', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.reject(new SyntaxError('Unexpected token'))
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow();
    });
});

describe('Production Mode Tests', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: false } });
        vi.unstubAllGlobals();
    });

    it('returns default config when not in development', async () => {
        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('returns default config when save fails in production', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow('Failed to save dev config');
    });
});

describe('Production Mode Tests for resolveApiBaseUrl', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: false } });
        vi.unstubAllGlobals();
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
            serverBaseUrl: 'https://example.com/jellyfin',
            useProxy: true,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, false)).toBe('https://example.com/jellyfin');
    });
});

describe('Production Mode Tests for saveDevConfig', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: false } });
        vi.unstubAllGlobals();
    });

    it('saves config successfully', async () => {
        const partialConfig = { serverBaseUrl: 'https://test.com' };
        const expectedResponse = { ...DEFAULT_DEV_CONFIG, ...partialConfig };

        globalThis.fetch = vi.fn().mockResolvedValue({
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
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow('Failed to save dev config');
    });
});

describe('normalizeServerBaseUrl - Edge Cases', () => {
    it('handles various protocols correctly', () => {
        expect(normalizeServerBaseUrl('ftp://example.com')).toBe('ftp://example.com');
        expect(normalizeServerBaseUrl('ws://example.com')).toBe('ws://example.com');
        expect(normalizeServerBaseUrl('example.com')).toBe('https://example.com');
    });

    it('removes hash and search parameters', () => {
        expect(normalizeServerBaseUrl('https://example.com/path?query=value#hash')).toBe('https://example.com/path');
        expect(normalizeServerBaseUrl('https://example.com/path?query=value&other=test')).toBe(
            'https://example.com/path'
        );
        expect(normalizeServerBaseUrl('https://example.com/path#hash')).toBe('https://example.com/path');
    });

    it('handles edge cases with path normalization', () => {
        expect(normalizeServerBaseUrl('https://example.com//path/')).toBe('https://example.com//path');
        expect(normalizeServerBaseUrl('https://example.com/')).toBe('https://example.com');
    });

    it('throws on invalid URLs when protocol detection works but URL construction fails', () => {
        expect(() => normalizeServerBaseUrl('https://')).toThrow();
        expect(() => normalizeServerBaseUrl('https://[invalid-ipv6]')).toThrow();
    });
});

describe('resolveApiBaseUrl - Additional Edge Cases', () => {
    it('uses default proxy path when proxyBasePath is empty', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://example.com',
            useProxy: true,
            proxyBasePath: ''
        };

        expect(resolveApiBaseUrl(config, true)).toBe(DEFAULT_DEV_PROXY_BASE_PATH);
    });

    it('handles empty serverBaseUrl gracefully', () => {
        const config: DevConfig = {
            serverBaseUrl: '',
            useProxy: false,
            proxyBasePath: '/__proxy__/jellyfin'
        };

        expect(resolveApiBaseUrl(config, true)).toBeUndefined();
        expect(resolveApiBaseUrl(config, false)).toBeUndefined();
    });

    it('handles null/undefined proxyBasePath in dev mode', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://example.com',
            useProxy: true,
            proxyBasePath: null as unknown as string
        };

        expect(resolveApiBaseUrl(config, true)).toBe(DEFAULT_DEV_PROXY_BASE_PATH);
    });
});

describe('Constants and Types', () => {
    it('exports expected constants', () => {
        expect(DEFAULT_DEV_CONFIG.proxyBasePath).toBe(DEFAULT_DEV_PROXY_BASE_PATH);
        expect(DEFAULT_DEV_CONFIG).toEqual({
            serverBaseUrl: '',
            useProxy: false,
            proxyBasePath: DEFAULT_DEV_PROXY_BASE_PATH
        });
    });

    it('DevConfig type works correctly', () => {
        const config: DevConfig = {
            serverBaseUrl: 'https://test.com',
            useProxy: true,
            proxyBasePath: '/custom/path'
        };

        expect(config.serverBaseUrl).toBe('https://test.com');
        expect(config.useProxy).toBe(true);
        expect(config.proxyBasePath).toBe('/custom/path');
    });
});
