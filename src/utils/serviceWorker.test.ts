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

    it('unregisters every existing service worker registration', async () => {
        const unregisterFirst = vi.fn().mockResolvedValue(true);
        const unregisterSecond = vi.fn().mockResolvedValue(true);
        const getRegistrations = vi.fn().mockResolvedValue([
            { unregister: unregisterFirst },
            { unregister: unregisterSecond }
        ]);
        vi.stubGlobal('navigator', {
            serviceWorker: { getRegistrations }
        });

        await unregisterServiceWorkers();

        expect(getRegistrations).toHaveBeenCalledOnce();
        expect(unregisterFirst).toHaveBeenCalledOnce();
        expect(unregisterSecond).toHaveBeenCalledOnce();
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
