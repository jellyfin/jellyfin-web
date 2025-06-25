import appSettings from '../scripts/settings/appSettings';
import browser from '../scripts/browser';
import Events from '../utils/events.ts';
import * as htmlMediaHelper from '../components/htmlMediaHelper';
import * as webSettings from '../scripts/settings/webSettings';
import globalize from '../lib/globalize';
import profileBuilder from '../scripts/browserDeviceProfile';
import { AppFeature } from 'constants/appFeature';

const appName = 'Jellyfin Web';

const BrowserName = {
    tizen: 'Samsung Smart TV',
    web0s: 'LG Smart TV',
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

function getBaseProfileOptions(item) {
    const disableHlsVideoAudioCodecs = [];

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

function getDeviceProfile(item) {
    return new Promise(function (resolve) {
        let profile;

        if (window.NativeShell) {
            profile = window.NativeShell.AppHost.getDeviceProfile(profileBuilder, __PACKAGE_JSON_VERSION__);
        } else {
            const builderOpts = getBaseProfileOptions(item);
            profile = profileBuilder(builderOpts);
        }

        const maxVideoWidth = appSettings.maxVideoWidth();
        const maxTranscodingVideoWidth = maxVideoWidth < 0 ? appHost.screen()?.maxAllowedWidth : maxVideoWidth;

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

            profile.TranscodingProfiles.forEach((transcodingProfile) => {
                if (transcodingProfile.Type === 'Video') {
                    transcodingProfile.Conditions = (transcodingProfile.Conditions || []).filter((condition) => {
                        return condition.Property !== 'Width';
                    });

                    transcodingProfile.Conditions.push(conditionWidth);
                }
            });
        }

        const preferredTranscodeVideoCodec = appSettings.preferredTranscodeVideoCodec();
        if (preferredTranscodeVideoCodec) {
            profile.TranscodingProfiles.forEach((transcodingProfile) => {
                if (transcodingProfile.Type === 'Video') {
                    const videoCodecs = transcodingProfile.VideoCodec.split(',');
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
            profile.TranscodingProfiles.forEach((transcodingProfile) => {
                if (transcodingProfile.Type === 'Video') {
                    const audioCodecs = transcodingProfile.AudioCodec.split(',');
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
    if ('btoa' in window) {
        return btoa(keys.join('|')).replaceAll('=', '1');
    }

    return new Date().getTime();
}

function getDeviceId() {
    if (!deviceId) {
        const key = '_deviceId2';

        deviceId = appSettings.get(key);

        if (!deviceId) {
            deviceId = generateDeviceId();
            appSettings.set(key, deviceId);
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
        if (browser[key]) {
            deviceName = BrowserName[key];
            break;
        }
    }

    if (browser.ipad) {
        deviceName += ' iPad';
    } else if (browser.iphone) {
        deviceName += ' iPhone';
    } else if (browser.android) {
        deviceName += ' Android';
    }
    return deviceName;
}

function supportsFullscreen() {
    if (browser.tv) {
        return false;
    }

    const element = document.documentElement;
    return !!(element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen || document.createElement('video').webkitEnterFullscreen);
}

function getDefaultLayout() {
    return 'desktop';
}

function supportsHtmlMediaAutoplay() {
    if (browser.edgeUwp || browser.tizen || browser.web0s || browser.orsay || browser.operaTv || browser.ps4 || browser.xboxOne) {
        return true;
    }

    return !browser.mobile;
}

function supportsCue() {
    try {
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
        console.error('error detecting cue support: ' + err);
        return false;
    }
}

function onAppVisible() {
    if (isHidden) {
        isHidden = false;
        Events.trigger(appHost, 'resume');
    }
}

function onAppHidden() {
    if (!isHidden) {
        isHidden = true;
    }
}

const supportedFeatures = function () {
    const features = [];

    if (navigator.share) {
        features.push(AppFeature.Sharing);
    }

    if (!browser.edgeUwp && !browser.tv && !browser.xboxOne && !browser.ps4) {
        features.push(AppFeature.FileDownload);
    }

    if (browser.operaTv || browser.tizen || browser.orsay || browser.web0s) {
        features.push(AppFeature.Exit);
    }

    if (!browser.operaTv && !browser.tizen && !browser.orsay && !browser.web0s && !browser.ps4) {
        features.push(AppFeature.ExternalLinks);
    }

    if (supportsHtmlMediaAutoplay()) {
        features.push(AppFeature.HtmlAudioAutoplay);
        features.push(AppFeature.HtmlVideoAutoplay);
    }

    if (supportsFullscreen()) {
        features.push(AppFeature.Fullscreen);
    }

    if (browser.tv || browser.xboxOne || browser.ps4 || browser.mobile || browser.ipad) {
        features.push(AppFeature.PhysicalVolumeControl);
    }

    if (!browser.tv && !browser.xboxOne && !browser.ps4) {
        features.push(AppFeature.RemoteControl);
    }

    if (!browser.operaTv && !browser.tizen && !browser.orsay && !browser.web0s && !browser.edgeUwp) {
        features.push(AppFeature.RemoteVideo);
    }

    features.push(AppFeature.DisplayLanguage);
    features.push(AppFeature.DisplayMode);
    features.push(AppFeature.TargetBlank);
    features.push(AppFeature.Screensaver);

    webSettings.getMultiServer().then(enabled => {
        if (enabled) features.push(AppFeature.MultiServer);
    });

    if (!browser.orsay && (browser.firefox || browser.ps4 || browser.edge || supportsCue())) {
        features.push(AppFeature.SubtitleAppearance);
    }

    if (!browser.orsay) {
        features.push(AppFeature.SubtitleBurnIn);
    }

    if (!browser.tv && !browser.ps4 && !browser.xboxOne) {
        features.push(AppFeature.FileInput);
    }

    if (browser.chrome || browser.edgeChromium) {
        features.push(AppFeature.Chromecast);
    }

    return features;
}();

/**
     * Do exit according to platform
     */
function doExit() {
    try {
        if (window.NativeShell?.AppHost?.exit) {
            window.NativeShell.AppHost.exit();
        } else if (browser.tizen) {
            tizen.application.getCurrentApplication().exit();
        } else if (browser.web0s) {
            webOS.platformBack();
        } else {
            window.close();
        }
    } catch (err) {
        console.error('error closing application: ' + err);
    }
}

let exitPromise;

/**
     * Ask user for exit
     */
function askForExit() {
    if (exitPromise) {
        return;
    }

    import('../components/actionSheet/actionSheet').then((actionsheet) => {
        exitPromise = actionsheet.show({
            title: globalize.translate('MessageConfirmAppExit'),
            items: [
                { id: 'yes', name: globalize.translate('Yes') },
                { id: 'no', name: globalize.translate('No') }
            ]
        }).then(function (value) {
            if (value === 'yes') {
                doExit();
            }
        }).finally(function () {
            exitPromise = null;
        });
    });
}

let deviceId;
let deviceName;

export const appHost = {
    getWindowState: function () {
        return document.windowState || 'Normal';
    },
    setWindowState: function () {
        alert('setWindowState is not supported and should not be called');
    },
    exit: function () {
        if (!!window.appMode && browser.tizen) {
            askForExit();
        } else {
            doExit();
        }
    },
    supports: function (command) {
        if (window.NativeShell) {
            return window.NativeShell.AppHost.supports(command);
        }

        return supportedFeatures.indexOf(command.toLowerCase()) !== -1;
    },
    preferVisualCards: browser.android || browser.chrome,
    getDefaultLayout: function () {
        if (window.NativeShell) {
            return window.NativeShell.AppHost.getDefaultLayout();
        }

        return getDefaultLayout();
    },
    getDeviceProfile: getDeviceProfile,
    init: function () {
        if (window.NativeShell) {
            return window.NativeShell.AppHost.init();
        }

        return {
            deviceId: getDeviceId(),
            deviceName: getDeviceName()
        };
    },
    deviceName: function () {
        return window.NativeShell?.AppHost?.deviceName ?
            window.NativeShell.AppHost.deviceName() : getDeviceName();
    },
    deviceId: function () {
        return window.NativeShell?.AppHost?.deviceId ?
            window.NativeShell.AppHost.deviceId() : getDeviceId();
    },
    appName: function () {
        return window.NativeShell?.AppHost?.appName ?
            window.NativeShell.AppHost.appName() : appName;
    },
    appVersion: function () {
        return window.NativeShell?.AppHost?.appVersion ?
            window.NativeShell.AppHost.appVersion() : __PACKAGE_JSON_VERSION__;
    },
    getPushTokenInfo: function () {
        return {};
    },
    setUserScalable: function (scalable) {
        if (!browser.tv) {
            const att = scalable ? 'width=device-width, initial-scale=1, minimum-scale=1, user-scalable=yes' : 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no';
            document.querySelector('meta[name=viewport]').setAttribute('content', att);
        }
    },
    screen: () => {
        let hostScreen = null;

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

let isHidden = false;
let hidden;
let visibilityChange;

if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}

document.addEventListener(visibilityChange, function () {
    if (document[hidden]) {
        onAppHidden();
    } else {
        onAppVisible();
    }
}, false);

if (window.addEventListener) {
    window.addEventListener('focus', onAppVisible);
    window.addEventListener('blur', onAppHidden);
}

// load app host on module load
appHost.init();
