import { AppFeature } from 'constants/appFeature';
import { LayoutMode } from 'constants/layoutMode';
import * as htmlMediaHelper from '../components/htmlMediaHelper';
import globalize from '../lib/globalize';
import browser from '../scripts/browser';
import profileBuilder from '../scripts/browserDeviceProfile';
import appSettings from '../scripts/settings/appSettings';
import * as webSettings from '../scripts/settings/webSettings';
import Events from '../utils/events';
import { logger } from '../utils/logger';
import alert from './alert';

const appName = 'Jellyfin Web';

const BrowserName: Record<string, string> = {
    tizen: 'Samsung Smart TV',
    web0s: 'LG Smart TV',
    titanos: 'Titan OS',
    vega: 'Vega OS',
    operaTv: 'Opera TV',
    xboxOne: 'Xbox One',
    ps4: 'Sony PS4',
    chrome: 'Chrome',
    edgeChromium: 'Edge Chromium',
    edge: 'Edge',
    firefox: 'Firefox',
    opera: 'Opera',
    safari: 'Safari'
};

function getBaseProfileOptions(item: any) {
    const disableHlsVideoAudioCodecs: string[] = [];

    if (item && htmlMediaHelper.enableHlsJsPlayer(item.RunTimeTicks, item.MediaType)) {
        if (browser.edge) {
            disableHlsVideoAudioCodecs.push('mp3');
        }
        if (!browser.edgeChromium) {
            disableHlsVideoAudioCodecs.push('ac3');
            disableHlsVideoAudioCodecs.push('eac3');
        }
        if (!(browser.chrome || browser.edgeChromium || browser.firefox)) {
            disableHlsVideoAudioCodecs.push('opus');
        }
    }

    return {
        enableMkvProgressive: false,
        disableHlsVideoAudioCodecs: disableHlsVideoAudioCodecs
    };
}

function getDeviceProfile(item: any): Promise<any> {
    return new Promise((resolve) => {
        let profile: any;

        if (window.NativeShell?.AppHost?.getDeviceProfile) {
            profile = window.NativeShell.AppHost.getDeviceProfile(
                profileBuilder,
                window.__PACKAGE_JSON_VERSION__ || ''
            );
        } else {
            const builderOpts = getBaseProfileOptions(item);
            profile = profileBuilder(builderOpts);
        }

        const maxVideoWidth = parseInt(appSettings.maxVideoWidth() || '0', 10);
        const maxTranscodingVideoWidth =
            maxVideoWidth < 0 ? appHost.screen()?.maxAllowedWidth : maxVideoWidth;

        if (maxTranscodingVideoWidth) {
            const conditionWidth = {
                Condition: 'LessThanEqual',
                Property: 'Width',
                Value: maxTranscodingVideoWidth.toString(),
                IsRequired: false
            };

            if (appSettings.limitSupportedVideoResolution()) {
                profile.CodecProfiles.push({
                    Type: 'Video',
                    Conditions: [conditionWidth]
                });
            }

            profile.TranscodingProfiles.forEach((transcodingProfile: any) => {
                if (transcodingProfile.Type === 'Video') {
                    transcodingProfile.Conditions = (transcodingProfile.Conditions || []).filter(
                        (condition: any) => {
                            return condition.Property !== 'Width';
                        }
                    );

                    transcodingProfile.Conditions.push(conditionWidth);
                }
            });
        }

        const preferredTranscodeVideoCodec = appSettings.preferredTranscodeVideoCodec();
        if (preferredTranscodeVideoCodec) {
            profile.TranscodingProfiles.forEach((transcodingProfile: any) => {
                if (transcodingProfile.Type === 'Video') {
                    const videoCodecs = (transcodingProfile.VideoCodec as string).split(',');
                    const index = videoCodecs.indexOf(preferredTranscodeVideoCodec);
                    if (index !== -1) {
                        videoCodecs.splice(index, 1);
                        videoCodecs.unshift(preferredTranscodeVideoCodec);
                        transcodingProfile.VideoCodec = videoCodecs.join(',');
                    }
                }
            });
        }

        const preferredTranscodeVideoAudioCodec = appSettings.preferredTranscodeVideoAudioCodec();
        if (preferredTranscodeVideoAudioCodec) {
            profile.TranscodingProfiles.forEach((transcodingProfile: any) => {
                if (transcodingProfile.Type === 'Video') {
                    const audioCodecs = (transcodingProfile.AudioCodec as string).split(',');
                    const index = audioCodecs.indexOf(preferredTranscodeVideoAudioCodec);
                    if (index !== -1) {
                        audioCodecs.splice(index, 1);
                        audioCodecs.unshift(preferredTranscodeVideoAudioCodec);
                        transcodingProfile.AudioCodec = audioCodecs.join(',');
                    }
                }
            });
        }

        resolve(profile);
    });
}

function generateDeviceId() {
    const keys = [];

    keys.push(navigator.userAgent);
    keys.push(new Date().getTime());
    if (typeof window.btoa === 'function') {
        return btoa(keys.join('|')).replaceAll('=', '1');
    }

    return new Date().getTime().toString();
}

function getDeviceId() {
    if (!deviceId) {
        const key = '_deviceId2';

        const val = appSettings.get(key);

        if (!val) {
            deviceId = generateDeviceId();
            appSettings.set(key, deviceId);
        } else {
            deviceId = val;
        }
    }

    return deviceId;
}

function getDeviceName() {
    if (deviceName) {
        return deviceName;
    }

    deviceName = 'Web Browser'; // Default device name

    for (const key in BrowserName) {
        if ((browser as any)[key]) {
            deviceName = BrowserName[key];
            break;
        }
    }

    if ((browser as any).ipad) {
        deviceName += ' iPad';
    } else if ((browser as any).iphone) {
        deviceName += ' iPhone';
    } else if ((browser as any).android) {
        deviceName += ' Android';
    }
    return deviceName;
}

function supportsFullscreen() {
    if (browser.tv) {
        return false;
    }

    const element = document.documentElement as any;
    return !!(
        element.requestFullscreen ||
        element.mozRequestFullScreen ||
        element.webkitRequestFullscreen ||
        element.msRequestFullscreen ||
        document.createElement('video').webkitEnterFullscreen
    );
}

function getDefaultLayout() {
    return LayoutMode.Experimental;
}

function supportsHtmlMediaAutoplay() {
    if (
        (browser as any).edgeUwp ||
        browser.tizen ||
        browser.web0s ||
        (browser as any).orsay ||
        (browser as any).operaTv ||
        (browser as any).ps4 ||
        (browser as any).xboxOne
    ) {
        return true;
    }

    return !browser.mobile;
}

function supportsCue() {
    try {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }
        const video = document.createElement('video');
        const style = document.createElement('style');

        style.textContent = 'video::cue {background: inherit}';
        document.body.appendChild(style);
        document.body.appendChild(video);

        const cue = window.getComputedStyle(video, '::cue').background;
        document.body.removeChild(style);
        document.body.removeChild(video);

        return !!cue.length;
    } catch (err) {
        logger.error('Error detecting cue support', { component: 'AppHost' }, err as Error);
        return false;
    }
}

function onAppVisible() {
    if (isHidden) {
        isHidden = false;
        Events.trigger(appHost as any, 'resume');
    }
}

function onAppHidden() {
    if (!isHidden) {
        isHidden = true;
    }
}

const supportedFeatures = (function () {
    const features: string[] = [];

    if (typeof navigator.share === 'function') {
        features.push(AppFeature.Sharing);
    }

    if (
        !(browser as any).edgeUwp &&
        !browser.tv &&
        !(browser as any).xboxOne &&
        !(browser as any).ps4
    ) {
        features.push(AppFeature.FileDownload);
    }

    if ((browser as any).operaTv || browser.tizen || (browser as any).orsay || browser.web0s) {
        features.push(AppFeature.Exit);
    }

    if (
        !(browser as any).operaTv &&
        !browser.tizen &&
        !(browser as any).orsay &&
        !browser.web0s &&
        !(browser as any).ps4
    ) {
        features.push(AppFeature.ExternalLinks);
    }

    if (supportsHtmlMediaAutoplay()) {
        features.push(AppFeature.HtmlAudioAutoplay);
        features.push(AppFeature.HtmlVideoAutoplay);
    }

    if (supportsFullscreen()) {
        features.push(AppFeature.Fullscreen);
    }

    if (
        browser.tv ||
        (browser as any).xboxOne ||
        (browser as any).ps4 ||
        browser.mobile ||
        (browser as any).ipad
    ) {
        features.push(AppFeature.PhysicalVolumeControl);
    }

    if (!browser.tv && !(browser as any).xboxOne && !(browser as any).ps4) {
        features.push(AppFeature.RemoteControl);
    }

    if (
        !(browser as any).operaTv &&
        !browser.tizen &&
        !(browser as any).orsay &&
        !browser.web0s &&
        !(browser as any).edgeUwp
    ) {
        features.push(AppFeature.RemoteVideo);
    }

    features.push(AppFeature.DisplayLanguage);
    features.push(AppFeature.DisplayMode);
    features.push(AppFeature.TargetBlank);
    features.push(AppFeature.Screensaver);

    webSettings.getMultiServer().then((enabled) => {
        if (enabled) features.push(AppFeature.MultiServer);
    });

    if (
        !(browser as any).orsay &&
        (browser.firefox || (browser as any).ps4 || browser.edge || supportsCue())
    ) {
        features.push(AppFeature.SubtitleAppearance);
    }

    if (!(browser as any).orsay) {
        features.push(AppFeature.SubtitleBurnIn);
    }

    if (!browser.tv && !(browser as any).ps4 && !(browser as any).xboxOne) {
        features.push(AppFeature.FileInput);
    }

    if (browser.chrome || browser.edgeChromium) {
        features.push(AppFeature.Chromecast);
    }

    return features;
})();

/**
 * Do exit according to platform
 */
function doExit() {
    try {
        if (window.NativeShell?.AppHost?.exit) {
            window.NativeShell.AppHost.exit();
        } else if (browser.tizen) {
            window.tizen.application.getCurrentApplication().exit();
        } else if (browser.web0s) {
            window.webOS.platformBack();
        } else {
            window.close();
        }
    } catch (err) {
        logger.error('Error closing application', { component: 'AppHost' }, err as Error);
    }
}

let exitPromise: Promise<void> | null = null;

/**
 * Ask user for exit
 */
function askForExit() {
    if (exitPromise) {
        return;
    }

    import('../components/actionSheet/actionSheet').then((actionsheet) => {
        exitPromise = (actionsheet.default as any)
            .show({
                title: globalize.translate('MessageConfirmAppExit'),
                items: [
                    { id: 'yes', name: globalize.translate('Yes') },
                    { id: 'no', name: globalize.translate('No') }
                ]
            })
            .then((value: string) => {
                if (value === 'yes') {
                    doExit();
                }
            })
            .finally(() => {
                exitPromise = null;
            });
    });
}

let deviceId: string;
let deviceName: string;

export const appHost = {
    getWindowState: function () {
        return (document as any).windowState || 'Normal';
    },
    setWindowState: function () {
        alert({ text: 'setWindowState is not supported and should not be called' });
    },
    exit: function () {
        if (!!window.appMode && browser.tizen) {
            askForExit();
        } else {
            doExit();
        }
    },
    supports: function (command: string) {
        if (window.NativeShell?.AppHost?.supports) {
            return window.NativeShell.AppHost.supports(command);
        }

        return supportedFeatures.indexOf(command.toLowerCase()) !== -1;
    },
    preferVisualCards: (browser as any).android || browser.chrome,
    getDefaultLayout: function () {
        if (window.NativeShell?.AppHost?.getDefaultLayout) {
            return window.NativeShell.AppHost.getDefaultLayout();
        }

        return getDefaultLayout();
    },
    getDeviceProfile,
    init: function () {
        if (window.NativeShell?.AppHost?.init) {
            return window.NativeShell.AppHost.init();
        }

        return {
            deviceId: getDeviceId(),
            deviceName: getDeviceName()
        };
    },
    deviceName: function () {
        return window.NativeShell?.AppHost?.deviceName
            ? window.NativeShell.AppHost.deviceName()
            : getDeviceName();
    },
    deviceId: function () {
        return window.NativeShell?.AppHost?.deviceId
            ? window.NativeShell.AppHost.deviceId()
            : getDeviceId();
    },
    appName: function () {
        return window.NativeShell?.AppHost?.appName
            ? window.NativeShell.AppHost.appName()
            : appName;
    },
    appVersion: function () {
        return window.NativeShell?.AppHost?.appVersion
            ? window.NativeShell.AppHost.appVersion()
            : window.__PACKAGE_JSON_VERSION__;
    },
    getPushTokenInfo: function () {
        return {};
    },
    setUserScalable: function (scalable: boolean) {
        if (!browser.tv) {
            const att = scalable
                ? 'width=device-width, initial-scale=1, minimum-scale=1, user-scalable=yes'
                : 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no';
            document.querySelector('meta[name=viewport]')?.setAttribute('content', att);
        }
    },
    screen: () => {
        let hostScreen: any = null;

        const appHostImpl = window.NativeShell?.AppHost;

        if (appHostImpl?.screen) {
            hostScreen = appHostImpl.screen();
        } else if (window.screen && !browser.tv) {
            hostScreen = {
                width: Math.floor(window.screen.width * window.devicePixelRatio),
                height: Math.floor(window.screen.height * window.devicePixelRatio)
            };
        }

        if (hostScreen) {
            // Use larger dimension to account for screen orientation changes
            hostScreen.maxAllowedWidth = Math.max(hostScreen.width, hostScreen.height);
        }

        return hostScreen;
    }
};

export const safeAppHost = {
    supports: (feature: string) => {
        if (appHost && typeof appHost.supports === 'function') {
            return appHost.supports(feature);
        }

        return false;
    },
    getDefaultLayout: () => {
        if (appHost && typeof appHost.getDefaultLayout === 'function') {
            return appHost.getDefaultLayout();
        }

        return LayoutMode.Experimental;
    },
    appName: () => {
        if (appHost && typeof appHost.appName === 'function') {
            return appHost.appName();
        }

        return appName;
    },
    appVersion: () => {
        if (appHost && typeof appHost.appVersion === 'function') {
            return appHost.appVersion();
        }

        return window.__PACKAGE_JSON_VERSION__;
    },
    deviceName: () => {
        if (appHost && typeof appHost.deviceName === 'function') {
            return appHost.deviceName();
        }

        return getDeviceName();
    },
    deviceId: () => {
        if (appHost && typeof appHost.deviceId === 'function') {
            return appHost.deviceId();
        }

        return getDeviceId();
    },
    getPushTokenInfo: () => {
        if (appHost && typeof appHost.getPushTokenInfo === 'function') {
            return appHost.getPushTokenInfo();
        }

        return {};
    },
    exit: () => {
        if (appHost && typeof appHost.exit === 'function') {
            return appHost.exit();
        }
    },
    getWindowState: () => {
        if (appHost && typeof appHost.getWindowState === 'function') {
            return appHost.getWindowState();
        }

        return 'Normal';
    }
};

if (typeof window !== 'undefined') {
    window.appHost = safeAppHost;
}

let isHidden = false;
let hidden: string | undefined;
let visibilityChange: string | undefined;

if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof (document as any).webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}

if (typeof document !== 'undefined' && visibilityChange) {
    document.addEventListener(
        visibilityChange,
        () => {
            if (hidden && (document as any)[hidden]) {
                onAppHidden();
            } else {
                onAppVisible();
            }
        },
        false
    );
}

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('focus', onAppVisible);
    window.addEventListener('blur', onAppHidden);
}

// load app host on module load
try {
    appHost.init();
} catch (err) {
    logger.error('AppHost init failed', { component: 'AppHost' }, err as Error);
}
