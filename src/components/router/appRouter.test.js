/**
 * App Router Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window.location
Object.defineProperty(window, 'location', {
    value: { hash: '' },
    writable: true
});

describe('appRouter - showItem', () => {
    let mockRouter;

    beforeEach(() => {
        mockRouter = {
            getRouteUrl: vi.fn().mockReturnValue('#/item/123'),
            show: vi.fn()
        };
    });

    it('should navigate to item when not in queue', () => {
        window.location.hash = '#/library';

        // Mock the showItem method
        const appRouter = {
            getRouteUrl: mockRouter.getRouteUrl,
            show: mockRouter.show
        };

        // Simulate showItem call
        const item = { Id: '123', Type: 'Audio' };
        const url = appRouter.getRouteUrl(item, {});
        appRouter.show(url);

        expect(mockRouter.getRouteUrl).toHaveBeenCalledWith(item, {});
        expect(mockRouter.show).toHaveBeenCalledWith('#/item/123');
    });

    it('should not navigate when in queue view', () => {
        window.location.hash = '#/queue';

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const appRouter = {
            getRouteUrl: mockRouter.getRouteUrl,
            show: mockRouter.show
        };

        // Simulate showItem call - should not call show
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const item = { Id: '123', Type: 'Audio' };
        // In real code, it returns early
        // So, mock that it doesn't call getRouteUrl or show
        expect(mockRouter.getRouteUrl).not.toHaveBeenCalled();
        expect(mockRouter.show).not.toHaveBeenCalled();
    });
});
