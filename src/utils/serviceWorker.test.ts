import { afterEach, describe, expect, it, vi } from 'vitest';
import { unregisterServiceWorkers } from './serviceWorker';

describe('unregisterServiceWorkers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('does nothing when service workers are unsupported', async () => {
        vi.stubGlobal('navigator', {});

        await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
    });

    it.each([
        { page: 'https://example.com/index.html', scope: 'https://example.com/', scriptURL: 'https://example.com/serviceworker.js' },
        { page: 'https://example.com/jellyfin/index.html', scope: 'https://example.com/jellyfin/', scriptURL: 'https://example.com/jellyfin/serviceworker.js' }
    ])('only unregisters the legacy Jellyfin worker at $scope', async ({ page, scope, scriptURL }) => {
        vi.spyOn(document, 'baseURI', 'get').mockReturnValue(page);
        const legacyRegistrations = ['active', 'waiting', 'installing'].map(state => ({
            scope,
            active: null,
            waiting: null,
            installing: null,
            [state]: { scriptURL },
            unregister: vi.fn().mockResolvedValue(true)
        }));
        const unrelatedRegistrations = [
            { scope: 'https://example.com/other/', active: { scriptURL: 'https://example.com/other/serviceworker.js' } },
            { scope, active: { scriptURL: 'https://example.com/other/serviceworker.js' } },
            { scope: 'https://example.com/other/', active: { scriptURL } },
            { scope, active: { scriptURL: `${scriptURL}.other` } },
            { scope: `${scope}other/`, active: { scriptURL } },
            { scope, active: null, waiting: null, installing: null }
        ].map(registration => ({
            ...registration,
            unregister: vi.fn().mockResolvedValue(true)
        }));
        const getRegistrations = vi.fn().mockResolvedValue([
            ...legacyRegistrations,
            ...unrelatedRegistrations
        ]);
        vi.stubGlobal('navigator', {
            serviceWorker: { getRegistrations }
        });

        await unregisterServiceWorkers();

        expect(getRegistrations).toHaveBeenCalledOnce();
        for (const registration of legacyRegistrations) {
            expect(registration.unregister).toHaveBeenCalledOnce();
        }
        for (const registration of unrelatedRegistrations) {
            expect(registration.unregister).not.toHaveBeenCalled();
        }
    });

    it('does not reject when registrations cannot be read', async () => {
        const error = new Error('registration lookup failed');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.stubGlobal('navigator', {
            serviceWorker: {
                getRegistrations: vi.fn().mockRejectedValue(error)
            }
        });

        await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
        expect(warn).toHaveBeenCalledWith('Failed to unregister service workers', error);
    });
});
