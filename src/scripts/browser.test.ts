import { describe, expect, it } from 'vitest';

import { detectBrowser } from './browser';

describe('Browser', () => {
    it('should identify TitanOS devices', () => {
        // Ref: https://docs.titanos.tv/user-agents-specifications
        // Philips example
        let browser = detectBrowser('Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.4147.62 Safari/537.36 OPR/46.0.2207.0 OMI/4.24, TV_NT72690_2025_4K /<SW version> (Philips, <CTN>, wired) CE-HTML/1.0 NETTV/4.6.0.8 SignOn/2.0 SmartTvA/5.0.0 TitanOS/3.0 en Ginga');
        expect(browser.titanos).toBe(true);
        expect(browser.operaTv).toBeFalsy();
        expect(browser.safari).toBeFalsy();
        expect(browser.webkitGtk).toBeFalsy();
        expect(browser.tv).toBe(true);

        // JVC example
        browser = detectBrowser('Mozilla/5.0 (Linux ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36 OMI/4.24.3.93.MIKE.227 Model/Vestel-MB190 VSTVB MB100 FVC/9.0 (VESTEL; MB190; ) HbbTV/1.7.1 (+DRM; VESTEL; MB190; 0.9.0.0; ; _TV__2025;) TitanOS/3.0 (Vestel MB190 VESTEL) SmartTvA/3.0.0');
        expect(browser.titanos).toBe(true);
        expect(browser.operaTv).toBeFalsy();
        expect(browser.safari).toBeFalsy();
        expect(browser.webkitGtk).toBeFalsy();
        expect(browser.tv).toBe(true);
    });

    it('should identify Vega devices', () => {
        // Ref: https://developer.amazon.com/docs/vega/0.21/webview-development-best-practices-tv.html#avoid-relying-on-the-useragent
        const browser = detectBrowser('Mozilla/5.0 (Linux; Kepler 1.1; AFTCA002 user/1234; wv) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Chrome/130.0.6723.192 Safari/537.36');
        expect(browser.vega).toBe(true);
        expect(browser.chrome).toBeFalsy();
        expect(browser.safari).toBeFalsy();
        expect(browser.webkitGtk).toBeFalsy();
        expect(browser.mobile).toBeFalsy();
        expect(browser.tv).toBe(true);
    });

    it('should identify Xbox devices', () => {
        const browser = detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0 WebView2 Xbox');
        expect(browser.xboxOne).toBe(true);
        expect(browser.tv).toBe(true);
    });

    it('should identify Safari browsers', () => {
        let browser = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15');
        expect(browser.safari).toBe(true);
        expect(browser.webkit).toBe(true);
        expect(browser.osx).toBe(true);
        expect(browser.versionMajor).toBe(17);
        expect(browser.version).toBe('17.2.1');
        expect(browser.webkitGtk).toBeFalsy();

        browser = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');
        expect(browser.safari).toBe(true);
        expect(browser.webkit).toBe(true);
        expect(browser.iphone).toBe(true);
        expect(browser.mobile).toBe(true);
        expect(browser.versionMajor).toBe(17);
        expect(browser.webkitGtk).toBeFalsy();
    });

    it('should identify WebKitGTK browsers', () => {
        let browser = detectBrowser('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Epiphany/45.0 Safari/605.1.15');
        expect(browser.webkitGtk).toBe(true);
        expect(browser.webkit).toBe(true);
        expect(browser.safari).toBeFalsy();
        expect(browser.versionMajor).toBe(17);

        browser = detectBrowser('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/60.5 Safari/605.1.15');
        expect(browser.webkitGtk).toBe(true);
        expect(browser.webkit).toBe(true);
        expect(browser.safari).toBeFalsy();
        expect(browser.versionMajor).toBe(60);
    });
});
