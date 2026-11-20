/** Browser keys set (to `true`) from the first matching user agent pattern. `opr` is renamed to `opera`. */
type BrowserName = 'edg' | 'edga' | 'edgios' | 'edge' | 'titanos' | 'opera' | 'chrome' | 'safari' | 'firefox' | 'mozilla';

/** Platform keys set (to `true`) from the first matching user agent pattern. */
type PlatformName = 'ipad' | 'iphone' | 'windows' | 'android' | 'titanos';

/**
 * Result of the browser detection.
 *
 * Optional properties are ABSENT from the object unless stated otherwise. Properties typed `| undefined` are always
 * present, but may hold `undefined` (only `edgeUwp` can also be `false`, for Edge user agents).
 */
export interface Browser extends Partial<Record<BrowserName | PlatformName, true>> {
    /** Only set when a browser pattern matched. */
    version?: string;
    /** Only set when a browser pattern matched. */
    versionMajor?: number;
    edgeChromium: true | undefined;
    osx: boolean;
    /** Never set: there is no ipod platform pattern (iPod user agents report iphone). */
    ipod?: never;
    ps4: boolean;
    xboxOne: boolean;
    animate: boolean;
    hisense: boolean;
    tizen: boolean;
    vega: boolean;
    vidaa: boolean;
    web0s: boolean;
    tv: boolean;
    /** Absent for TitanOS. */
    operaTv?: boolean;
    edgeUwp: boolean | undefined;
    /** Only set on mobile user agents (absent for Vega). */
    mobile?: true;
    /** Only set for web0s; the key is present but undefined when the version is unknown. */
    web0sVersion?: number;
    /** Only set for tizen (when web0s is false). */
    tizenVersion?: number;
    /** Only set when web0s, tizen, titanos and vega are all false. */
    orsay?: boolean;
    /** Only set for mobile or tv. */
    slow?: true;
    touch?: true;
    keyboard: boolean;
    supportsCssAnimation: typeof supportsCssAnimation;
    iOS: true | undefined;
    /** Only set for iOS. An empty array when the version cannot be parsed, a number (major + minor / 10) otherwise. */
    iOSVersion?: number | [];
}

function isTv(userAgent: string) {
    // This is going to be really difficult to get right

    // The OculusBrowsers userAgent also has the samsungbrowser defined but is not a tv.
    if (userAgent.includes('oculusbrowser')) {
        return false;
    }

    if (userAgent.includes('tv')) {
        return true;
    }

    if (userAgent.includes('viera')) {
        return true;
    }

    if (userAgent.includes('titanos')) {
        return true;
    }

    return isWeb0s(userAgent);
}

function isWeb0s(userAgent: string) {
    return userAgent.includes('netcast')
        || userAgent.includes('web0s');
}

function isMobile(userAgent: string) {
    const terms = [
        'mobi',
        'ipad',
        'iphone',
        'ipod',
        'silk',
        'gt-p1000',
        'nexus 7',
        'kindle fire',
        'opera mini'
    ];

    for (const term of terms) {
        if (userAgent.includes(term)) {
            return true;
        }
    }

    return false;
}

function hasKeyboard(browser: Browser) {
    if (browser.touch) {
        return true;
    }

    if (browser.xboxOne) {
        return true;
    }

    if (browser.ps4) {
        return true;
    }

    if (browser.edgeUwp) {
        // This is OK for now, but this won't always be true
        // Should we use this?
        // https://gist.github.com/wagonli/40d8a31bd0d6f0dd7a5d
        return true;
    }

    return !!browser.tv;
}

function iOSversion(): [number, number, number] | [] {
    // MacIntel: Apple iPad Pro 11 iOS 13.1
    if (/iP(hone|od|ad)|MacIntel/.test(navigator.platform)) {
        const tests = [
            // Original test for getting full iOS version number in iOS 2.0+
            /OS (\d+)_(\d+)_?(\d+)?/,
            // Test for iPads running iOS 13+ that can only get the major OS version
            /Version\/(\d+)/
        ];
        for (const test of tests) {
            const matches = RegExp(test).exec(navigator.appVersion);
            if (matches) {
                return [
                    parseInt(matches[1], 10),
                    parseInt(matches[2] || '0', 10),
                    parseInt(matches[3] || '0', 10)
                ];
            }
        }
    }
    return [];
}

// TODO: Split into smaller steps; kept as a single function so the TypeScript conversion stays a pure typing change.
// eslint-disable-next-line sonarjs/cognitive-complexity
function web0sVersion(browser: Browser): number | undefined {
    // Detect webOS version by web engine version

    // TODO: versionMajor is absent when no browser pattern matched, so it can be undefined here. Every comparison below
    // is then false and the function logs an error; that behavior is intentionally preserved.
    const versionMajor = browser.versionMajor as number;

    if (browser.chrome) {
        const userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.includes('netcast')) {
            // The built-in browser (NetCast) may have a version that doesn't correspond to the actual web engine
            // Since there is no reliable way to detect webOS version, we return an undefined version

            console.warn('Unable to detect webOS version - NetCast');

            return undefined;
        }

        // The next is only valid for the app

        if (versionMajor >= 120) {
            return 25;
        } else if (versionMajor >= 108) {
            return 24;
        } else if (versionMajor >= 94) {
            return 23;
        } else if (versionMajor >= 87) {
            return 22;
        } else if (versionMajor >= 79) {
            return 6;
        } else if (versionMajor >= 68) {
            return 5;
        } else if (versionMajor >= 53) {
            return 4;
        } else if (versionMajor >= 38) {
            return 3;
        } else if (versionMajor >= 34) {
            // webOS 2 browser
            return 2;
        } else if (versionMajor >= 26) {
            // webOS 1 browser
            return 1;
        }
    } else if (versionMajor >= 538) {
        // webOS 2 app
        return 2;
    } else if (versionMajor >= 537) {
        // webOS 1 app
        return 1;
    }

    console.error('Unable to detect webOS version');

    return undefined;
}

let _supportsCssAnimation: boolean | undefined;
let _supportsCssAnimationWithPrefix: boolean | undefined;
function supportsCssAnimation(allowPrefix?: boolean): boolean {
    // TODO: Assess if this is still needed, as all of our targets should natively support CSS animations.
    if (allowPrefix && (_supportsCssAnimationWithPrefix === true || _supportsCssAnimationWithPrefix === false)) {
        return _supportsCssAnimationWithPrefix;
    }
    if (_supportsCssAnimation === true || _supportsCssAnimation === false) {
        return _supportsCssAnimation;
    }

    let animation = false;
    const domPrefixes = ['Webkit', 'O', 'Moz'];
    const elm = document.createElement('div');

    // eslint-disable-next-line sonarjs/different-types-comparison
    if (elm.style.animationName !== undefined) {
        animation = true;
    }

    if (animation === false && allowPrefix) {
        for (const domPrefix of domPrefixes) {
            // Vendor prefixed properties are not part of the CSSStyleDeclaration type
            if ((elm.style as unknown as Record<string, unknown>)[domPrefix + 'AnimationName'] !== undefined) {
                animation = true;
                break;
            }
        }
    }

    if (allowPrefix) {
        _supportsCssAnimationWithPrefix = animation;
        return _supportsCssAnimationWithPrefix;
    } else {
        _supportsCssAnimation = animation;
        return _supportsCssAnimation;
    }
}

const uaMatch = function (ua: string) {
    // Motorola Edge device UA triggers false positive for Edge browser
    ua = ua.replace(/(motorola edge)/, '').trim();

    const match = /(edg)[ /]([\w.]+)/.exec(ua)
        || /(edga)[ /]([\w.]+)/.exec(ua)
        || /(edgios)[ /]([\w.]+)/.exec(ua)
        || /(edge)[ /]([\w.]+)/.exec(ua)
        || /(titanos)[ /]([\w.]+)/.exec(ua)
        || /(opera)[ /]([\w.]+)/.exec(ua)
        || /(opr)[ /]([\w.]+)/.exec(ua)
        || /(chrome)[ /]([\w.]+)/.exec(ua)
        || /(safari)[ /]([\w.]+)/.exec(ua)
        || /(firefox)[ /]([\w.]+)/.exec(ua)
        || !ua.includes('compatible') && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)
        || [];

    const versionMatch = /(version)[ /]([\w.]+)/.exec(ua);

    let platformMatch: RegExpExecArray | string[] = /(ipad)/.exec(ua)
        || /(iphone)/.exec(ua)
        || /(windows)/.exec(ua)
        || /(android)/.exec(ua)
        || /(titanos)/.exec(ua)
        || [];

    // The match groups are the alternation names of the patterns above
    let browser = (match[1] || '') as BrowserName | 'opr' | '';

    if (browser === 'edge') {
        platformMatch = [''];
    }

    if (browser === 'opr') {
        browser = 'opera';
    }

    let version: string | undefined;
    if (versionMatch && versionMatch.length > 2) {
        version = versionMatch[2];
    }

    version = version || match[2] || '0';

    let versionMajor = parseInt(version.split('.')[0], 10);

    if (isNaN(versionMajor)) {
        versionMajor = 0;
    }

    return {
        browser,
        version,
        // The match groups are the alternation names of the platform patterns above
        platform: (platformMatch[0] || '') as PlatformName | '',
        versionMajor
    };
};

// TODO: Split into smaller steps; kept as a single function so the TypeScript conversion stays a pure typing change.
// eslint-disable-next-line sonarjs/cognitive-complexity
export const detectBrowser = (userAgent = navigator.userAgent): Browser => {
    const normalizedUA = userAgent.toLowerCase();

    const matched = uaMatch(normalizedUA);
    // The result is populated incrementally below; every non-optional property is assigned before it is returned
    const browser = {} as Browser;

    if (matched.browser) {
        browser[matched.browser] = true;
        browser.version = matched.version;
        browser.versionMajor = matched.versionMajor;
    }

    if (matched.platform) {
        browser[matched.platform] = true;
    }

    browser.edgeChromium = browser.edg || browser.edga || browser.edgios;

    if (!browser.chrome && !browser.edgeChromium && !browser.edge && !browser.opera && normalizedUA.includes('webkit')) {
        browser.safari = true;
    }

    browser.osx = normalizedUA.includes('mac os x');

    // This is a workaround to detect iPads on iOS 13+ that report as desktop Safari
    // This may break in the future if Apple releases a touchscreen Mac
    // https://forums.developer.apple.com/thread/119186
    if (browser.osx && !browser.iphone && !browser.ipod && !browser.ipad && navigator.maxTouchPoints > 1) {
        browser.ipad = true;
    }

    if (isMobile(normalizedUA)) {
        browser.mobile = true;
    }

    browser.ps4 = normalizedUA.includes('playstation 4');
    browser.xboxOne = normalizedUA.includes('xbox');

    browser.animate = typeof document !== 'undefined' && document.documentElement.animate != null;
    browser.hisense = normalizedUA.includes('hisense');
    browser.tizen = normalizedUA.includes('tizen') || window.tizen != null;
    browser.vega = normalizedUA.includes('kepler');
    browser.vidaa = normalizedUA.includes('vidaa');
    browser.web0s = isWeb0s(normalizedUA);

    browser.tv = browser.ps4 || browser.vega || browser.xboxOne || isTv(normalizedUA);
    browser.operaTv = browser.tv && normalizedUA.includes('opr/');

    browser.edgeUwp = (browser.edge || browser.edgeChromium) && (normalizedUA.includes('msapphost') || normalizedUA.includes('webview'));

    if (browser.web0s) {
        browser.web0sVersion = web0sVersion(browser);

        // UserAgent string contains 'Chrome' and 'Safari', but we only want 'web0s' to be true
        delete browser.chrome;
        delete browser.safari;
    } else if (browser.tizen) {
        const v = RegExp(/Tizen (\d+).(\d+)/).exec(userAgent);
        // TODO: Known crash, intentionally preserved: v is null (so this throws a TypeError) when the user agent has no
        // case-sensitive 'Tizen X.Y' but tizen was detected via a lowercase user agent or window.tizen.
        browser.tizenVersion = parseInt(v![1], 10) + parseInt(v![2], 10) / 10;

        // UserAgent string contains 'Chrome' and 'Safari', but we only want 'tizen' to be true
        delete browser.chrome;
        delete browser.safari;
    } else if (browser.titanos) {
        // UserAgent string contains 'Opr' and 'Safari', but we only want 'titanos' to be true
        delete browser.operaTv;
        delete browser.safari;
    } else if (browser.vega) {
        // UserAgent string contains 'Chrome' and 'Safari', but we only want 'vega' to be true
        delete browser.chrome;
        delete browser.safari;
        // UserAgent string contains 'Mobile Chrome', but it is a TV
        delete browser.mobile;
    } else {
        browser.orsay = normalizedUA.includes('smarthub');
    }

    if (browser.mobile || browser.tv) {
        browser.slow = true;
    }

    if (typeof document !== 'undefined' && ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
        browser.touch = true;
    }

    browser.keyboard = hasKeyboard(browser);
    browser.supportsCssAnimation = supportsCssAnimation;

    browser.iOS = browser.ipad || browser.iphone || browser.ipod;

    if (browser.iOS) {
        // iOSversion() returns either an empty array or [major, minor, patch]
        const iOSVersion = iOSversion();
        browser.iOSVersion = iOSVersion.length === 0 ? iOSVersion : iOSVersion[0] + (iOSVersion[1] / 10);
    }

    return browser;
};

export default detectBrowser();
