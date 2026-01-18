// Browser detection utilities

function isTv(userAgent: string): boolean {
    // This is going to be really difficult to get right

    // The OculusBrowsers userAgent also has the samsungbrowser defined but is not a tv.
    if (userAgent.includes('oculusbrowser')) {
        return false;
    }

    if (userAgent.includes('tv')) {
        return true;
    }

    if (userAgent.includes('samsungbrowser')) {
        return true;
    }

    if (userAgent.includes('viera')) {
        return true;
    }

    if (userAgent.includes('titanos')) {
        return true;
    }

    if (userAgent.includes('kepler')) {
        return true;
    }

    return isWeb0s(userAgent);
}

function isWeb0s(userAgent: string): boolean {
    return userAgent.includes('netcast')
        || userAgent.includes('web0s');
}

function isMobile(userAgent: string): boolean {
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

// Additional functions would be converted with proper types...

const userAgent = navigator.userAgent.toLowerCase();

const browser = {
    tv: isTv(userAgent),
    web0s: isWeb0s(userAgent),
    mobile: isMobile(userAgent),
    // Additional properties...
    chrome: userAgent.includes('chrome'),
    safari: userAgent.includes('safari') && !userAgent.includes('chrome'),
    firefox: userAgent.includes('firefox'),
    edge: userAgent.includes('edg'),
    edgeChromium: userAgent.includes('edg'),
    tizen: userAgent.includes('tizen'),
    touch: 'ontouchstart' in window,
    iOS: userAgent.includes('ipad') || userAgent.includes('iphone') || userAgent.includes('ipod'),
    ps4: userAgent.includes('playstation 4'),
    tizenVersion: userAgent.match(/tizen\/(\d+)/)?.[1] || '',
    titanos: userAgent.includes('titanos'),
    operaTv: userAgent.includes('opr/') || userAgent.includes('opera'),
    vega: userAgent.includes('vega'),
    xboxOne: userAgent.includes('xbox')
};

export const detectBrowser = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    return {
        tv: isTv(ua),
        web0s: isWeb0s(ua),
        mobile: isMobile(ua),
        chrome: ua.includes('chrome'),
        safari: ua.includes('safari') && !ua.includes('chrome'),
        firefox: ua.includes('firefox'),
        edge: ua.includes('edg'),
        edgeChromium: ua.includes('edg'),
        tizen: ua.includes('tizen'),
        touch: false, // Can't detect from UA
        iOS: ua.includes('ipad') || ua.includes('iphone') || ua.includes('ipod'),
        ps4: ua.includes('playstation 4'),
        tizenVersion: ua.match(/tizen\/(\d+)/)?.[1] || '',
        titanos: ua.includes('titanos'),
        operaTv: ua.includes('opr/') || ua.includes('opera'),
        vega: ua.includes('vega') || ua.includes('kepler'),
        xboxOne: ua.includes('xbox')
    };
};

export default browser;
