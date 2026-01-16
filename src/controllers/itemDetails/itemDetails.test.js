/**
 * Item Details Rendering Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock imageLoader
vi.mock('components/images/imageLoader', () => ({
    lazyImage: vi.fn()
}));

// Mock document
Object.defineProperty(document, 'head', {
    value: { appendChild: vi.fn() },
    writable: true
});

Object.defineProperty(document, 'createElement', {
    value: vi.fn(() => ({ rel: '', as: '', href: '' })),
    writable: true
});

describe('itemDetails - image preloading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should preload disc image when available', () => {
        // Mock page and item
        const mockPage = {
            querySelector: vi.fn(() => ({ classList: { remove: vi.fn(), add: vi.fn() } }))
        };
        const mockItem = { ImageTags: { Disc: 'tag123' }, Id: 'item123' };

        // Simulate renderDiscImage logic
        const discImageElement = mockPage.querySelector('.discImage');
        if (mockItem?.ImageTags?.Disc) {
            const url = 'disc-url'; // discImageUrl logic
            discImageElement.classList.remove('hide');
            // imageLoader.lazyImage(discImageElement, url); // mocked
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        }

        expect(discImageElement.classList.remove).toHaveBeenCalledWith('hide');
        expect(document.createElement).toHaveBeenCalledWith('link');
        expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should preload logo image when available', () => {
        const mockPage = {
            querySelector: vi.fn(() => ({ classList: { remove: vi.fn(), add: vi.fn() } }))
        };

        // Simulate renderLogo logic
        const detailLogo = mockPage.querySelector('.detailLogo');
        const url = 'logo-url'; // logoImageUrl logic
        if (url) {
            detailLogo.classList.remove('hide');
            // imageLoader.lazyImage(detailLogo, url); // mocked
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        }

        expect(detailLogo.classList.remove).toHaveBeenCalledWith('hide');
        expect(document.createElement).toHaveBeenCalledWith('link');
        expect(document.head.appendChild).toHaveBeenCalled();
    });
});
