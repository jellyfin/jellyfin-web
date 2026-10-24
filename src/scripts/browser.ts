import { UAParser } from 'ua-parser-js';
// eslint-disable-next-line import/no-unresolved -- This is a typed UAParser package export.
import { BrowserName, DeviceType, DeviceVendor, EngineName, OSName } from 'ua-parser-js/enums';

interface BrowserInfo {
    android?: boolean;
    animate?: boolean;
    chrome?: boolean;
    edg?: boolean;
    edga?: boolean;
    edge?: boolean;
    edgeChromium?: boolean;
    edgeUwp?: boolean;
    edgios?: boolean;
    firefox?: boolean;
    hisense?: boolean;
    iOS?: boolean;
    iOSVersion?: number | number[];
    ipad?: boolean;
    iphone?: boolean;
    ipod?: boolean;
    keyboard?: boolean;
    mobile?: boolean;
    mozilla?: boolean;
    opera?: boolean;
    operaTv?: boolean;
    osx?: boolean;
    ps4?: boolean;
    safari?: boolean;
    slow?: boolean;
    supportsCssAnimation?: (allowPrefix?: boolean) => boolean;
    titanos?: boolean;
    tizen?: boolean;
    tizenVersion?: number;
    touch?: boolean;
    tv?: boolean;
    vega?: boolean;
    version?: string;
    versionMajor?: number;
    vidaa?: boolean;
    web0s?: boolean;
    web0sVersion?: number;
    windows?: boolean;
    xboxOne?: boolean;
}

function hasKeyboard(browser: BrowserInfo): boolean {
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

const webOsChromeVersions: ReadonlyArray<readonly [number, number]> = [
    [132, 26], [120, 25], [108, 24], [94, 23], [87, 22], [79, 6], [68, 5], [53, 4], [38, 3], [34, 2], [26, 1]
];

function web0sChromeVersion(versionMajor: number): number | undefined {
    return webOsChromeVersions.find(([minimumVersion]) => versionMajor >= minimumVersion)?.[1];
}

function web0sVersion(browser: BrowserInfo, parsedVersion?: string): number | undefined {
    // Detect webOS version by web engine version

    const explicitVersion = Number.parseFloat(parsedVersion ?? '');
    if (Number.isFinite(explicitVersion)) return explicitVersion;

    const versionMajor = browser.versionMajor ?? 0;

    if (browser.chrome) {
        const detectedVersion = web0sChromeVersion(versionMajor);
        if (detectedVersion !== undefined) return detectedVersion;
    }

    if (!browser.chrome && versionMajor >= 538) {
        // webOS 2 app
        return 2;
    }

    if (!browser.chrome && versionMajor >= 537) {
        // webOS 1 app
        return 1;
    }

    console.error('Unable to detect webOS version');

    return undefined;
}

let _supportsCssAnimation: boolean | undefined;
let _supportsCssAnimationWithPrefix: boolean | undefined;
function supportsCssAnimation(allowPrefix?: boolean): boolean {
    // Keep runtime detection while Chrome 27/38 and webOS 1/2 remain supported.
    // Older webOS engines require prefixed CSS animations:
    // https://webostv.developer.lge.com/develop/guides/backward-compatibility
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
            if ((elm.style as unknown as Record<string, string | undefined>)[domPrefix + 'AnimationName'] !== undefined) {
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

type BrowserFlag = 'chrome' | 'edge' | 'edg' | 'edga' | 'edgios' | 'firefox' | 'mozilla' | 'opera' | 'safari' | 'titanos';
type UAParserResult = ReturnType<UAParser['getResult']>;

function browserKey(name: string | undefined, userAgent: string): BrowserFlag | undefined {
    if (userAgent.includes('titanos')) {
        return 'titanos';
    }

    switch (name) {
        case BrowserName.EDGE:
        case BrowserName.EDGE_WEBVIEW:
        case BrowserName.EDGE_WEBVIEW2:
            if (userAgent.includes('edga/')) return 'edga';
            if (userAgent.includes('edgios/')) return 'edgios';
            return userAgent.includes('edg/') ? 'edg' : 'edge';
        case BrowserName.OPERA:
        case BrowserName.OPERA_MINI:
        case BrowserName.OPERA_MOBI:
        case BrowserName.OPERA_TABLET:
            return 'opera';
        case BrowserName.CHROME:
        case BrowserName.CHROME_MOBILE:
        case BrowserName.CHROME_WEBVIEW:
        case BrowserName.SAMSUNG:
            return 'chrome';
        case BrowserName.SAFARI:
        case BrowserName.SAFARI_MOBILE:
            return 'safari';
        case BrowserName.FIREFOX:
        case BrowserName.FIREFOX_MOBILE:
            return 'firefox';
        case BrowserName.PALEMOON:
            return 'mozilla';
        default:
            return name === undefined && !userAgent.includes('compatible') && userAgent.includes('mozilla') ? 'mozilla' : undefined;
    }
}

function isMobileDevice(result: UAParserResult): boolean {
    return result.device.type === DeviceType.MOBILE
        || result.device.type === DeviceType.TABLET
        || result.device.type === DeviceType.XR
        || result.browser.name === BrowserName.KINDLE
        || result.browser.name === BrowserName.OPERA_MINI
        || result.browser.name === BrowserName.OPERA_MOBI
        || result.browser.name === BrowserName.SILK;
}

function osVersionParts(version: string | undefined): number[] {
    if (!version) return [];

    return version.split('.').map(part => Number.parseInt(part, 10));
}

function legacyVersion(browserName: string | undefined, key: BrowserFlag, userAgent: string, parsedVersion: string | undefined): string {
    let token: string | undefined;
    if (key === 'titanos') token = 'titanos';
    if (browserName === BrowserName.SAMSUNG) token = 'chrome';

    if (userAgent.includes('tizen')) {
        const version = /(?:version|samsungbrowser)\/([\w.]+)/.exec(userAgent)?.[1]
            ?? /\) ([\d.]+)\/[\d.]+ tv /.exec(userAgent)?.[1];
        if (version) return version;
    }

    if (token) {
        // UAParser identifies the branded browser, while callers historically received the embedded engine version.
        const version = new RegExp(String.raw`${token}/([\w.]+)`).exec(userAgent)?.[1];
        if (version) return version;
    }

    if ((browserName === BrowserName.SAFARI || browserName === BrowserName.SAFARI_MOBILE) && parsedVersion === '1') {
        const version = /safari\/([\w.]+)/.exec(userAgent)?.[1];
        if (version) return version;
    }

    return parsedVersion ?? '0';
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- Explicit legacy flag aliases form the public contract.
function setBrowserAndPlatform(browserInfo: BrowserInfo, userAgent: string, result: UAParserResult): void {
    const { browser: parsedBrowser, device, os } = result;
    const key = browserKey(parsedBrowser.name, userAgent);

    if (key) {
        browserInfo[key] = true;
        browserInfo.version = legacyVersion(parsedBrowser.name, key, userAgent, parsedBrowser.version);
        browserInfo.versionMajor = Number.parseInt(browserInfo.version, 10) || 0;
    }

    // Legacy Edge intentionally omitted the Windows platform flag.
    if (key !== 'edge') {
        if (os.is(OSName.WINDOWS) || userAgent.includes('windows')) browserInfo.windows = true;
        if (os.is(OSName.ANDROID)) browserInfo.android = true;
        if (os.is(OSName.IOS) && device.vendor === DeviceVendor.APPLE) {
            if (device.model === 'iPad') browserInfo.ipad = true;
            if (device.model === 'iPhone') browserInfo.iphone = true;
            if (device.model?.startsWith('iPod')) browserInfo.ipod = true;
        }
        if (userAgent.includes('titanos')) browserInfo.titanos = true;
    }
}

function setDeviceFlags(browserInfo: BrowserInfo, userAgent: string, result: UAParserResult): void {
    const { browser, device, os } = result;

    browserInfo.ps4 = os.is(OSName.PLAYSTATION) && device.model === 'PlayStation 4';
    browserInfo.xboxOne = os.is(OSName.XBOX) || device.vendor === DeviceVendor.XBOX || userAgent.includes('xbox');
    browserInfo.hisense = device.vendor === DeviceVendor.HISENSE || userAgent.includes('hisense');
    browserInfo.tizen = os.is(OSName.TIZEN) || (window as Window & typeof globalThis & { tizen?: unknown }).tizen != null;
    browserInfo.vega = os.is(OSName.VEGA_OS);
    browserInfo.vidaa = userAgent.includes('vidaa');
    browserInfo.web0s = os.is(OSName.WEBOS);

    if (isMobileDevice(result)) browserInfo.mobile = true;

    browserInfo.tv = device.type === DeviceType.SMARTTV
        || browserInfo.ps4
        || browserInfo.vega
        || browserInfo.xboxOne
        || browserInfo.titanos
        || browserInfo.web0s;
    browserInfo.operaTv = !!browserInfo.tv && browser.is(BrowserName.OPERA);
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- Preserve the existing device-specific detection order.
export const detectBrowser = (userAgent = navigator.userAgent) => {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const normalizedUA = userAgent.toLowerCase();

    const browser: BrowserInfo = {};
    setBrowserAndPlatform(browser, normalizedUA, result);

    browser.edgeChromium = browser.edg || browser.edga || browser.edgios;

    if (!browser.chrome && !browser.edgeChromium && !browser.edge && !browser.firefox && !browser.mozilla && !browser.opera && !browser.titanos && result.engine.is(EngineName.WEBKIT)) {
        browser.safari = true;
    }

    browser.osx = result.os.is(OSName.MACOS) || result.os.is(OSName.IOS);

    // This is a workaround to detect iPads on iOS 13+ that report as desktop Safari
    // This may break in the future if Apple releases a touchscreen Mac
    // https://forums.developer.apple.com/thread/119186
    if (browser.osx && !browser.iphone && !browser.ipod && !browser.ipad && navigator.maxTouchPoints > 1) {
        browser.ipad = true;
    }

    browser.animate = typeof document !== 'undefined' && document.documentElement.animate != null;
    setDeviceFlags(browser, normalizedUA, result);

    browser.edgeUwp = (browser.edge || browser.edgeChromium) && (
        result.browser.is(BrowserName.EDGE_WEBVIEW)
        || result.browser.is(BrowserName.EDGE_WEBVIEW2)
        || normalizedUA.includes('msapphost')
        || normalizedUA.includes('webview')
    );

    if (browser.web0s) {
        browser.web0sVersion = web0sVersion(browser, result.os.version);

        // UserAgent string contains 'Chrome' and 'Safari', but we only want 'web0s' to be true
        delete browser.chrome;
        delete browser.safari;
    } else if (browser.tizen) {
        const [major = '0', minor = '0'] = result.os.version?.split('.') ?? [];
        browser.tizenVersion = Number.parseInt(major, 10) + Number.parseInt(minor, 10) / 10;

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
        const version = /cpu (?:iphone )?os ([\d_]+)/i.exec(userAgent)?.[1].replace(/_/g, '.')
            ?? (result.os.is(OSName.IOS) ? result.os.version : result.browser.major);
        const versionParts = osVersionParts(version);
        browser.iOSVersion = versionParts.length > 0 ? versionParts[0] + (versionParts[1] ?? 0) / 10 : [];
    }

    return browser;
};

export default detectBrowser();
