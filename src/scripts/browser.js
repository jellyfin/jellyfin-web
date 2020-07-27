define([], function () {
    'use strict';

    function isTv() {

        // This is going to be really difficult to get right
        var userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.indexOf('tv') !== -1) {
            return true;
        }

        if (userAgent.indexOf('samsungbrowser') !== -1) {
            return true;
        }

        if (userAgent.indexOf('viera') !== -1) {
            return true;
        }

        if (userAgent.indexOf('web0s') !== -1) {
            return true;
        }

        return false;
    }

    function isMobile(userAgent) {
        var terms = [
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

        var lower = userAgent.toLowerCase();

        for (var i = 0, length = terms.length; i < length; i++) {
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

        if (browser.tv) {
            return true;
        }

        return false;
    }

    function iOSversion() {
        // MacIntel: Apple iPad Pro 11 iOS 13.1
        if (/iP(hone|od|ad)|MacIntel/.test(navigator.platform)) {
            // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
            var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
        }
    }

    var _supportsCssAnimation;
    var _supportsCssAnimationWithPrefix;
    function supportsCssAnimation(allowPrefix) {
        // TODO: Assess if this is still needed, as all of our targets should natively support CSS animations.
        if (allowPrefix) {
            if (_supportsCssAnimationWithPrefix === true || _supportsCssAnimationWithPrefix === false) {
                return _supportsCssAnimationWithPrefix;
            }
        } else {
            if (_supportsCssAnimation === true || _supportsCssAnimation === false) {
                return _supportsCssAnimation;
            }
        }

        var animation = false;
        var animationstring = 'animation';
        var keyframeprefix = '';
        var domPrefixes = ['Webkit', 'O', 'Moz'];
        var pfx = '';
        var elm = document.createElement('div');

        if (elm.style.animationName !== undefined) {
            animation = true;
        }

        if (animation === false && allowPrefix) {
            for (var i = 0; i < domPrefixes.length; i++) {
                if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                    pfx = domPrefixes[i];
                    animationstring = pfx + 'Animation';
                    keyframeprefix = '-' + pfx.toLowerCase() + '-';
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

    var uaMatch = function (ua) {
        ua = ua.toLowerCase();

        var match = /(edg)[ \/]([\w.]+)/.exec(ua) ||
            /(edga)[ \/]([\w.]+)/.exec(ua) ||
            /(edgios)[ \/]([\w.]+)/.exec(ua) ||
            /(edge)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)[ \/]([\w.]+)/.exec(ua) ||
            /(opr)[ \/]([\w.]+)/.exec(ua) ||
            /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(safari)[ \/]([\w.]+)/.exec(ua) ||
            /(firefox)[ \/]([\w.]+)/.exec(ua) ||
            ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
            [];

        var versionMatch = /(version)[ \/]([\w.]+)/.exec(ua);

        var platform_match = /(ipad)/.exec(ua) ||
            /(iphone)/.exec(ua) ||
            /(windows)/.exec(ua) ||
            /(android)/.exec(ua) ||
            [];

        var browser = match[1] || '';

        if (browser === 'edge') {
            platform_match = [''];
        }

        if (browser === 'opr') {
            browser = 'opera';
        }

        var version;
        if (versionMatch && versionMatch.length > 2) {
            version = versionMatch[2];
        }

        version = version || match[2] || '0';

        var versionMajor = parseInt(version.split('.')[0]);

        if (isNaN(versionMajor)) {
            versionMajor = 0;
        }

        return {
            browser: browser,
            version: version,
            platform: platform_match[0] || '',
            versionMajor: versionMajor
        };
    };

    var userAgent = navigator.userAgent;

    var matched = uaMatch(userAgent);
    var browser = {};

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
    browser.tizen = userAgent.toLowerCase().indexOf('tizen') !== -1 || self.tizen != null;
    browser.web0s = userAgent.toLowerCase().indexOf('Web0S'.toLowerCase()) !== -1;
    browser.edgeUwp = browser.edge && (userAgent.toLowerCase().indexOf('msapphost') !== -1 || userAgent.toLowerCase().indexOf('webview') !== -1);

    if (!browser.tizen) {
        browser.orsay = userAgent.toLowerCase().indexOf('smarthub') !== -1;
    } else {
        var v = (navigator.appVersion).match(/Tizen (\d+).(\d+)/);
        browser.tizenVersion = parseInt(v[1]);
    }

    if (browser.edgeUwp) {
        browser.edge = true;
    }

    browser.tv = isTv();
    browser.operaTv = browser.tv && userAgent.toLowerCase().indexOf('opr/') !== -1;

    if (browser.mobile || browser.tv) {
        browser.slow = true;
    }

    if (typeof document !== 'undefined') {
        /* eslint-disable-next-line compat/compat */
        if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
            browser.touch = true;
        }
    }

    browser.keyboard = hasKeyboard(browser);
    browser.supportsCssAnimation = supportsCssAnimation;

    browser.osx = userAgent.toLowerCase().indexOf('os x') !== -1;
    browser.iOS = browser.ipad || browser.iphone || browser.ipod;

    if (browser.iOS) {
        browser.iOSVersion = iOSversion();

        if (browser.iOSVersion && browser.iOSVersion.length >= 2) {
            browser.iOSVersion = browser.iOSVersion[0] + (browser.iOSVersion[1] / 10);
        }
    }

    browser.chromecast = browser.chrome && userAgent.toLowerCase().indexOf('crkey') !== -1;

    return browser;
});
