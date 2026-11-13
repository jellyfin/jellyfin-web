import { beforeEach, describe, expect, it, vi } from 'vitest';

const setBackdropsMock = vi.fn();
const backdropParentalRatingLimitMock = vi.fn();

vi.mock('../components/backdrop/backdrop', () => ({
    clearBackdrop: vi.fn(),
    setBackdropImages: vi.fn(),
    setBackdrops: (...args: unknown[]) => setBackdropsMock(...args)
}));

vi.mock('./settings/userSettings', () => ({
    enableBackdrops: vi.fn(() => true),
    backdropParentalRatingLimit: (...args: unknown[]) => backdropParentalRatingLimitMock(...args)
}));

vi.mock('./libraryMenu', () => ({ default: { getTopParentId: vi.fn() } }));
vi.mock('../utils/dashboard', () => ({ pageClassOn: vi.fn() }));
vi.mock('utils/query/queryClient', () => ({ queryClient: { fetchQuery: vi.fn() } }));
vi.mock('apps/dashboard/features/branding/api/useBrandingOptions', () => ({ getBrandingOptionsQuery: vi.fn() }));
vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        currentApiClient: vi.fn(),
        getApi: vi.fn()
    }
}));

describe('autoBackdrops', () => {
    let capturedOptions: Record<string, unknown> | undefined;
    const getItemsMock = vi.fn((_userId: string, options: Record<string, unknown>) => {
        capturedOptions = options;
        return Promise.resolve({ Items: [] });
    });

    function createApiClient() {
        return {
            getCurrentUserId: () => 'test-user',
            getItems: getItemsMock
        };
    }

    beforeEach(() => {
        vi.resetModules();
        getItemsMock.mockClear();
        backdropParentalRatingLimitMock.mockReset();
        capturedOptions = undefined;
    });

    describe('Method: getBackdropItemIds', () => {
        it('should limit global backdrops to PG-13 by default', async () => {
            backdropParentalRatingLimitMock.mockReturnValue(true);
            const { getBackdropItemIds } = await import('./autoBackdrops');

            await getBackdropItemIds(createApiClient(), 'test-user', 'Movie,Series', '');

            expect(getItemsMock).toHaveBeenCalled();
            expect(capturedOptions?.MaxOfficialRating).toBe('PG-13');
        });

        it('should not limit global backdrops when the user disabled the rating limit', async () => {
            backdropParentalRatingLimitMock.mockReturnValue(false);
            const { getBackdropItemIds } = await import('./autoBackdrops');

            await getBackdropItemIds(createApiClient(), 'test-user', 'Movie,Series', '');

            expect(getItemsMock).toHaveBeenCalled();
            expect(capturedOptions?.MaxOfficialRating).toBe('');
        });

        it('should not limit library backdrops even when the rating limit is enabled', async () => {
            backdropParentalRatingLimitMock.mockReturnValue(true);
            const { getBackdropItemIds } = await import('./autoBackdrops');

            await getBackdropItemIds(createApiClient(), 'test-user', 'Movie,Series', 'library-id');

            expect(getItemsMock).toHaveBeenCalled();
            expect(capturedOptions?.MaxOfficialRating).toBe('');
        });
    });
});
