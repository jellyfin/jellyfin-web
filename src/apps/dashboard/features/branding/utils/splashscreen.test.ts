import { describe, expect, it } from 'vitest';

import { isSupportedSplashscreenFile, SPLASHSCREEN_ACCEPT } from './splashscreen';

describe('isSupportedSplashscreenFile()', () => {
    it('should accept image types the server can decode', () => {
        for (const type of [ 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp' ]) {
            expect(isSupportedSplashscreenFile({ type })).toBe(true);
        }
    });

    it('should ignore the case of the type', () => {
        expect(isSupportedSplashscreenFile({ type: 'IMAGE/PNG' })).toBe(true);
    });

    it('should reject image types the server cannot decode', () => {
        for (const type of [ 'image/jxl', 'image/heic', 'image/avif', 'image/svg+xml', 'image/tiff' ]) {
            expect(isSupportedSplashscreenFile({ type })).toBe(false);
        }
    });

    it('should reject files with no type', () => {
        expect(isSupportedSplashscreenFile({ type: '' })).toBe(false);
    });
});

describe('SPLASHSCREEN_ACCEPT', () => {
    it('should list every supported type', () => {
        expect(SPLASHSCREEN_ACCEPT).toBe('image/png,image/jpeg,image/webp,image/gif,image/bmp');
    });
});
