import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isMobileBrowser } from './detectMobile';

describe('detectMobile', () => {
    let originalNavigator: typeof navigator;

    beforeEach(() => {
        originalNavigator = global.navigator;
    });

    afterEach(() => {
        global.navigator = originalNavigator;
    });

    describe('Android detection', () => {
        it('should detect Android user agent', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should detect Android case-insensitive', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Linux; android 11)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });
    });

    describe('iOS detection', () => {
        it('should detect iPhone', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should detect iPad', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should detect iPod', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_7_1 like Mac OS X)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should not detect iPad on macOS (Macintosh pattern)', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) Macintosh',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(false);
        });
    });

    describe('Windows Phone detection', () => {
        it('should detect Windows Phone', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should detect Windows Phone case-insensitive', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (windows phone 10.0)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });

        it('should prioritize Windows Phone over Android', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });
    });

    describe('Desktop detection', () => {
        it('should not detect desktop browser', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(false);
        });

        it('should not detect macOS as mobile', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(false);
        });

        it('should not detect Linux as mobile', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(false);
        });
    });

    describe('vendor fallback', () => {
        it('should use vendor property if userAgent is unavailable', () => {
            (global.navigator as any) = {
                userAgent: '',
                vendor: 'Google Inc.'
            };

            expect(isMobileBrowser()).toBe(false);
        });

        it('should use vendor property for user agent detection', () => {
            (global.navigator as any) = {
                userAgent: undefined,
                vendor: 'Android'
            };

            expect(isMobileBrowser()).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle empty user agent', () => {
            (global.navigator as any) = {
                userAgent: '',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(false);
        });

        it('should handle undefined properties', () => {
            (global.navigator as any) = {
                userAgent: undefined,
                vendor: undefined
            };

            const result = isMobileBrowser();
            expect(typeof result).toBe('boolean');
        });

        it('should handle mixed case in user agent', () => {
            (global.navigator as any) = {
                userAgent: 'Mozilla/5.0 (Linux; AnDrOiD 11)',
                vendor: ''
            };

            expect(isMobileBrowser()).toBe(true);
        });
    });
});
