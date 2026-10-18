import { describe, expect, it } from 'vitest';

import { getVideoBoxSize } from './videoBox';

const screen = { width: 1920, height: 1080 };

describe('getVideoBoxSize', () => {
    it('should letterbox wide video', () => {
        expect(getVideoBoxSize({ width: 1920, height: 804 }, screen, 'auto')).toEqual({ width: 1920, height: 804 });
        expect(getVideoBoxSize({ width: 3840, height: 1608 }, screen, 'auto')).toEqual({ width: 1920, height: 804 });
    });

    it('should pillarbox narrow video', () => {
        expect(getVideoBoxSize({ width: 768, height: 576 }, screen, 'auto')).toEqual({ width: 1440, height: 1080 });
    });

    it('should cover the container', () => {
        expect(getVideoBoxSize({ width: 1920, height: 804 }, screen, 'cover')).toEqual({ width: 2579, height: 1080 });
    });

    it('should fill the container', () => {
        expect(getVideoBoxSize({ width: 1920, height: 804 }, screen, 'fill')).toBeUndefined();
    });

    it('should fill the container when the video size is unknown', () => {
        expect(getVideoBoxSize({ width: 0, height: 0 }, screen, 'auto')).toBeUndefined();
    });
});
