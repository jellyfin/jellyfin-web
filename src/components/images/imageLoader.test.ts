import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fillImage, lazyImage } from './imageLoader';
import * as userSettings from '../../scripts/settings/userSettings';

vi.mock('./blurhash.worker.ts', () => ({
    default: class {
        addEventListener() { /* No blurhash work is needed for image loading. */ }
    }
}));
vi.mock('../../scripts/settings/userSettings', () => ({
    enableFastFadein: vi.fn(() => false)
}));

describe('lazy image loading', () => {
    let preloader: HTMLImageElement;
    let frames: FrameRequestCallback[];
    const url = 'https://example.com/poster.jpg';

    beforeEach(() => {
        vi.mocked(userSettings.enableFastFadein).mockReturnValue(false);
        preloader = document.createElement('img');
        Object.defineProperties(preloader, {
            complete: { configurable: true, value: false },
            naturalWidth: { configurable: true, value: 0 }
        });
        vi.stubGlobal('Image', class {
            constructor() {
                return preloader;
            }
        });
        frames = [];
        vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function finishFrame() {
        frames.splice(0).forEach(callback => {
            callback(0);
        });
    }

    function setCachedImage(width = 200) {
        Object.defineProperties(preloader, {
            complete: { configurable: true, value: true },
            naturalWidth: { configurable: true, value: width }
        });
    }

    describe.each(['img', 'div'])('%s thumbnails', tagName => {
        let target: HTMLElement;

        beforeEach(() => {
            target = document.createElement(tagName);
            target.setAttribute('data-src', url);
        });

        function expectVisibleImage() {
            if (tagName === 'img') {
                expect(target).toHaveAttribute('src', url);
            } else {
                expect(target.style.backgroundImage).toContain(url);
            }
            expect(target).not.toHaveAttribute('data-src');
            expect(target).not.toHaveClass('lazy-hidden');
        }

        it('reveals an asynchronously loaded image', () => {
            lazyImage(target);
            expect(target).toHaveClass('lazy-hidden');
            expect(frames).toHaveLength(0);

            preloader.dispatchEvent(new Event('load'));
            finishFrame();

            expectVisibleImage();
            expect(target).toHaveClass('lazy-image-fadein');
        });

        it('reveals a cached image without waiting for a load event', () => {
            setCachedImage();
            lazyImage(target);
            finishFrame();

            expectVisibleImage();
        });

        it('applies a cached image only once when load also fires', () => {
            setCachedImage();
            lazyImage(target);
            preloader.dispatchEvent(new Event('load'));

            expect(frames).toHaveLength(1);
            finishFrame();
            expectVisibleImage();
        });

        it('registers the load handler before assigning the source', () => {
            Object.defineProperty(preloader, 'src', {
                set() {
                    setCachedImage();
                    preloader.dispatchEvent(new Event('load'));
                }
            });
            lazyImage(target);

            expect(frames).toHaveLength(1);
            finishFrame();
            expectVisibleImage();
        });

        it('preserves the placeholder and retry source for a failed cached image', () => {
            setCachedImage(0);
            lazyImage(target);
            preloader.dispatchEvent(new Event('error'));

            expect(frames).toHaveLength(0);
            expect(target).toHaveClass('lazy-hidden');
            expect(target).toHaveAttribute('data-src', url);
            expect(target).not.toHaveClass('lazy-image-fadein');
        });

        it('reloads a cached thumbnail after scrolling away and back', () => {
            lazyImage(target);
            preloader.dispatchEvent(new Event('load'));
            finishFrame();

            fillImage({ target, isIntersecting: false });
            expect(target).toHaveClass('lazy-hidden');
            expect(target).toHaveAttribute('data-src', url);

            setCachedImage();
            fillImage({ target, isIntersecting: true });
            finishFrame();

            expectVisibleImage();
        });

        it('uses the fast fade-in setting for cached images', () => {
            vi.mocked(userSettings.enableFastFadein).mockReturnValue(true);
            setCachedImage();
            lazyImage(target);
            finishFrame();

            expectVisibleImage();
            expect(target).toHaveClass('lazy-image-fadein-fast');
        });
    });
});
