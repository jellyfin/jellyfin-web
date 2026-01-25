import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    normalizeServerBaseUrl,
    resolveApiBaseUrl,
    fetchDevConfig,
    saveDevConfig,
    DEFAULT_DEV_CONFIG,
    DEFAULT_DEV_PROXY_BASE_PATH,
    type DevConfig
} from './devConfig';

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
        global.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        await expect(saveDevConfig({ serverBaseUrl: 'https://test.com' })).rejects.toThrow('Failed to save dev config');
    });
});

describe('Network Error Handling for fetchDevConfig', () => {
    beforeEach(() => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        vi.unstubAllGlobals();
    });

    it('handles malformed JSON response gracefully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.reject(new SyntaxError('Unexpected token'))
        });

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('handles fetch timeout', async () => {
        global.fetch = vi.fn().mockImplementation(() => {
            return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100));
        });

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });

    it('handles network errors during fetch', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await fetchDevConfig();
        expect(result).toEqual(DEFAULT_DEV_CONFIG);
    });
});
