import type { ApiClient } from 'jellyfin-apiclient';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getItemsForPlayback } from './Helper';

const getItemsMock = vi.fn();
const maxQueueItemsMock = vi.fn();

vi.mock('@/lib/jellyfin-apiclient', () => ({
    ServerConnections: { getApi: () => ({}) }
}));

vi.mock('@/lib/jellyfin-apiclient/utils/getItems', () => ({
    getItems: (...args: unknown[]) => getItemsMock(...args)
}));

vi.mock('@/scripts/settings/userSettings', () => ({
    maxQueueItems: () => maxQueueItemsMock()
}));

const apiClient = {
    serverId: () => 'server',
    getCurrentUserId: () => 'user'
} as unknown as ApiClient;

const requestedLimit = () => getItemsMock.mock.calls[0][1].limit;

describe('getItemsForPlayback', () => {
    beforeEach(() => {
        getItemsMock.mockReset();
        getItemsMock.mockResolvedValue({ Items: [] });
        maxQueueItemsMock.mockReset();
    });

    it('uses the maximum queue size setting when no limit is requested', async () => {
        maxQueueItemsMock.mockReturnValue(300);

        await getItemsForPlayback(apiClient, { parentId: 'library' });

        expect(requestedLimit()).toBe(300);
    });

    it('omits the limit when the maximum queue size is 0', async () => {
        maxQueueItemsMock.mockReturnValue(0);

        await getItemsForPlayback(apiClient, { parentId: 'library' });

        expect(requestedLimit()).toBeUndefined();
    });

    it('keeps an explicitly requested limit', async () => {
        maxQueueItemsMock.mockReturnValue(0);

        await getItemsForPlayback(apiClient, { parentId: 'library', limit: 50 });

        expect(requestedLimit()).toBe(50);
    });

    it('does not cut id lists below the legacy limit', async () => {
        maxQueueItemsMock.mockReturnValue(10);

        await getItemsForPlayback(apiClient, { ids: ['a', 'b'] });

        expect(requestedLimit()).toBe(300);
    });
});
