/* eslint-disable sonarjs/no-hardcoded-ip -- Browser versions in user-agent fixtures are not IP addresses. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { detectBrowser } from './browser';

type BrowserFlag =
    | 'android'
    | 'chrome'
    | 'edg'
    | 'edga'
    | 'edge'
    | 'edgeChromium'
    | 'edgeUwp'
    | 'edgios'
    | 'firefox'
    | 'hisense'
    | 'iOS'
    | 'ipad'
    | 'iphone'
    | 'ipod'
    | 'keyboard'
    | 'mobile'
    | 'mozilla'
    | 'opera'
    | 'operaTv'
    | 'osx'
    | 'ps4'
    | 'safari'
    | 'slow'
    | 'titanos'
    | 'tizen'
    | 'touch'
    | 'tv'
    | 'vega'
    | 'vidaa'
    | 'web0s'
    | 'windows'
    | 'xboxOne';

interface UserAgentCase {
    name: string;
    userAgent: string;
    flags: readonly BrowserFlag[];
    version?: string;
    versionMajor?: number;
    iOSVersion?: number;
    tizenVersion?: number;
    web0sVersion?: number;
}

const browserFlags: readonly BrowserFlag[] = [
    'android',
    'chrome',
    'edg',
    'edga',
    'edge',
    'edgeChromium',
    'edgeUwp',
    'edgios',
    'firefox',
    'hisense',
    'iOS',
    'ipad',
    'iphone',
    'ipod',
    'keyboard',
    'mobile',
    'mozilla',
    'opera',
    'operaTv',
    'osx',
    'ps4',
    'safari',
    'slow',
    'titanos',
    'tizen',
    'touch',
    'tv',
    'vega',
    'vidaa',
    'web0s',
    'windows',
    'xboxOne'
];

const desktopAndMobileCases: readonly UserAgentCase[] = [
    // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent
    {
        name: 'Chrome on Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        flags: [ 'chrome', 'windows' ],
        version: '143.0.0.0',
        versionMajor: 143
    },
    {
        name: 'Firefox on Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
        flags: [ 'firefox', 'windows' ],
        version: '47.0',
        versionMajor: 47
    },
    // Ref: https://forum.palemoon.org/viewtopic.php?t=24835
    {
        name: 'Pale Moon on Linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:4.6) Goanna/20200810 PaleMoon/28.12.0',
        flags: [ 'mozilla' ],
        version: '28.12.0',
        versionMajor: 28
    },
    {
        name: 'Safari on macOS',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
        flags: [ 'osx', 'safari' ],
        version: '26.0',
        versionMajor: 26
    },
    {
        name: 'Edge on Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
        flags: [ 'edg', 'edgeChromium', 'windows' ],
        version: '143.0.0.0',
        versionMajor: 143
    },
    // Ref: https://learn.microsoft.com/en-us/microsoft-edge/web-platform/user-agent-guidance
    {
        name: 'legacy Edge on Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582',
        flags: [ 'edge' ],
        version: '18.19582',
        versionMajor: 18
    },
    {
        name: 'Opera on Linux',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36 OPR/38.0.2220.41',
        flags: [ 'opera' ],
        version: '38.0.2220.41',
        versionMajor: 38
    },
    {
        name: 'Chrome on Android',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
        flags: [ 'android', 'chrome', 'mobile', 'slow' ],
        version: '143.0.0.0',
        versionMajor: 143
    },
    // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent
    {
        name: 'Firefox on Android',
        userAgent: 'Mozilla/5.0 (Android 15; Mobile; rv:136.0) Gecko/136.0 Firefox/136.0',
        flags: [ 'android', 'firefox', 'mobile', 'slow' ],
        version: '136.0',
        versionMajor: 136
    },
    {
        name: 'Edge on Android',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0',
        flags: [ 'android', 'edga', 'edgeChromium', 'mobile', 'slow' ],
        version: '141.0.0.0',
        versionMajor: 141
    },
    // Ref: https://developer.samsung.com/browser/user-agent-string-format.html
    {
        name: 'Samsung Internet on Android',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
        flags: [ 'android', 'chrome', 'mobile', 'slow' ],
        version: '117.0.0.0',
        versionMajor: 117
    },
    // Ref: https://help.opera.com/en/opera-mini-request-headers/
    {
        name: 'Opera Mini on Android',
        userAgent: 'Opera/9.80 (Android; Opera Mini/8.0.1807/36.1609; U; en) Presto/2.12.423 Version/12.16',
        flags: [ 'android', 'mobile', 'opera', 'slow' ],
        version: '8.0.1807',
        versionMajor: 8
    },
    // Ref: https://docs.aws.amazon.com/pdfs/silk/latest/developerguide/silk-dg.pdf
    {
        name: 'Silk on a Kindle Fire HDX',
        userAgent: 'Mozilla/5.0 (Linux; U; Android 4.2.2; en-us; KFTHWI Build/JDQ39) AppleWebKit/537.36 (KHTML, like Gecko) Silk/3.22 like Chrome/34.0.1847.137 Safari/537.36',
        flags: [ 'android', 'mobile', 'slow' ]
    },
    // Ref: https://developer.apple.com/forums/thread/703300
    {
        name: 'Safari on iPhone',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
        flags: [ 'iOS', 'iphone', 'mobile', 'osx', 'safari', 'slow' ],
        version: '15.4',
        versionMajor: 15,
        iOSVersion: 15.4
    },
    // Ref: https://developer.apple.com/library/archive/technotes/tn2010/tn2262/_index.html
    {
        name: 'Safari on iPad',
        userAgent: 'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10',
        flags: [ 'iOS', 'ipad', 'mobile', 'osx', 'safari', 'slow' ],
        version: '4.0.4',
        versionMajor: 4,
        iOSVersion: 3.2
    },
    // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent/Firefox
    {
        name: 'Firefox on iPod touch',
        userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4',
        flags: [ 'firefox', 'iOS', 'ipod', 'mobile', 'osx', 'slow' ],
        version: '1.0',
        versionMajor: 1,
        iOSVersion: 8.3
    },
    // Ref: https://developer.apple.com/forums/tags/apple-pay-on-the-web?page=5&sortBy=newest
    {
        name: 'Chrome on iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/133.0.6943.33 Mobile/15E148 Safari/604.1',
        flags: [ 'chrome', 'iOS', 'ipad', 'mobile', 'osx', 'slow' ],
        version: '133.0.6943.33',
        versionMajor: 133,
        iOSVersion: 18.3
    },
    // Ref: https://user-agents.net/platforms/ipados/user-agents
    {
        name: 'Edge on iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 EdgiOS/103.0.1264.60 Mobile/15E148 Safari/604.1',
        flags: [ 'edgeChromium', 'edgios', 'iOS', 'ipad', 'mobile', 'osx', 'slow' ],
        version: '103.0.1264.60',
        versionMajor: 103,
        iOSVersion: 14.4
    },
    // Ref: https://whatmyuseragent.com/device/motorola/edge-40
    {
        name: 'Chrome on a Motorola Edge phone',
        userAgent: 'Mozilla/5.0 (Linux; Android 14; XT2303-2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.76 Mobile Safari/537.36',
        flags: [ 'android', 'chrome', 'mobile', 'slow' ],
        version: '125.0.6422.76',
        versionMajor: 125
    },
    // Ref: https://user-agents.net/browsers/oculus-browser/platforms/android
    {
        name: 'Oculus Browser',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; Quest 2) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/23.0.0.1.18.389879693 SamsungBrowser/4.0 Chrome/104.0.5112.69 Mobile VR Safari/537.36',
        flags: [ 'android', 'mobile', 'slow' ]
    }
];

// Ref: https://developer.samsung.com/smarttv/develop/guides/fundamentals/retrieving-platform-information.html
const tizenCases: readonly UserAgentCase[] = ([
    ['Tizen 10.0', 10, '130.0.6723.116', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 10.0) AppleWebKit/537.36 (KHTML, like Gecko) 130.0.6723.116/10.0 TV Safari/537.36'],
    ['Tizen 9.0', 9, '120.0.6099.5', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 9.0) AppleWebKit/537.36 (KHTML, like Gecko) 120.0.6099.5/9.0 TV Safari/537.36'],
    ['Tizen 8.0', 8, '108.0.5359.1', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) 108.0.5359.1/8.0 TV Safari/537.36'],
    ['Tizen 7.0', 7, '94.0.4606.31', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36'],
    ['Tizen 6.5', 6.5, '85.0.4183.93', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36'],
    ['Tizen 6.0', 6, '76.0.3809.146', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36'],
    ['Tizen 5.5', 5.5, '69.0.3497.106.1', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.5) AppleWebKit/537.36 (KHTML, like Gecko) 69.0.3497.106.1/5.5 TV Safari/537.36'],
    ['Tizen 5.0', 5, '5.0', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36'],
    ['Tizen 4.0', 4, '4.0', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 4.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 TV Safari/537.36'],
    ['Tizen 3.0', 3, '3.0', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 3.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/3.0 TV Safari/538.1'],
    ['Tizen 2.4', 2.4, '2.4.0', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/2.4.0 TV Safari/538.1'],
    ['Tizen 2.2', 2.2, '1.0', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.2) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.0 TV Safari/538.1']
] satisfies ReadonlyArray<readonly [string, number, string, string]>).map(([ name, tizenVersion, version, userAgent ]) => ({
    name,
    userAgent,
    flags: [ 'keyboard', 'slow', 'tizen', 'tv' ],
    version,
    versionMajor: Number.parseInt(version, 10),
    tizenVersion
}));

// Ref: https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
const webOsCases: readonly UserAgentCase[] = ([
    ['webOS 26', 26, '132.0.6834.207', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.207 Safari/537.36 WebAppManager'],
    ['webOS 25', 25, '120.0.6099.270', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.270 Safari/537.36 WebAppManager'],
    ['webOS 24', 24, '108.0.5359.211', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.211 Safari/537.36 WebAppManager'],
    ['webOS 23', 23, '94.0.4606.128', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.128 Safari/537.36 WebAppManager'],
    ['webOS 22', 22, '87.0.4280.88', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager'],
    ['webOS 6', 6, '79.0.3945.79', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager'],
    ['webOS 5', 5, '68.0.3440.106', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36 WebAppManager'],
    ['webOS 4', 4, '53.0.2785.34', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.34 Safari/537.36 WebAppManager'],
    ['webOS 3', 3, '38.0.2125.122', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.2.1 Chrome/38.0.2125.122 Safari/537.36 WebAppManager'],
    ['webOS 2', 2, '538.2', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/538.2 (KHTML, like Gecko) Large Screen WebAppManager Safari/538.2'],
    ['webOS 1', 1, '537.41', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.41 (KHTML, like Gecko) Large Screen WebAppManager Safari/537.41']
] satisfies ReadonlyArray<readonly [string, number, string, string]>).map(([ name, web0sVersion, version, userAgent ]) => ({
    name,
    userAgent,
    flags: [ 'keyboard', 'slow', 'tv', 'web0s' ],
    version,
    versionMajor: Number.parseInt(version, 10),
    web0sVersion
}));

const tvAndConsoleCases: readonly UserAgentCase[] = [
    ...tizenCases,
    ...webOsCases,
    // Ref: https://developer.amazon.com/docs/vega/0.24/webview-development-best-practices-tv
    {
        name: 'Amazon Vega OS',
        userAgent: 'Mozilla/5.0 (Linux; Kepler 1.1; AFTCA002 user/1234; wv) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Chrome/130.0.6723.192 Safari/537.36',
        flags: [ 'keyboard', 'slow', 'tv', 'vega' ],
        version: '130.0.6723.192',
        versionMajor: 130
    },
    // Ref: https://www.vidaa.com/wp-content/uploads/2020/12/WebApp_Development_Guide_for_VIDAA.pdf
    {
        name: 'Hisense VIDAA TV',
        userAgent: 'Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.65 Safari/537.36 OPR/46.0.2207.0 OMI/4.20.0.378.Catcher2.28 Model/Hisense-MSD6886 VIDAA/4.0(Hisense;SmartTV;HE55A6900FUWTS;mstar6886/V0000.01.00a.J1105;UHD)',
        flags: [ 'hisense', 'keyboard', 'opera', 'operaTv', 'slow', 'tv', 'vidaa' ],
        version: '46.0.2207.0',
        versionMajor: 46
    },
    // Refs: https://docs.titanos.tv/user-agents-specifications and https://user-agents.net/s/19e417a908cbeaae01dd99cbb34ebd7e37c13127
    {
        name: 'Titan OS on a Philips TV',
        userAgent: 'Mozilla/5.0 (Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.4147.62 Safari/537.36 OPR/46.0.2207.0 OMI/4.24.1.79, TV_NT72690_2024/247.004.243.111 (Philips, PFS6009, wired) CE-HTML/1.0 NETTV/4.6.0.7 SignOn/2.0 SmartTvA/5.0.0 WhaleTV/2.0 TitanOS/1.0 en Ginga',
        flags: [ 'keyboard', 'slow', 'titanos', 'tv' ],
        version: '1.0',
        versionMajor: 1
    },
    // Ref: https://docs.titanos.tv/user-agents-specifications
    {
        name: 'Titan OS on a JVC TV',
        userAgent: 'Mozilla/5.0 (Linux ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36 OMI/4.24.3.93.MIKE.227 Model/Vestel-MB190 VSTVB MB100 FVC/9.0 (VESTEL; MB190; ) HbbTV/1.7.1 (+DRM; VESTEL; MB190; 0.9.0.0; ; _TV__2025;) TitanOS/3.0 (Vestel MB190 VESTEL) SmartTvA/3.0.0',
        flags: [ 'keyboard', 'slow', 'titanos', 'tv' ],
        version: '3.0',
        versionMajor: 3
    },
    // Refs: https://www.sie.com/content/dam/corporate/jp/guideline/PS4_Web_Content-Guidelines_e.pdf and https://useragents.io/uas/mozilla-5-0-playstation-playstation-4-13-50-applewebkit-605-1-15-khtml-like-gecko-version-17-0-safari-605-1-15_f5e56363a448d50a00a59a15095e4a64
    {
        name: 'PlayStation 4',
        userAgent: 'Mozilla/5.0 (PlayStation; PlayStation 4/13.50) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        flags: [ 'keyboard', 'ps4', 'safari', 'slow', 'tv' ],
        version: '17.0',
        versionMajor: 17
    },
    // Ref: https://user-agents.net/s/GxS0IUOOrt
    {
        name: 'Edge browser on Xbox',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36 Edg/97.0.1072.91',
        flags: [ 'edg', 'edgeChromium', 'keyboard', 'slow', 'tv', 'windows', 'xboxOne' ],
        version: '97.0.1072.91',
        versionMajor: 97
    },
    // Ref: https://iabtechlab.com/wp-content/uploads/2023/06/06.07-TL-Summit-Main-Stage-Master-Deck.pdf
    {
        name: 'Edge UWP app on Xbox',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox One; MSAppHost/3.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.22621',
        flags: [ 'edge', 'edgeUwp', 'keyboard', 'slow', 'tv', 'xboxOne' ],
        version: '18.22621',
        versionMajor: 18
    },
    // Ref: https://deviceatlas.com/blog/list-smart-tv-user-agent-strings
    {
        name: 'Panasonic Viera TV',
        userAgent: 'Mozilla/5.0 (Linux; U; en) AppleWebKit/537.36 (KHTML, like Gecko) Viera/3.10 SmartTV Safari/537.36',
        flags: [ 'keyboard', 'safari', 'slow', 'tv' ],
        version: '537.36',
        versionMajor: 537
    }
];

/* eslint-enable sonarjs/no-hardcoded-ip */

function detectedFlags(browser: ReturnType<typeof detectBrowser>): Record<BrowserFlag, boolean> {
    return Object.fromEntries(browserFlags.map(flag => [ flag, Boolean(browser[flag]) ])) as Record<BrowserFlag, boolean>;
}

function expectedFlags(trueFlags: readonly BrowserFlag[]): Record<BrowserFlag, boolean> {
    return Object.fromEntries(browserFlags.map(flag => [ flag, trueFlags.includes(flag) ])) as Record<BrowserFlag, boolean>;
}

describe('Browser', () => {
    const touchStartDescriptor = Object.getOwnPropertyDescriptor(window, 'ontouchstart');

    beforeAll(() => {
        // User-agent classification cases run in a consistent non-touch environment.
        Reflect.deleteProperty(window, 'ontouchstart');
    });

    afterAll(() => {
        if (touchStartDescriptor) Object.defineProperty(window, 'ontouchstart', touchStartDescriptor);
    });

    it.each([ ...desktopAndMobileCases, ...tvAndConsoleCases ])('$name', testCase => {
        const browser = detectBrowser(testCase.userAgent);

        expect(detectedFlags(browser)).toEqual(expectedFlags(testCase.flags));

        expect(browser.version).toBe(testCase.version);
        expect(browser.versionMajor).toBe(testCase.versionMajor);
        expect(browser.iOSVersion).toBe(testCase.iOSVersion);
        expect(browser.tizenVersion).toBe(testCase.tizenVersion);
        expect(browser.web0sVersion).toBe(testCase.web0sVersion);
    });

    it('detects touch capability independently of the user agent', () => {
        Object.defineProperty(window, 'ontouchstart', { configurable: true, value: null });

        try {
            const browser = detectBrowser(desktopAndMobileCases[0].userAgent);
            expect(detectedFlags(browser)).toEqual(expectedFlags([ 'chrome', 'keyboard', 'touch', 'windows' ]));
        } finally {
            Reflect.deleteProperty(window, 'ontouchstart');
        }
    });

    it('should identify Samsung Tizen TV devices', () => {
        // 2024 Samsung TV (Tizen 8.0)
        const browser = detectBrowser('Mozilla/5.0 (SMART-TV; Linux; Tizen 8.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.0 Chrome/108.0.5359.1 TV Safari/537.36');
        expect(browser.tizen).toBe(true);
        expect(browser.tizenVersion).toBe(8);
        expect(browser.tv).toBe(true);
        expect(browser.mobile).toBeFalsy();
    });

    it('should not identify Samsung Browser (Android) as a TV', () => {
        // Ref: https://developer.samsung.com/browser/user-agent-string-format.html
        const browser = detectBrowser('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36');
        expect(browser.android).toBe(true);
        expect(browser.mobile).toBe(true);
        expect(browser.tizen).toBeFalsy();
        expect(browser.tv).toBeFalsy();
    });
});
