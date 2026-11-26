import { describe, expect, it, vi } from 'vitest';

import { type Browser, detectBrowser } from './browser';
import {
    applyBaselineEnvironment,
    BASELINE_USER_AGENT,
    installEnvironment,
    loadFreshBrowser,
    removeWindowProp,
    restoreEnvironment,
    setWindowProp,
    silenceConsole,
    stubAnimate,
    stubDivStyle,
    stubNavigator,
    stubNoDocument
} from './browser.fixtures';
import { USER_AGENT_CORPUS } from './__fixtures__/userAgents';

/**
 * Characterization suite for src/scripts/browser.js.
 *
 * Every test runs in a deterministic environment (see applyBaselineEnvironment in browser.fixtures.ts): no
 * `ontouchstart`, no `window.tizen`, no `animate`, `maxTouchPoints` 0, empty `platform` and `appVersion` and a
 * fixed `navigator.userAgent`. jsdom would otherwise report `'ontouchstart' in window` as true, which hides the
 * non-touch paths. Results are read as records so that tests can also probe keys that are not (or should not be) part of the Browser type.
 */

type Result = Record<string, unknown>;

// Interfaces have no implicit index signature, hence the double cast (no runtime change).
const detect = (userAgent: string): Result => detectBrowser(userAgent) as unknown as Result;

/** Result without the `supportsCssAnimation` function, for whole-object comparisons. */
const withoutFunction = (result: Browser | Result): Result => {
    const rest: Result = { ...result };
    Reflect.deleteProperty(rest, 'supportsCssAnimation');
    return rest;
};

const chromeUA = (version: string) => `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
const web0sChromeUA = (version: string) => `Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 WebAppManager`;
const web0sWebkitUA = (version: string) => `Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/${version} (KHTML, like Gecko) Safari/${version}`;
const tizenUA = (version: string) => `Mozilla/5.0 (SMART-TV; Linux; Tizen ${version}) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/108.0.5359.1 TV Safari/537.36`;
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1';
const MAC_SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';

describe('Browser', () => {
    installEnvironment();

    describe('device identification (original tests)', () => {
        it('should identify TitanOS devices', () => {
            // Ref: https://docs.titanos.tv/user-agents-specifications
            // Philips example
            let browser = detect('Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.4147.62 Safari/537.36 OPR/46.0.2207.0 OMI/4.24, TV_NT72690_2025_4K /<SW version> (Philips, <CTN>, wired) CE-HTML/1.0 NETTV/4.6.0.8 SignOn/2.0 SmartTvA/5.0.0 TitanOS/3.0 en Ginga');
            expect(browser.titanos).toBe(true);
            expect(browser).not.toHaveProperty('operaTv');
            expect(browser).not.toHaveProperty('safari');
            expect(browser.tv).toBe(true);

            // JVC example
            browser = detect('Mozilla/5.0 (Linux ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36 OMI/4.24.3.93.MIKE.227 Model/Vestel-MB190 VSTVB MB100 FVC/9.0 (VESTEL; MB190; ) HbbTV/1.7.1 (+DRM; VESTEL; MB190; 0.9.0.0; ; _TV__2025;) TitanOS/3.0 (Vestel MB190 VESTEL) SmartTvA/3.0.0');
            expect(browser.titanos).toBe(true);
            expect(browser).not.toHaveProperty('operaTv');
            expect(browser).not.toHaveProperty('safari');
            expect(browser.tv).toBe(true);
        });

        it('should identify Vega devices', () => {
            // Ref: https://developer.amazon.com/docs/vega/0.21/webview-development-best-practices-tv.html#avoid-relying-on-the-useragent
            const browser = detect('Mozilla/5.0 (Linux; Kepler 1.1; AFTCA002 user/1234; wv) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Chrome/130.0.6723.192 Safari/537.36');
            expect(browser.vega).toBe(true);
            expect(browser).not.toHaveProperty('chrome');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('mobile');
            expect(browser.tv).toBe(true);
        });

        it('should identify Xbox devices', () => {
            const browser = detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0 WebView2 Xbox');
            expect(browser.xboxOne).toBe(true);
            expect(browser.tv).toBe(true);
        });

        it('should identify Samsung Tizen TV devices', () => {
            // 2024 Samsung TV (Tizen 8.0)
            const browser = detect('Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/108.0.5359.1 TV Safari/537.36');
            expect(browser.tizen).toBe(true);
            expect(browser.tizenVersion).toBe(8);
            expect(browser.tv).toBe(true);
            expect(browser).not.toHaveProperty('mobile');
        });

        it('should not identify Samsung Browser (Android) as a TV', () => {
            // Ref: https://developer.samsung.com/browser/user-agent-string-format.html
            const browser = detect('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36');
            expect(browser.android).toBe(true);
            expect(browser.mobile).toBe(true);
            expect(browser.tizen).toBe(false);
            expect(browser.tv).toBe(false);
        });
    });

    describe('baseline environment', () => {
        it('should start every test with the deterministic baseline', () => {
            expect('ontouchstart' in window).toBe(false);
            expect('tizen' in window).toBe(false);
            expect(navigator.userAgent).toBe(BASELINE_USER_AGENT);
            expect(Reflect.get(navigator, 'platform')).toBe('');
            expect(Reflect.get(navigator, 'appVersion')).toBe('');
            expect(Reflect.get(navigator, 'maxTouchPoints')).toBe(0);
            expect(document.documentElement.animate).toBeUndefined();
        });

        it('should restore stubs between tests (part 1: change everything)', () => {
            stubNavigator('platform', 'iPhone');
            setWindowProp('ontouchstart', null);
            setWindowProp('tizen', {});
            stubAnimate();
            stubNoDocument();
            expect(Reflect.get(navigator, 'platform')).toBe('iPhone');
            expect('tizen' in window).toBe(true);
        });

        it('should restore stubs between tests (part 2: nothing leaked)', () => {
            expect(Reflect.get(navigator, 'platform')).toBe('');
            expect('ontouchstart' in window).toBe(false);
            expect('tizen' in window).toBe(false);
            expect(document).toBeDefined();
            expect(document.documentElement.animate).toBeUndefined();
        });

        it('should restore the jsdom ontouchstart property', () => {
            // The baseline removes ontouchstart; restoreEnvironment must put jsdom's own property back.
            expect(Object.getOwnPropertyDescriptor(window, 'ontouchstart')).toBeUndefined();
            restoreEnvironment();
            expect(Object.getOwnPropertyDescriptor(window, 'ontouchstart')).toBeDefined();
            applyBaselineEnvironment();
        });
    });

    describe('uaMatch precedence', () => {
        // Each row removes the highest priority token of the previous row.
        const tokens = ['edg/1.0', 'edga/2.0', 'edgios/3.0', 'edge/4.0', 'titanos/5.0', 'opera/6.0', 'opr/7.0', 'chrome/8.0', 'safari/9.0', 'firefox/10.0'];
        const keys = ['edg', 'edga', 'edgios', 'edge', 'titanos', 'opera', 'opera', 'chrome', 'safari', 'firefox'];

        it.each(tokens.map((_, i) => i))('should pick the browser at priority %i first', (index) => {
            const ua = `mozilla/5.0 ${tokens.slice(index).join(' ')}`;
            const browser = detect(ua);
            const version = tokens[index].split('/')[1];

            expect(browser[keys[index]]).toBe(true);
            expect(browser.version).toBe(version);
            expect(browser.versionMajor).toBe(parseInt(version, 10));
            // The 'opr' token is renamed to 'opera' so the 'opr' key never exists
            expect(browser).not.toHaveProperty('opr');
            expect(browser).not.toHaveProperty('mozilla');
        });

        it('should identify edgeChromium for edg, edga and edgios', () => {
            expect(detect('edg/1.0').edgeChromium).toBe(true);
            expect(detect('edga/1.0').edgeChromium).toBe(true);
            expect(detect('edgios/1.0').edgeChromium).toBe(true);
            expect(detect('edge/1.0').edgeChromium).toBeUndefined();
        });

        it('should not let edga match the edg pattern', () => {
            const browser = detect('mozilla/5.0 edga/117.0');
            expect(browser.edga).toBe(true);
            expect(browser).not.toHaveProperty('edg');
        });

        it.each([
            ['space separator', 'edg 1.2', '1.2'],
            ['slash separator', 'edg/1.2', '1.2']
        ])('should accept a %s between token and version', (_name, ua, version) => {
            const browser = detect(ua);
            expect(browser.edg).toBe(true);
            expect(browser.version).toBe(version);
        });

        it.each(['edg-1.0', 'edgx/1', 'edge-foo/1'])('should not match "%s"', (ua) => {
            const browser = detect(ua);
            expect(browser).not.toHaveProperty('edg');
            expect(browser).not.toHaveProperty('edge');
        });

        it('should lowercase the user agent before matching', () => {
            const browser = detect('CHROME/120.0 TV');
            expect(browser.chrome).toBe(true);
            expect(browser.tv).toBe(true);
        });

        it('should fall back to mozilla with the rv version', () => {
            const browser = detect('mozilla/5.0 (x11; rv:109.0) gecko/20100101');
            expect(browser.mozilla).toBe(true);
            expect(browser.version).toBe('109.0');
            expect(browser.versionMajor).toBe(109);
        });

        it('should fall back to mozilla version "0" without rv', () => {
            const browser = detect('mozilla/5.0 (x11) gecko');
            expect(browser.mozilla).toBe(true);
            expect(browser.version).toBe('0');
            expect(browser.versionMajor).toBe(0);
        });

        it('should not match mozilla when the UA says "compatible"', () => {
            const browser = detect('mozilla/5.0 (compatible; msie 10.0; windows nt 6.2; trident/6.0)');
            expect(browser).not.toHaveProperty('mozilla');
            expect(browser).not.toHaveProperty('version');
            expect(browser).not.toHaveProperty('versionMajor');
            expect(browser.windows).toBe(true);
            expect(browser).not.toHaveProperty('safari');
        });

        it('should set no browser, version or platform key for an empty user agent', () => {
            const browser = detect('');
            expect(withoutFunction(browser)).toStrictEqual({
                edgeChromium: undefined,
                osx: false,
                ps4: false,
                xboxOne: false,
                animate: false,
                hisense: false,
                tizen: false,
                vega: false,
                vidaa: false,
                web0s: false,
                tv: false,
                operaTv: false,
                edgeUwp: undefined,
                orsay: false,
                keyboard: false,
                iOS: undefined
            });
            expect(browser.supportsCssAnimation).toBeTypeOf('function');
        });
    });

    describe('version parsing', () => {
        it.each([
            ['chrome/120', '120', 120],
            // eslint-disable-next-line sonarjs/no-hardcoded-ip
            ['chrome/120.0.1.2', '120.0.1.2', 120],
            ['chrome 120', '120', 120],
            ['chrome/abc', 'abc', 0],
            ['chrome/.5', '.5', 0],
            ['opera mini/7', 'mini', 0]
        ])('should parse "%s" as version %j with major %i', (ua, version, major) => {
            const browser = detect(ua);
            expect(browser.version).toBe(version);
            expect(browser.versionMajor).toBe(major);
        });

        it('should let a Version/ token override the product version', () => {
            const browser = detect('mozilla/5.0 (linux; android 10; wv) applewebkit/537.36 version/4.0 chrome/117.0.0.0 mobile safari/537.36');
            expect(browser.chrome).toBe(true);
            expect(browser.version).toBe('4.0');
            expect(browser.versionMajor).toBe(4);
        });

        it('should ignore a Version/ token without a version number', () => {
            const browser = detect('version/ chrome/5');
            expect(browser.version).toBe('5');
        });

        it('should use Version/ even for the mozilla fallback', () => {
            const browser = detect('mozilla version/9.9');
            expect(browser.mozilla).toBe(true);
            expect(browser.version).toBe('9.9');
            expect(browser.versionMajor).toBe(9);
        });

        // The trim() after the Motorola strip is unobservable: no regex is anchored and versions are [\w.]+.
        it('should match a user agent with surrounding whitespace', () => {
            const browser = detect('  chrome/1  ');
            expect(browser.chrome).toBe(true);
            expect(browser.version).toBe('1');
        });
    });

    describe('platform', () => {
        it('should prefer ipad over iphone, windows, android and titanos', () => {
            const browser = detect('mozilla/5.0 ipad iphone windows android titanos');
            expect(browser.ipad).toBe(true);
            expect(browser).not.toHaveProperty('iphone');
            expect(browser).not.toHaveProperty('windows');
            expect(browser).not.toHaveProperty('android');
            expect(browser.iOS).toBe(true);
        });

        it.each([
            ['iphone', 'mozilla/5.0 iphone windows android', 'iphone'],
            ['windows', 'mozilla/5.0 windows android', 'windows'],
            ['android', 'mozilla/5.0 android titanos', 'android']
        ])('should pick %s by priority', (_name, ua, key) => {
            const browser = detect(ua);
            expect(browser[key]).toBe(true);
            for (const other of ['ipad', 'iphone', 'windows', 'android']) {
                if (other !== key) {
                    expect(browser).not.toHaveProperty(other);
                }
            }
        });

        it('should set titanos as a platform key together with another browser', () => {
            const browser = detect('mozilla/5.0 edg/1.0 titanos/3.0');
            expect(browser.edg).toBe(true);
            expect(browser.titanos).toBe(true);
            expect(browser.tv).toBe(true);
        });

        it('should set no platform key when nothing matches', () => {
            const browser = detect('chrome/1');
            for (const key of ['ipad', 'iphone', 'windows', 'android', 'titanos']) {
                expect(browser).not.toHaveProperty(key);
            }
        });

        it('should clear the platform for legacy Edge', () => {
            const browser = detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041');
            expect(browser.edge).toBe(true);
            expect(browser.version).toBe('18.19041');
            expect(browser).not.toHaveProperty('windows');
            expect(browser).not.toHaveProperty('chrome');
            expect(browser).not.toHaveProperty('safari');
            expect(browser.edgeChromium).toBeUndefined();
            expect(browser.edgeUwp).toBe(false);
        });

        it('should keep the platform for Chromium Edge', () => {
            const browser = detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0');
            expect(browser.edg).toBe(true);
            expect(browser.windows).toBe(true);
            expect(browser.edgeChromium).toBe(true);
        });

        it('should classify a Windows Phone UA as an iPhone', () => {
            const browser = detect('Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 520) like iPhone OS 7_0_3 Mac OS X AppleWebKit/537 (KHTML, like Gecko) Mobile Safari/537');
            expect(browser.iphone).toBe(true);
            expect(browser).not.toHaveProperty('windows');
            expect(browser).not.toHaveProperty('android');
            expect(browser.iOS).toBe(true);
            expect(browser.osx).toBe(true);
        });
    });

    describe('Motorola Edge workaround', () => {
        const MOTOROLA = 'Mozilla/5.0 (Linux; Android 12; motorola edge 5g uw (2021)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36';

        it('should not identify the Motorola Edge phone as the Edge browser', () => {
            const browser = detect(MOTOROLA);
            expect(browser.chrome).toBe(true);
            expect(browser.android).toBe(true);
            expect(browser).not.toHaveProperty('edge');
            expect(browser.mobile).toBe(true);
            expect(browser.slow).toBe(true);
            expect(browser.edgeUwp).toBeUndefined();
        });

        it('should identify Edge when the "motorola " prefix is missing', () => {
            const browser = detect(MOTOROLA.replace('motorola ', ''));
            expect(browser.edge).toBe(true);
            expect(browser).not.toHaveProperty('android');
        });

        it('should only strip the first occurrence', () => {
            const browser = detect('motorola edge motorola edge/1.0');
            expect(browser.edge).toBe(true);
            expect(browser.version).toBe('1.0');
        });

        it('should not strip a double space', () => {
            const browser = detect('motorola  edge/1.0');
            expect(browser.edge).toBe(true);
        });

        it('should strip "motorola edge" even when a version follows it', () => {
            const browser = detect('motorola edge/1');
            expect(browser).not.toHaveProperty('edge');
        });
    });

    describe('safari fallback and osx', () => {
        it.each([
            ['chrome', 'applewebkit chrome/1'],
            ['edg', 'applewebkit edg/1'],
            ['edga', 'applewebkit edga/1'],
            ['edgios', 'applewebkit edgios/1'],
            ['edge', 'applewebkit edge/1'],
            ['opera', 'applewebkit opera/1'],
            ['opr', 'applewebkit opr/1']
        ])('should not apply the webkit safari fallback for %s', (_name, ua) => {
            expect(detect(ua)).not.toHaveProperty('safari');
        });

        it.each([
            ['firefox', 'applewebkit firefox/1'],
            ['mozilla', 'applewebkit mozilla/5.0'],
            ['nothing', 'applewebkit']
        ])('should apply the webkit safari fallback for %s', (_name, ua) => {
            expect(detect(ua).safari).toBe(true);
        });

        it('should not set safari without webkit or a safari token', () => {
            expect(detect('mozilla/5.0 gecko')).not.toHaveProperty('safari');
        });

        it('should identify Chrome on iOS as safari without a chrome key', () => {
            const browser = detect('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1');
            expect(browser.safari).toBe(true);
            expect(browser).not.toHaveProperty('chrome');
            expect(browser.iphone).toBe(true);
            expect(browser.osx).toBe(true);
        });

        it('should detect "mac os x" in any position', () => {
            expect(detect('x mac os x y').osx).toBe(true);
            expect(detect('x macos y').osx).toBe(false);
        });
    });

    describe('iPad workaround for desktop-mode iPadOS', () => {
        it('should flag an iPad when a Mac UA reports more than one touch point', () => {
            stubNavigator('maxTouchPoints', 2);
            const browser = detect(MAC_SAFARI_UA);
            expect(browser.ipad).toBe(true);
            expect(browser.iOS).toBe(true);
            expect(browser).not.toHaveProperty('mobile');
            expect(browser).not.toHaveProperty('slow');
        });

        it.each([1, 0, undefined, NaN])('should not flag an iPad with maxTouchPoints %s', (points) => {
            stubNavigator('maxTouchPoints', points);
            const browser = detect(MAC_SAFARI_UA);
            expect(browser).not.toHaveProperty('ipad');
            expect(browser.iOS).toBeUndefined();
        });

        it('should not flag an iPad for non-osx user agents', () => {
            stubNavigator('maxTouchPoints', 5);
            expect(detect(chromeUA('120.0'))).not.toHaveProperty('ipad');
        });

        it('should not add ipad for an iPhone UA', () => {
            stubNavigator('maxTouchPoints', 5);
            const browser = detect(IPHONE_UA);
            expect(browser).not.toHaveProperty('ipad');
            expect(browser.iphone).toBe(true);
        });

        it('should keep ipad for an iPad UA', () => {
            stubNavigator('maxTouchPoints', 5);
            const browser = detect('Mozilla/5.0 (iPad; CPU OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1');
            expect(browser.ipad).toBe(true);
        });
    });

    describe('mobile and slow', () => {
        it.each(['mobi', 'ipad', 'iphone', 'ipod', 'silk', 'gt-p1000', 'nexus 7', 'kindle fire', 'opera mini'])('should treat "%s" as mobile', (term) => {
            const browser = detect(`mozilla/5.0 ${term}`);
            expect(browser.mobile).toBe(true);
            expect(browser.slow).toBe(true);
        });

        it('should treat "mobile safari" as mobile through the mobi substring', () => {
            expect(detect('mozilla/5.0 mobile safari/1').mobile).toBe(true);
        });

        it('should not set mobile to false', () => {
            const browser = detect(chromeUA('120.0'));
            expect(browser).not.toHaveProperty('mobile');
            expect(browser).not.toHaveProperty('slow');
        });

        it('should keep mobile for Tizen user agents containing "mobile"', () => {
            const browser = detect('Mozilla/5.0 (Linux; Tizen 2.3; SAMSUNG SM-Z130H) AppleWebKit/537.3 (KHTML, like Gecko) Version/2.3 Mobile Safari/537.3');
            expect(browser.tizen).toBe(true);
            expect(browser.mobile).toBe(true);
            expect(browser.tv).toBe(false);
        });

        it('should set slow for tv only, mobile only and both', () => {
            expect(detect('mozilla tv').slow).toBe(true);
            expect(detect('mozilla mobi').slow).toBe(true);
            expect(detect('mozilla tv mobi').slow).toBe(true);
        });

        it('should keep slow for Vega through the tv flag after deleting mobile', () => {
            const browser = detect('Mozilla/5.0 (Linux; Kepler 1.1; wv) AppleWebKit/537.36 Mobile Chrome/130.0.0.0 Safari/537.36');
            expect(browser).not.toHaveProperty('mobile');
            expect(browser.slow).toBe(true);
        });
    });

    describe('device flags', () => {
        it('should identify the PlayStation 4', () => {
            const browser = detect('mozilla/5.0 (playstation 4 5.55) applewebkit/601.2 (khtml, like gecko)');
            expect(browser.ps4).toBe(true);
            expect(browser.tv).toBe(true);
            expect(browser.keyboard).toBe(true);
            expect(browser.slow).toBe(true);
            expect(browser.mozilla).toBe(true);
            expect(browser.version).toBe('0');
            expect(browser.safari).toBe(true);
        });

        it('should not identify the PlayStation 5 as a ps4 or tv', () => {
            const browser = detect('mozilla/5.0 (playstation 5)');
            expect(browser.ps4).toBe(false);
            expect(browser.tv).toBe(false);
        });

        it('should identify hisense and vidaa without implying tv', () => {
            const hisense = detect('mozilla/5.0 hisense');
            expect(hisense.hisense).toBe(true);
            expect(hisense.tv).toBe(false);
            const vidaa = detect('mozilla/5.0 vidaa');
            expect(vidaa.vidaa).toBe(true);
            expect(vidaa.tv).toBe(false);
        });

        it('should identify kepler as vega and tv', () => {
            const browser = detect('mozilla/5.0 kepler');
            expect(browser.vega).toBe(true);
            expect(browser.tv).toBe(true);
        });

        it('should identify xbox as tv with a keyboard', () => {
            const browser = detect('mozilla/5.0 xbox');
            expect(browser.xboxOne).toBe(true);
            expect(browser.tv).toBe(true);
            expect(browser.keyboard).toBe(true);
        });

        it.each([
            ['smart-tv', true],
            ['hbbtv', true],
            ['viera', true],
            ['titanos', true],
            ['netcast', true],
            ['web0s', true],
            ['plain', false]
        ])('should evaluate tv for "%s"', (token, tv) => {
            silenceConsole();
            expect(detect(`mozilla/5.0 ${token}`).tv).toBe(tv);
        });

        it('should never treat the Oculus browser as a tv through the substring rules', () => {
            expect(detect('mozilla/5.0 oculusbrowser').tv).toBe(false);
            expect(detect('mozilla/5.0 oculusbrowser tv').tv).toBe(false);
            expect(detect('mozilla/5.0 oculusbrowser viera').tv).toBe(false);
        });

        it.each(['xbox', 'playstation 4', 'kepler'])('should let "%s" override the Oculus tv exclusion', (token) => {
            expect(detect(`mozilla/5.0 oculusbrowser ${token}`).tv).toBe(true);
        });

        it('should identify operaTv for tv with opr and not otherwise', () => {
            expect(detect('mozilla/5.0 smart-tv opr/1').operaTv).toBe(true);
            expect(detect('mozilla/5.0 smart-tv').operaTv).toBe(false);
            expect(detect('mozilla/5.0 opr/1').operaTv).toBe(false);
            expect(detect('mozilla/5.0 smart-tv opera/1').operaTv).toBe(false);
            // Needs "opr/" with a slash, although uaMatch also accepts "opr 1"
            const spaced = detect('mozilla/5.0 smart-tv opr 1');
            expect(spaced.opera).toBe(true);
            expect(spaced.operaTv).toBe(false);
        });

        describe('edgeUwp', () => {
            it.each(['msapphost', 'webview'])('should be true for legacy edge with "%s"', (token) => {
                expect(detect(`mozilla/5.0 edge/18.1 ${token}`).edgeUwp).toBe(true);
            });

            it.each(['msapphost', 'webview2'])('should be true for chromium edge with "%s"', (token) => {
                expect(detect(`mozilla/5.0 edg/142.0 ${token}`).edgeUwp).toBe(true);
            });

            it('should be false for edge without a marker', () => {
                expect(detect('mozilla/5.0 edge/18.1').edgeUwp).toBe(false);
                expect(detect('mozilla/5.0 edg/142.0').edgeUwp).toBe(false);
            });

            it('should be undefined (not false) for other browsers, even with a marker', () => {
                const browser = detect('mozilla/5.0 chrome/1 webview');
                expect(browser).toHaveProperty('edgeUwp', undefined);
                expect(browser.edgeUwp).toBeUndefined();
            });
        });
    });

    describe('branch chain (web0s, tizen, titanos, vega, other)', () => {
        it('should let web0s win over tizen and not parse a tizen version', () => {
            setWindowProp('tizen', {});
            const browser = detect('mozilla/5.0 (web0s; tizen) applewebkit/537.36 chrome/94.0 safari/537.36');
            expect(browser.web0s).toBe(true);
            expect(browser.tizen).toBe(true);
            expect(browser).not.toHaveProperty('tizenVersion');
            expect(browser.web0sVersion).toBe(23);
        });

        it('should delete chrome and safari and omit orsay for web0s', () => {
            const browser = detect(web0sChromeUA('94.0.4606.128'));
            expect(browser).not.toHaveProperty('chrome');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('orsay');
            expect(browser.version).toBe('94.0.4606.128');
            expect(browser.versionMajor).toBe(94);
        });

        it('should delete chrome and safari and omit orsay for tizen', () => {
            const browser = detect(tizenUA('6.5'));
            expect(browser).not.toHaveProperty('chrome');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('orsay');
            expect(browser).not.toHaveProperty('web0sVersion');
            expect(browser.version).toBe('108.0.5359.1');
            expect(browser.versionMajor).toBe(108);
        });

        it('should delete operaTv and safari for titanos but keep other keys', () => {
            const browser = detect('Mozilla/5.0 (Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/46.0 TitanOS/3.0');
            expect(browser.titanos).toBe(true);
            expect(browser.tv).toBe(true);
            expect(browser).not.toHaveProperty('operaTv');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('orsay');
            expect(browser).not.toHaveProperty('web0sVersion');
            expect(browser).not.toHaveProperty('tizenVersion');
        });

        it('should enter the titanos branch when titanos is only the platform', () => {
            // edg outranks titanos in uaMatch, so titanos/3.0 only sets the platform key.
            const browser = detect('mozilla/5.0 edg/1.0 titanos/3.0');
            expect(browser.edg).toBe(true);
            expect(browser.titanos).toBe(true);
            expect(browser).not.toHaveProperty('operaTv');
            expect(browser).not.toHaveProperty('orsay');
        });

        it('should let tizen win over titanos', () => {
            const browser = detect('Mozilla/5.0 Tizen 5.0 titanos/3.0 safari/1 opr/2');
            expect(browser.tizenVersion).toBe(5);
            expect(browser.titanos).toBe(true);
            expect(browser.operaTv).toBe(true);
            expect(browser).not.toHaveProperty('safari');
        });

        it('should delete chrome, safari and mobile for vega but keep operaTv', () => {
            const browser = detect('Mozilla/5.0 (Linux; Kepler 1.1; wv) AppleWebKit/537.36 Mobile Chrome/130.0.0.0 Safari/537.36 OPR/1');
            expect(browser.vega).toBe(true);
            expect(browser).not.toHaveProperty('chrome');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('mobile');
            expect(browser.operaTv).toBe(true);
            expect(browser).not.toHaveProperty('orsay');
        });

        it('should delete a safari key for vega (WebKit UA without a Chrome token)', () => {
            const browser = detect('Mozilla/5.0 (Linux; Kepler 1.1) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36');
            expect(browser.vega).toBe(true);
            expect(browser.version).toBe('537.36');
            expect(browser).not.toHaveProperty('safari');
            expect(browser).not.toHaveProperty('chrome');
        });

        it('should let titanos win over vega and skip the vega deletions', () => {
            const browser = detect('Mozilla/5.0 (Linux; Kepler 1.1) AppleWebKit/537.36 Mobile Chrome/130.0.0.0 Safari/537.36 TitanOS/3.0');
            expect(browser.vega).toBe(true);
            expect(browser.titanos).toBe(true);
            // titanos outranks chrome in uaMatch, so no chrome key exists to be deleted
            expect(browser).not.toHaveProperty('chrome');
            expect(browser.mobile).toBe(true);
            expect(browser).not.toHaveProperty('safari');
        });

        it('should set orsay only in the final branch', () => {
            silenceConsole();
            expect(detect('mozilla/5.0 smarthub').orsay).toBe(true);
            expect(detect('mozilla/5.0 plain').orsay).toBe(false);
            for (const ua of ['web0s smarthub', 'Tizen 5.0 smarthub', 'titanos smarthub', 'kepler smarthub']) {
                expect(detect(ua)).not.toHaveProperty('orsay');
            }
        });
    });

    describe('tizen', () => {
        it('should be set from window.tizen as well as from the user agent', () => {
            setWindowProp('tizen', {});
            expect(detect(web0sChromeUA('94.0')).tizen).toBe(true);
            removeWindowProp('tizen');
            expect(detect(tizenUA('5.0')).tizen).toBe(true);
            expect(detect(chromeUA('120.0')).tizen).toBe(false);
        });

        it.each([null, undefined])('should treat window.tizen = %s as absent', (value) => {
            setWindowProp('tizen', value);
            expect(detect(chromeUA('120.0')).tizen).toBe(false);
        });

        // A web0s UA is used because the tizen branch would throw for a UA without "Tizen X.Y" (see known quirks).
        it.each([0, '', false])('should treat window.tizen = %j as present (loose null check)', (value) => {
            setWindowProp('tizen', value);
            expect(detect(web0sChromeUA('94.0')).tizen).toBe(true);
        });

        it.each([
            ['2.3', 2.3],
            ['3.0', 3],
            ['4.0', 4],
            ['5.0', 5],
            ['5.5', 5.5],
            ['6.0', 6],
            ['6.5', 6.5],
            ['6.5.1', 6.5],
            ['7.0', 7],
            ['8.0', 8],
            ['10.0', 10],
            ['12.3', 12.3]
        ])('should parse Tizen %s as tizenVersion %d', (text, expected) => {
            expect(detect(tizenUA(text)).tizenVersion).toBe(expected);
        });

        it('should keep the version parsed from the Chrome token', () => {
            const browser = detect(tizenUA('8.0'));
            expect(browser.version).toBe('108.0.5359.1');
            expect(browser.tv).toBe(true);
            expect(browser.slow).toBe(true);
        });

        it('should accept any character between major and minor (unescaped dot)', () => {
            expect(detect('Tizen 8x0').tizenVersion).toBe(8);
            expect(detect('Tizen 5x5').tizenVersion).toBe(5.5);
            expect(detect('Tizen 8 0').tizenVersion).toBe(8);
        });
    });

    describe('webOS version', () => {
        describe('Chrome based engines', () => {
            it.each([
                [999, 25],
                [120, 25],
                [119, 24],
                [108, 24],
                [107, 23],
                [94, 23],
                [93, 22],
                [87, 22],
                [86, 6],
                [79, 6],
                [78, 5],
                [68, 5],
                [67, 4],
                [53, 4],
                [52, 3],
                [38, 3],
                [37, 2],
                [34, 2],
                [33, 1],
                [26, 1]
            ])('should map Chrome %i to webOS %i', (major, webos) => {
                const { warn, error } = silenceConsole();
                const browser = detect(web0sChromeUA(`${major}.0.0.0`));
                expect(browser.web0s).toBe(true);
                expect(browser.web0sVersion).toBe(webos);
                expect(warn).not.toHaveBeenCalled();
                expect(error).not.toHaveBeenCalled();
            });

            it.each([25, 0, 1])('should log an error and leave web0sVersion undefined for Chrome %i', (major) => {
                const { warn, error } = silenceConsole();
                const browser = detect(web0sChromeUA(`${major}.0.0.0`));
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
                expect(error).toHaveBeenCalledWith('Unable to detect webOS version');
                expect(warn).not.toHaveBeenCalled();
            });

            it('should log an error for a non-numeric Chrome version (major 0)', () => {
                const { error } = silenceConsole();
                const browser = detect(web0sChromeUA('abc'));
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
            });
        });

        describe('webkit based apps (no Chrome token)', () => {
            it.each([
                ['539.1', 2],
                ['538.2', 2],
                ['537.36', 1]
            ])('should map WebKit %s to webOS %i', (version, webos) => {
                const { error } = silenceConsole();
                const browser = detect(web0sWebkitUA(version));
                expect(browser.web0sVersion).toBe(webos);
                expect(error).not.toHaveBeenCalled();
            });

            it('should log an error for WebKit 536', () => {
                const { error } = silenceConsole();
                const browser = detect(web0sWebkitUA('536.0'));
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledWith('Unable to detect webOS version');
            });

            it('should log an error when no version is present at all', () => {
                const { error } = silenceConsole();
                const browser = detect('web0s');
                expect(browser.web0s).toBe(true);
                expect(browser).not.toHaveProperty('versionMajor');
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
            });

            it('should log an error for an Opera token (non-chrome branch compares against 538/537)', () => {
                const { error } = silenceConsole();
                const browser = detect('mozilla/5.0 (web0s) opr/120.0');
                expect(browser.opera).toBe(true);
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
            });

            it('should use Version/ over Chrome for the webOS lookup', () => {
                const { error } = silenceConsole();
                const browser = detect('mozilla/5.0 (web0s) chrome/120.0 version/4.0 safari/537.36');
                // chrome flag is deleted afterwards, but it was set while the version was computed from Version/
                expect(browser.versionMajor).toBe(4);
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
            });
        });

        describe('NetCast', () => {
            const NETCAST = 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36 NetCast.TV-2013';

            it('should warn and return undefined when navigator.userAgent contains netcast', () => {
                const { warn, error } = silenceConsole();
                stubNavigator('userAgent', NETCAST);
                const browser = detect(NETCAST);
                expect(browser.web0s).toBe(true);
                expect(browser.tv).toBe(true);
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(warn).toHaveBeenCalledTimes(1);
                expect(warn).toHaveBeenCalledWith('Unable to detect webOS version - NetCast');
                expect(error).not.toHaveBeenCalled();
            });

            it('should match netcast in navigator.userAgent case-insensitively', () => {
                const { warn } = silenceConsole();
                stubNavigator('userAgent', 'NetCast');
                detect(web0sChromeUA('94.0'));
                expect(warn).toHaveBeenCalledTimes(1);
            });

            it('should not warn when navigator.userAgent has no netcast, even if the argument does', () => {
                const { warn } = silenceConsole();
                const browser = detect(NETCAST);
                expect(browser.web0sVersion).toBe(3);
                expect(warn).not.toHaveBeenCalled();
            });

            it('should skip the netcast warning for non-chrome user agents', () => {
                const { warn, error } = silenceConsole();
                stubNavigator('userAgent', NETCAST);
                const browser = detect(web0sWebkitUA('538.2'));
                expect(browser.web0sVersion).toBe(2);
                expect(warn).not.toHaveBeenCalled();
                expect(error).not.toHaveBeenCalled();
            });
        });

        it('should not compute a webOS version for non-web0s user agents', () => {
            const { warn, error } = silenceConsole();
            expect(detect(chromeUA('120.0'))).not.toHaveProperty('web0sVersion');
            expect(warn).not.toHaveBeenCalled();
            expect(error).not.toHaveBeenCalled();
        });
    });

    describe('touch and keyboard', () => {
        it('should have no touch and no keyboard on a plain desktop in the baseline', () => {
            const browser = detect(chromeUA('120.0'));
            expect(browser).not.toHaveProperty('touch');
            expect(browser.keyboard).toBe(false);
        });

        it('should set touch when ontouchstart exists in window (any value)', () => {
            setWindowProp('ontouchstart', null);
            const browser = detect(chromeUA('120.0'));
            expect(browser.touch).toBe(true);
            expect(browser.keyboard).toBe(true);
        });

        it.each([
            [1, true],
            [2, true],
            [0, false],
            [undefined, false]
        ])('should evaluate touch for maxTouchPoints %s', (points, touch) => {
            stubNavigator('maxTouchPoints', points);
            const browser = detect(chromeUA('120.0'));
            if (touch) {
                expect(browser.touch).toBe(true);
            } else {
                expect(browser).not.toHaveProperty('touch');
            }
        });

        it('should still take touch from maxTouchPoints when document is undefined', () => {
            stubNoDocument();
            stubNavigator('maxTouchPoints', 1);
            expect(detect(chromeUA('120.0')).touch).toBe(true);
        });

        it('should not set touch from ontouchstart when document is undefined', () => {
            setWindowProp('ontouchstart', null);
            stubNoDocument();
            const browser = detect(chromeUA('120.0'));
            expect(browser).not.toHaveProperty('touch');
            expect(browser.keyboard).toBe(false);
        });

        it.each([
            ['xbox', 'mozilla/5.0 xbox'],
            ['playstation 4', 'mozilla/5.0 playstation 4'],
            ['edgeUwp', 'mozilla/5.0 edge/18.1 msapphost'],
            ['tv', 'mozilla/5.0 smart-tv']
        ])('should have a keyboard without touch for %s', (_name, ua) => {
            const browser = detect(ua);
            expect(browser).not.toHaveProperty('touch');
            expect(browser.keyboard).toBe(true);
        });

        it('should return a strict boolean for keyboard', () => {
            expect(detect('mozilla/5.0 plain').keyboard).toBe(false);
            setWindowProp('ontouchstart', null);
            expect(detect('mozilla/5.0 plain').keyboard).toBe(true);
        });
    });

    describe('animate', () => {
        it('should be false when documentElement.animate is missing', () => {
            expect(detect(chromeUA('120.0')).animate).toBe(false);
        });

        it('should be true when documentElement.animate exists', () => {
            stubAnimate();
            expect(detect(chromeUA('120.0')).animate).toBe(true);
        });

        it('should use a loose null check', () => {
            stubAnimate(null);
            expect(detect('x').animate).toBe(false);
            stubAnimate(0);
            expect(detect('x').animate).toBe(true);
            stubAnimate(false);
            expect(detect('x').animate).toBe(true);
        });

        it('should be false when document is undefined', () => {
            stubNoDocument();
            expect(detect('x').animate).toBe(false);
        });
    });

    describe('supportsCssAnimation', () => {
        it('should be the same function for every detection result', () => {
            const a = detect('x');
            const b = detect('y');
            expect(a.supportsCssAnimation).toBeTypeOf('function');
            expect(a.supportsCssAnimation).toBe(b.supportsCssAnimation);
        });

        it('should report support in jsdom (animationName is an empty string)', async () => {
            const { default: browser } = await loadFreshBrowser();
            expect(browser.supportsCssAnimation()).toBe(true);
        });

        it('should report no support when no animationName property exists and cache the result', async () => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({});
            expect(browser.supportsCssAnimation()).toBe(false);
            expect(browser.supportsCssAnimation()).toBe(false);
            expect(browser.supportsCssAnimation(false)).toBe(false);
            expect(create).toHaveBeenCalledTimes(1);
            expect(create).toHaveBeenCalledWith('div');
        });

        it('should keep returning a cached result after the environment changes', async () => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({});
            expect(browser.supportsCssAnimation()).toBe(false);
            create.mockRestore();
            expect(browser.supportsCssAnimation()).toBe(false);
        });

        it('should recompute in a fresh module instance', async () => {
            const first = await loadFreshBrowser();
            const create = stubDivStyle({});
            expect(first.default.supportsCssAnimation()).toBe(false);
            create.mockRestore();
            const second = await loadFreshBrowser();
            expect(second.default.supportsCssAnimation()).toBe(true);
        });

        it('should treat any non-undefined animationName as support, including null', async () => {
            const { default: browser } = await loadFreshBrowser();
            stubDivStyle({ animationName: null });
            expect(browser.supportsCssAnimation()).toBe(true);
        });

        it.each([
            ['WebkitAnimationName', ''],
            ['OAnimationName', null],
            ['MozAnimationName', '']
        ])('should find %s only when prefixes are allowed', async (key, value) => {
            const { default: browser } = await loadFreshBrowser();
            stubDivStyle({ [key]: value });
            expect(browser.supportsCssAnimation(true)).toBe(true);
        });

        it('should ignore prefixed names without allowPrefix', async () => {
            const { default: browser } = await loadFreshBrowser();
            stubDivStyle({ WebkitAnimationName: '' });
            expect(browser.supportsCssAnimation(false)).toBe(false);
        });

        it('should return false with prefixes allowed when no variant exists', async () => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({});
            expect(browser.supportsCssAnimation(true)).toBe(false);
            expect(browser.supportsCssAnimation(true)).toBe(false);
            expect(create).toHaveBeenCalledTimes(1);
        });

        it('should not look at prefixes when the unprefixed name exists, and cache for allowPrefix', async () => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({ animationName: '' });
            expect(browser.supportsCssAnimation(true)).toBe(true);
            expect(browser.supportsCssAnimation(true)).toBe(true);
            expect(create).toHaveBeenCalledTimes(1);
        });

        it.each([
            [[true, true, true], 1],
            [[false, false, false], 1],
            [[undefined, undefined], 1],
            [[true, false], 2],
            [[true, undefined], 2],
            [[false, true], 1],
            [[false, undefined], 1],
            [[undefined, true], 1]
        ] as [(boolean | undefined)[], number][])('should create %j elements in %i call(s)', async (args, calls) => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({});
            for (const arg of args) {
                browser.supportsCssAnimation(arg);
            }
            expect(create).toHaveBeenCalledTimes(calls);
        });

        it('should reuse a cached unprefixed true for a prefixed lookup', async () => {
            const { default: browser } = await loadFreshBrowser();
            const create = stubDivStyle({ animationName: '' });
            expect(browser.supportsCssAnimation()).toBe(true);
            expect(browser.supportsCssAnimation(true)).toBe(true);
            expect(create).toHaveBeenCalledTimes(1);
        });

        it('should have independent caches for prefixed and unprefixed lookups (prefixed first)', async () => {
            const { default: browser } = await loadFreshBrowser();
            stubDivStyle({ WebkitAnimationName: '' });
            expect(browser.supportsCssAnimation(true)).toBe(true);
            expect(browser.supportsCssAnimation(false)).toBe(false);
            expect(browser.supportsCssAnimation(true)).toBe(true);
        });

        it('should not create an element on import or detection', async () => {
            const create = vi.spyOn(document, 'createElement');
            const { detectBrowser: detectFresh } = await loadFreshBrowser();
            detectFresh(chromeUA('120.0'));
            expect(create).not.toHaveBeenCalled();
        });
    });

    describe('iOS', () => {
        const iphoneAppVersion = (os: string) => `5.0 (iPhone; CPU iPhone OS ${os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1`;

        it('should leave iOS undefined and omit iOSVersion for non-iOS user agents', () => {
            const browser = detect(chromeUA('120.0'));
            expect(browser).toHaveProperty('iOS', undefined);
            expect(browser).not.toHaveProperty('iOSVersion');
        });

        it.each([
            ['iphone', IPHONE_UA],
            ['ipad', 'Mozilla/5.0 (iPad; CPU OS 12_4 like Mac OS X) AppleWebKit/605.1.15'],
            ['iphone (ipod)', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15']
        ])('should set iOS for %s', (_name, ua) => {
            expect(detect(ua).iOS).toBe(true);
        });

        it('should fall back to an empty array when the platform is not an iOS platform', () => {
            const browser = detect(IPHONE_UA);
            expect(browser.iOSVersion).toStrictEqual([]);
        });

        it.each([
            ['iPhone', 'OS 17_0', 17],
            ['iPad', 'OS 17_0', 17],
            ['iPod', 'OS 17_0', 17],
            ['MacIntel', 'OS 17_0', 17],
            ['iPhone', 'OS 16_4_1', 16.4],
            ['iPhone', 'OS 16_4', 16.4],
            ['iPhone', 'OS 10_3_1', 10.3],
            ['iPhone', 'OS 11_0', 11],
            ['iPhone', 'OS 12_4', 12.4],
            ['iPhone', 'OS 13_3', 13.3],
            ['iPhone', 'OS 13_4', 13.4],
            ['iPhone', 'OS 13_0', 13],
            ['iPhone', 'OS 9_3', 9.3],
            ['iPhone', 'OS 17_0_', 17]
        ])('should parse iOSVersion for platform %s with "%s" as %d', (platform, os, version) => {
            stubNavigator('platform', platform);
            stubNavigator('appVersion', iphoneAppVersion(os.replace('OS ', '')));
            expect(detect(IPHONE_UA).iOSVersion).toBe(version);
        });

        it('should use the Version/ fallback for desktop-mode iPads (major only)', () => {
            stubNavigator('platform', 'MacIntel');
            stubNavigator('maxTouchPoints', 5);
            stubNavigator('appVersion', '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15');
            const browser = detect(MAC_SAFARI_UA);
            expect(browser.ipad).toBe(true);
            expect(browser.iOS).toBe(true);
            expect(browser.iOSVersion).toBe(17);
        });

        it('should prefer the OS pattern over the Version pattern', () => {
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', 'OS 15_2 Version/17');
            expect(detect(IPHONE_UA).iOSVersion).toBe(15.2);
        });

        it.each([
            ['no pattern in appVersion', 'iPhone', 'nothing here'],
            ['undefined appVersion', 'iPhone', undefined],
            ['non-iOS platform', 'Linux', 'OS 17_0'],
            ['lowercase platform', 'iphone', 'OS 17_0'],
            ['lowercase os pattern', 'iPhone', 'os 17_0']
        ])('should return an empty array for %s', (_name, platform, appVersion) => {
            stubNavigator('platform', platform);
            stubNavigator('appVersion', appVersion);
            expect(detect(IPHONE_UA).iOSVersion).toStrictEqual([]);
        });

        it('should mix: UA decides iOS, navigator decides the version', () => {
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', iphoneAppVersion('14_8'));
            expect(detect('mozilla/5.0 iphone').iOSVersion).toBe(14.8);
            expect(detect(chromeUA('120.0'))).not.toHaveProperty('iOSVersion');
        });
    });

    describe('detectBrowser arguments', () => {
        it('should use navigator.userAgent when called without an argument', () => {
            stubNavigator('userAgent', 'Mozilla/5.0 Firefox/100.0');
            expect(detectBrowser().firefox).toBe(true);
            // eslint-disable-next-line sonarjs/no-undefined-argument
            expect(detectBrowser(undefined).version).toBe('100.0');
        });

        it('should not fall back for an empty string', () => {
            stubNavigator('userAgent', 'Mozilla/5.0 Firefox/100.0');
            expect(detectBrowser('')).not.toHaveProperty('firefox');
        });

        it.each([null, 123, {}])('should throw a TypeError for the invalid argument %j', (value) => {
            expect(() => detectBrowser(value as string)).toThrow(TypeError);
        });

        it('should return a fresh object per call', () => {
            const a = detect('mozilla/5.0 chrome/1');
            const b = detect('mozilla/5.0 chrome/1');
            expect(a).not.toBe(b);
            a.chrome = false;
            expect(b.chrome).toBe(true);
        });
    });

    describe('default export (evaluated at import)', () => {
        it('should be the detection of navigator.userAgent at import time', async () => {
            stubNavigator('userAgent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
            const { default: browser, detectBrowser: detectFresh } = await loadFreshBrowser();
            expect(browser.chrome).toBe(true);
            expect(browser.android).toBe(true);
            expect(browser.mobile).toBe(true);
            expect(browser.versionMajor).toBe(120);
            expect(detectFresh).toBeTypeOf('function');
        });

        it('should not change when navigator.userAgent changes after import', async () => {
            stubNavigator('userAgent', 'Mozilla/5.0 Firefox/100.0');
            const { default: browser } = await loadFreshBrowser();
            stubNavigator('userAgent', 'Mozilla/5.0 Chrome/100.0');
            expect(browser.firefox).toBe(true);
            expect(browser).not.toHaveProperty('chrome');
        });

        it('should be a cached singleton per module instance', async () => {
            const first = await loadFreshBrowser();
            const again = await import('./browser');
            expect(again.default).toBe(first.default);
            const second = await loadFreshBrowser();
            expect(second.default).not.toBe(first.default);
        });

        it('should differ from a detection result object', async () => {
            const { default: browser, detectBrowser: detectFresh } = await loadFreshBrowser();
            expect(detectFresh(BASELINE_USER_AGENT)).not.toBe(browser);
            expect(withoutFunction(detectFresh(BASELINE_USER_AGENT))).toStrictEqual(withoutFunction(browser));
        });

        it('should reflect the environment at import time for touch, animate and iOS', async () => {
            stubNavigator('userAgent', IPHONE_UA);
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', '5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X)');
            stubNavigator('maxTouchPoints', 5);
            stubAnimate();
            const { default: browser } = await loadFreshBrowser();
            expect(browser.touch).toBe(true);
            expect(browser.animate).toBe(true);
            expect(browser.iOS).toBe(true);
            expect(browser.iOSVersion).toBe(15.1);
        });

        it('should snapshot the baseline default export', async () => {
            const { default: browser } = await loadFreshBrowser();
            expect(withoutFunction(browser)).toStrictEqual({
                chrome: true,
                // eslint-disable-next-line sonarjs/no-hardcoded-ip
                version: '120.0.0.0',
                versionMajor: 120,
                edgeChromium: undefined,
                osx: false,
                ps4: false,
                xboxOne: false,
                animate: false,
                hisense: false,
                tizen: false,
                vega: false,
                vidaa: false,
                web0s: false,
                tv: false,
                operaTv: false,
                edgeUwp: undefined,
                orsay: false,
                keyboard: false,
                iOS: undefined
            });
        });

        it('should throw at import time when window.tizen is set with a non-Tizen user agent', async () => {
            setWindowProp('tizen', {});
            await expect(loadFreshBrowser()).rejects.toThrow(TypeError);
        });
    });

    describe('user agent corpus (golden results)', () => {
        it('should have unique names', () => {
            expect(new Set(USER_AGENT_CORPUS.map(entry => entry.name)).size).toBe(USER_AGENT_CORPUS.length);
        });

        it.each(USER_AGENT_CORPUS)('should detect $name exactly', (entry) => {
            silenceConsole();
            if (entry.throws) {
                expect(() => detectBrowser(entry.ua)).toThrow(TypeError);
                return;
            }
            const result = detect(entry.ua);
            expect(result.supportsCssAnimation).toBeTypeOf('function');
            expect(withoutFunction(result)).toStrictEqual(entry.expected);
        });
    });

    describe('robustness', () => {
        const N = 100_000;
        // Generous bound: linear matching of 100k characters takes a few milliseconds.
        const BUDGET_MS = 5000;

        const timed = (ua: string) => {
            const start = performance.now();
            const result = detect(ua);
            return { result, elapsed: performance.now() - start };
        };

        it.each([
            ['no match', 'x'.repeat(N)],
            ['mozilla then filler', 'Mozilla/5.0 ' + 'a'.repeat(N)],
            ['repeated rv', 'Mozilla/5.0' + ' rv:'.repeat(N / 4)],
            ['repeated mozilla', 'mozilla'.repeat(N / 7)],
            ['repeated edge and chrome', 'edg'.repeat(N / 3) + 'chrome'.repeat(N / 6)],
            ['null bytes', '\u0000'.repeat(N)],
            ['repeated space', ' '.repeat(N)]
        ])('should handle a %s user agent of 100k characters in bounded time', (_name, ua) => {
            const { elapsed } = timed(ua);
            expect(elapsed).toBeLessThan(BUDGET_MS);
        });

        it('should parse a very long Tizen minor version as Infinity without hanging', () => {
            const { result, elapsed } = timed('Tizen 1.' + '1'.repeat(1000));
            expect(result.tizenVersion).toBe(Infinity);
            expect(elapsed).toBeLessThan(BUDGET_MS);
        });

        it('should cap an enormous version at major Infinity', () => {
            expect(detect('chrome/' + '9'.repeat(400)).versionMajor).toBe(Infinity);
        });

        it('should handle a long iOS appVersion in bounded time', () => {
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', 'OS ' + '1'.repeat(N));
            const start = performance.now();
            const browser = detect(IPHONE_UA);
            expect(performance.now() - start).toBeLessThan(BUDGET_MS);
            expect(browser.iOSVersion).toStrictEqual([]);
        });

        it('should not allow prototype pollution through user agent tokens', () => {
            const browser = detect('__proto__/1 constructor/2 prototype/3 tv/4 keyboard/5 supportsCssAnimation/6 hasOwnProperty/7 Mozilla/5.0');
            expect(Object.getPrototypeOf(browser)).toBe(Object.prototype);
            expect(browser.supportsCssAnimation).toBeTypeOf('function');
            expect(browser.mozilla).toBe(true);
            expect(browser.version).toBe('0');
            expect(Object.keys(browser)).not.toContain('constructor');
            expect(Object.keys(browser)).not.toContain('__proto__');
            expect(({} as Result).polluted).toBeUndefined();
        });

        it('should handle unicode and control characters without throwing', () => {
            expect(detect('Mozilla/5.0 \u{1F600} 中文').mozilla).toBe(true);
            expect(detect('Chrome\u0000/120')).not.toHaveProperty('chrome');
            expect(detect('Chrome/12\u00000').version).toBe('12');
            expect(detect('Mozilla/5.0\n rv:11.0').version).toBe('0');
            expect(detect('TIZEN 5.0'.replace('TIZEN', 'İ')).tizen).toBe(false);
        });

        it('should lowercase the Kelvin sign into kepler', () => {
            expect(detect('\u212Aepler').vega).toBe(true);
        });

        it('should treat String objects like strings', () => {
            // eslint-disable-next-line sonarjs/no-primitive-wrappers
            expect(detect(new String('Chrome/1') as unknown as string).chrome).toBe(true);
        });
    });

    describe('purity', () => {
        it('should not touch the DOM while detecting', () => {
            const create = vi.spyOn(document, 'createElement');
            const before = document.documentElement.outerHTML;
            const observer = new MutationObserver(() => undefined);
            observer.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
            detect(chromeUA('120.0'));
            expect(observer.takeRecords()).toHaveLength(0);
            observer.disconnect();
            expect(create).not.toHaveBeenCalled();
            expect(document.documentElement.outerHTML).toBe(before);
        });

        it('should not write to the console for regular user agents', () => {
            const { warn, error } = silenceConsole();
            for (const entry of USER_AGENT_CORPUS.filter(e => !e.throws && !e.expected?.web0s)) {
                detect(entry.ua);
            }
            expect(warn).not.toHaveBeenCalled();
            expect(error).not.toHaveBeenCalled();
        });
    });

    // Every test below pins behavior that is probably a bug or a footgun. They exist so that the TypeScript
    // conversion cannot change anything silently. A deliberate fix must update the matching test in the same change.
    describe('known quirks (current behavior, intentionally locked in)', () => {
        describe('Tizen crash', () => {
            // BUG: the Tizen detection is case-insensitive (lowercased UA or window.tizen) but the version regex
            // runs on the original UA and is case-sensitive, so exec() returns null and `v[1]` throws.
            // A fix would guard null (and probably leave tizenVersion undefined) instead of throwing.
            it.each([
                'Mozilla/5.0 (tizen 8.0)',
                'Mozilla/5.0 (TIZEN 8.0)',
                'Mozilla/5.0 (Linux; Tizen)',
                'Mozilla/5.0 (SMART-TV; Tizen/5.0)',
                'Mozilla/5.0 (Linux; Tizen 5)'
            ])('should throw a TypeError for the Tizen UA "%s" without a parseable "Tizen X.Y"', (ua) => {
                expect(() => detectBrowser(ua)).toThrow(TypeError);
            });

            // BUG: window.tizen alone marks tizen, but the UA of a Tizen-less browser cannot be parsed, so every
            // detection throws (and so does the import of the module, which kills the whole app).
            it('should throw a TypeError when window.tizen is set and the user agent has no Tizen version', () => {
                setWindowProp('tizen', {});
                expect(() => detectBrowser(chromeUA('120.0'))).toThrow(TypeError);
            });

            // The failing user agent is only reached when web0s is false: web0s wins the branch chain.
            it('should not throw for web0s even though tizen is true', () => {
                setWindowProp('tizen', {});
                expect(detect(web0sChromeUA('94.0')).tizen).toBe(true);
            });
        });

        // BUG: the minor version is divided by 10 as if it had one digit, so 6.10 becomes 7 and 2.10 becomes 3.
        // A fix would parse the minor as a fraction of its digit count or return a {major, minor} pair.
        it('should parse the Tizen minor version as minor / 10 (Tizen 6.10 equals 7)', () => {
            expect(detect(tizenUA('6.10')).tizenVersion).toBe(7);
            expect(detect(tizenUA('2.10')).tizenVersion).toBe(3);
        });

        // BUG: the same minor / 10 arithmetic is applied to iOS, so iOS 12.10 equals 13.
        it('should parse the iOS minor version as minor / 10 (iOS 12_10 equals 13)', () => {
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', 'iPhone OS 12_10 like Mac OS X');
            expect(detect(IPHONE_UA).iOSVersion).toBe(13);
        });

        // BUG: when platform or appVersion do not match, iOSVersion stays the empty array [] (a number is typed).
        // Consumers compare `[] < 11`, which is true, so such a device is treated as iOS older than 11.
        // A fix would return undefined or a number.
        it('should leave iOSVersion as [] when it cannot be parsed, which compares as lower than 11', () => {
            const version = detect(IPHONE_UA).iOSVersion as unknown as number;
            expect(version).toStrictEqual([]);
            expect(version < 11).toBe(true);
            expect(version >= 11).toBe(false);
        });

        // BUG: iOSversion() ignores the user agent argument and reads the global navigator. detectBrowser(ua) is
        // therefore not a pure function of ua: the same UA gives different versions for different globals.
        it('should read iOS version data from the global navigator instead of the argument', () => {
            stubNavigator('platform', 'iPhone');
            stubNavigator('appVersion', 'OS 9_0');
            expect(detect(IPHONE_UA).iOSVersion).toBe(9);
            stubNavigator('appVersion', 'OS 14_0');
            expect(detect(IPHONE_UA).iOSVersion).toBe(14);
        });

        // BUG: web0sVersion() lowercases navigator.userAgent, not the argument, so the NetCast warning never fires
        // for a UA passed explicitly and the version is guessed from the Chrome token (38 gives webOS 3).
        // A fix would pass the already-normalized UA down.
        it('should ignore netcast in the argument and read it from navigator.userAgent', () => {
            const { warn } = silenceConsole();
            const ua = 'Mozilla/5.0 Chrome/38.0 Safari/537.36 NetCast';
            expect(detect(ua).web0sVersion).toBe(3);
            expect(warn).not.toHaveBeenCalled();
            stubNavigator('userAgent', 'netcast');
            expect(detect(chromeUA('38.0') + ' web0s').web0sVersion).toBeUndefined();
            expect(warn).toHaveBeenCalledTimes(1);
        });

        // BUG: ipod is never set (platform regex has no ipod and iPod UAs say "iphone os"), so `browser.ipod`
        // terms are dead code. A fix would add an ipod platform entry before iphone.
        it('should never set an ipod key', () => {
            const browser = detect('Mozilla/5.0 (iPod touch; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');
            expect(browser).not.toHaveProperty('ipod');
            expect(browser.iphone).toBe(true);
            expect(detect('mozilla/5.0 ipod')).not.toHaveProperty('ipod');
        });

        describe('tv substring false positives', () => {
            // BUG: isTv() does a plain substring search for "tv", so any token containing it ("Setvx", "attvx")
            // flags a TV and implies slow and keyboard. A fix would match whole tokens.
            it.each(['Mozilla/5.0 (X11) Setvx', 'Mozilla/5.0 (X11) attvx'])('should flag "%s" as a tv', (ua) => {
                const browser = detect(ua);
                expect(browser.tv).toBe(true);
                expect(browser.slow).toBe(true);
                expect(browser.keyboard).toBe(true);
            });

            // BUG: Oculus detection only guards isTv(); web0s stays true, and ps4/vega/xbox tokens still win.
            it('should keep web0s true for an Oculus UA that also says netcast', () => {
                const { error } = silenceConsole();
                const browser = detect('mozilla/5.0 oculusbrowser netcast');
                expect(browser.tv).toBe(false);
                expect(browser.web0s).toBe(true);
                expect(browser).toHaveProperty('web0sVersion', undefined);
                expect(error).toHaveBeenCalledTimes(1);
            });
        });

        // Unanchored regexes misidentify the Edge browser from "ledge/1.0" or "knowledge/2".
        it('should match edge inside another word', () => {
            expect(detect('ledge/1.0').edge).toBe(true);
            expect(detect('knowledge/2').edge).toBe(true);
        });

        describe('supportsCssAnimation cache order', () => {
            // BUG: supportsCssAnimation(true) falls through to the unprefixed cache, so an earlier call without
            // allowPrefix that cached false makes the prefixed lookup return false without trying any prefix.
            // A fix would only consult the unprefixed cache when it is true.
            it('should poison the prefixed lookup after an unprefixed miss', async () => {
                const { default: browser } = await loadFreshBrowser();
                stubDivStyle({ WebkitAnimationName: '' });
                expect(browser.supportsCssAnimation()).toBe(false);
                expect(browser.supportsCssAnimation(true)).toBe(false);
            });

            it('should find the prefixed name in the opposite order', async () => {
                const { default: browser } = await loadFreshBrowser();
                stubDivStyle({ WebkitAnimationName: '' });
                expect(browser.supportsCssAnimation(true)).toBe(true);
                expect(browser.supportsCssAnimation()).toBe(false);
            });
        });

        // BUG: a Version/ token overrides the product version (Android WebView "Version/4.0 Chrome/117"), so
        // versionMajor is 4 for a Chrome 117 engine and feeds the webOS lookup the wrong number.
        it('should report the Version/ number instead of the Chrome version for WebViews', () => {
            const browser = detect('Mozilla/5.0 (Linux; Android 10; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/117.0.0.0 Mobile Safari/537.36');
            expect(browser.chrome).toBe(true);
            expect(browser.version).toBe('4.0');
            expect(browser.versionMajor).toBe(4);
        });

        // BUG: Fire TV (AFT*) UAs are not recognised as TVs and report the WebView Version/ number.
        it('should not recognise Fire TV as a tv', () => {
            const browser = detect('Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/98.0.4758.101 Mobile Safari/537.36');
            expect(browser.tv).toBe(false);
            expect(browser.mobile).toBe(true);
            expect(browser.versionMajor).toBe(4);
        });

        // Quirk: desktop-mode iPad is flagged ipad/iOS but never mobile or slow (the UA has no "mobi").
        it('should not mark the iPad workaround as mobile', () => {
            stubNavigator('maxTouchPoints', 5);
            const browser = detect(MAC_SAFARI_UA);
            expect(browser.ipad).toBe(true);
            expect(browser).not.toHaveProperty('mobile');
        });

        // Quirk: flags documented as boolean are undefined or absent rather than false.
        // A TS conversion must keep `undefined` (not `false`) for these or consumers comparing strictly change.
        it('should leave edgeChromium and iOS undefined instead of false', () => {
            const browser = detect(chromeUA('120.0'));
            expect(browser).toHaveProperty('edgeChromium', undefined);
            expect(browser).toHaveProperty('iOS', undefined);
            expect(browser).toHaveProperty('edgeUwp', undefined);
        });

        // Quirk: Tizen 5.5+ UAs have no Chrome token, so the "version" is the WebKit version 537.36.
        it('should report the WebKit version for Tizen 5.5+ UAs without a Chrome token', () => {
            const browser = detect('Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106.1/5.5 TV Safari/537.36');
            expect(browser.tizenVersion).toBe(5.5);
            expect(browser.version).toBe('537.36');
            expect(browser.versionMajor).toBe(537);
        });
    });
});
