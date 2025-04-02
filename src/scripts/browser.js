function isTv() {
    // This is going to be really difficult to get right
    const userAgent = navigator.userAgent.toLowerCase();

    // The OculusBrowsers userAgent also has the samsungbrowser defined but is not a tv.
    if (userAgent.indexOf('oculusbrowser') !== -1) {
        return false;
    }

    if (userAgent.indexOf('tv') !== -1) {
        return true;
    }

    if (userAgent.indexOf('samsungbrowser') !== -1) {
        return true;
    }

    if (userAgent.indexOf('viera') !== -1) {
        return true;
    }

    return isWeb0s();
}

function isWeb0s() {
    const userAgent = navigator.userAgent.toLowerCase();

    return userAgent.indexOf('netcast') !== -1
        || userAgent.indexOf('web0s') !== -1;
}

function isMobile(userAgent) {
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

    const lower = userAgent.toLowerCase();

    for (let i = 0, length = terms.length; i < length; i++) {
        if (lower.indexOf(terms[i]) !== -1) {
            return true;
        }
    }

    return false;
}

function hasKeyboard(browser) {
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

function iOSversion() {
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
                    parseInt(matches[2] || 0, 10),
                    parseInt(matches[3] || 0, 10)
                ];
            }
        }
    }
    return [];
}

function web0sVersion(browser) {
    // Detect webOS version by web engine version

    if (browser.chrome) {
        const userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.indexOf('netcast') !== -1) {
            // The built-in browser (NetCast) may have a version that doesn't correspond to the actual web engine
            // Since there is no reliable way to detect webOS version, we return an undefined version

            console.warn('Unable to detect webOS version - NetCast');

            return undefined;
        }

        // The next is only valid for the app

        if (browser.versionMajor >= 94) {
            return 23;
        } else if (browser.versionMajor >= 87) {
            return 22;
        } else if (browser.versionMajor >= 79) {
            return 6;
        } else if (browser.versionMajor >= 68) {
            return 5;
        } else if (browser.versionMajor >= 53) {
            return 4;
        } else if (browser.versionMajor >= 38) {
            return 3;
        } else if (browser.versionMajor >= 34) {
            // webOS 2 browser
            return 2;
        } else if (browser.versionMajor >= 26) {
            // webOS 1 browser
            return 1;
        }
    } else if (browser.versionMajor >= 538) {
        // webOS 2 app
        return 2;
    } else if (browser.versionMajor >= 537) {
        // webOS 1 app
        return 1;
    }

    console.error('Unable to detect webOS version');

    return undefined;
}

let _supportsCssAnimation;
let _supportsCssAnimationWithPrefix;
function supportsCssAnimation(allowPrefix) {
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
            if (elm.style[domPrefix + 'AnimationName'] !== undefined) {
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

const uaMatch = function (ua) {
    ua = ua.toLowerCase();

    ua = ua.replace(/(motorola edge)/, '').trim();

    const match = /(edg)[ /]([\w.]+)/.exec(ua)
        || /(edga)[ /]([\w.]+)/.exec(ua)
        || /(edgios)[ /]([\w.]+)/.exec(ua)
        || /(edge)[ /]([\w.]+)/.exec(ua)
        || /(opera)[ /]([\w.]+)/.exec(ua)
        || /(opr)[ /]([\w.]+)/.exec(ua)
        || /(chrome)[ /]([\w.]+)/.exec(ua)
        || /(safari)[ /]([\w.]+)/.exec(ua)
        || /(firefox)[ /]([\w.]+)/.exec(ua)
        || ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)
        || [];

    const versionMatch = /(version)[ /]([\w.]+)/.exec(ua);

    let platformMatch = /(ipad)/.exec(ua)
        || /(iphone)/.exec(ua)
        || /(windows)/.exec(ua)
        || /(android)/.exec(ua)
        || [];

    let browser = match[1] || '';

    if (browser === 'edge') {
        platformMatch = [''];
    }

    if (browser === 'opr') {
        browser = 'opera';
    }

    let version;
    if (versionMatch && versionMatch.length > 2) {
        version = versionMatch[2];
    }

    version = version || match[2] || '0';

    let versionMajor = parseInt(version.split('.')[0], 10);

    if (isNaN(versionMajor)) {
        versionMajor = 0;
    }

    return {
        browser: browser,
        version: version,
        platform: platformMatch[0] || '',
        versionMajor: versionMajor
    };
};

const userAgent = navigator.userAgent;

const matched = uaMatch(userAgent);
const browser = {};

if (matched.browser) {
    browser[matched.browser] = true;
    browser.version = matched.version;
    browser.versionMajor = matched.versionMajor;
}

if (matched.platform) {
    browser[matched.platform] = true;
}

browser.edgeChromium = browser.edg || browser.edga || browser.edgios;

if (!browser.chrome && !browser.edgeChromium && !browser.edge && !browser.opera && userAgent.toLowerCase().indexOf('webkit') !== -1) {
    browser.safari = true;
}

browser.osx = userAgent.toLowerCase().indexOf('mac os x') !== -1;

// This is a workaround to detect iPads on iOS 13+ that report as desktop Safari
// This may break in the future if Apple releases a touchscreen Mac
// https://forums.developer.apple.com/thread/119186
if (browser.osx && !browser.iphone && !browser.ipod && !browser.ipad && navigator.maxTouchPoints > 1) {
    browser.ipad = true;
}

if (userAgent.toLowerCase().indexOf('playstation 4') !== -1) {
    browser.ps4 = true;
    browser.tv = true;
}

if (isMobile(userAgent)) {
    browser.mobile = true;
}

if (userAgent.toLowerCase().indexOf('xbox') !== -1) {
    browser.xboxOne = true;
    browser.tv = true;
}
browser.animate = typeof document !== 'undefined' && document.documentElement.animate != null;
browser.hisense = userAgent.toLowerCase().includes('hisense');
browser.tizen = userAgent.toLowerCase().indexOf('tizen') !== -1 || window.tizen != null;
browser.vidaa = userAgent.toLowerCase().includes('vidaa');
browser.web0s = isWeb0s();
browser.edgeUwp = browser.edge && (userAgent.toLowerCase().indexOf('msapphost') !== -1 || userAgent.toLowerCase().indexOf('webview') !== -1);

if (browser.web0s) {
    browser.web0sVersion = web0sVersion(browser);

    // UserAgent string contains 'Chrome' and 'Safari', but we only want 'web0s' to be true
    delete browser.chrome;
    delete browser.safari;
} else if (browser.tizen) {
    const v = RegExp(/Tizen (\d+).(\d+)/).exec(userAgent);
    browser.tizenVersion = parseInt(v[1], 10) + parseInt(v[2], 10) / 10;

    // UserAgent string contains 'Chrome' and 'Safari', but we only want 'tizen' to be true
    delete browser.chrome;
    delete browser.safari;
} else {
    browser.orsay = userAgent.toLowerCase().indexOf('smarthub') !== -1;
}

if (browser.edgeUwp) {
    browser.edge = true;
}

browser.tv = isTv();
browser.operaTv = browser.tv && userAgent.toLowerCase().indexOf('opr/') !== -1;

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
    browser.iOSVersion = iOSversion();

    if (browser.iOSVersion && browser.iOSVersion.length >= 2) {
        browser.iOSVersion = browser.iOSVersion[0] + (browser.iOSVersion[1] / 10);
    }
}

export default browser;
