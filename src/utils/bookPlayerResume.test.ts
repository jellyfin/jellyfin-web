import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ApiClient } from 'jellyfin-apiclient';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBookResumePosition } from './bookPlayerResume';

const { getItem } = vi.hoisted(() => ({ getItem: vi.fn() }));
vi.mock('@jellyfin/sdk/lib/utils/api/library-api', () => ({
    getLibraryApi: () => ({ getItem })
}));
vi.mock('./jellyfin-apiclient/compat', () => ({ toApi: vi.fn() }));

const apiClient = { getCurrentUserId: () => 'reader' } as ApiClient;
const item: BaseItemDto = {
    Id: 'comic',
    UserData: { Key: 'comic', PlaybackPositionTicks: 8360000 }
};

describe('book resume after a missed progress notification', () => {
    beforeEach(() => {
        getItem.mockReset();
    });

    it('uses the saved page instead of a stale details-screen position', async () => {
        getItem.mockResolvedValue({ data: { UserData: { PlaybackPositionTicks: 9600000 } } });
        expect(await getBookResumePosition(apiClient, item, 8360000)).toBe(9600000);
        expect(getItem).toHaveBeenCalledWith({ itemId: 'comic', userId: 'reader' });
    });

    it('preserves a deliberate start from the beginning', async () => {
        expect(await getBookResumePosition(apiClient, item, 0)).toBe(0);
        expect(getItem).not.toHaveBeenCalled();
    });

    it('preserves an explicit position that is not the cached resume value', async () => {
        expect(await getBookResumePosition(apiClient, item, 4200000)).toBe(4200000);
        expect(getItem).not.toHaveBeenCalled();
    });

    it('allows the latest saved page to move backwards', async () => {
        getItem.mockResolvedValue({ data: { UserData: { PlaybackPositionTicks: 7000000 } } });
        expect(await getBookResumePosition(apiClient, item, 8360000)).toBe(7000000);
    });

    it('respects progress cleared on the server', async () => {
        getItem.mockResolvedValue({ data: { UserData: { PlaybackPositionTicks: 0 } } });
        expect(await getBookResumePosition(apiClient, item, 8360000)).toBe(0);
    });

    it('does not silently resume stale progress when the lookup fails', async () => {
        getItem.mockRejectedValue(new Error('Server unavailable'));
        await expect(getBookResumePosition(apiClient, item, 8360000)).rejects.toThrow('Server unavailable');
    });

    it('does not fetch progress for a new book', async () => {
        expect(await getBookResumePosition(apiClient, { Id: 'new-book' })).toBe(0);
        expect(getItem).not.toHaveBeenCalled();
    });
});
