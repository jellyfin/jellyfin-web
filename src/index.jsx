import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'jquery';
import 'fast-text-encoding';
import 'intersection-observer';
import 'classlist.js';
import 'whatwg-fetch';
import 'abortcontroller-polyfill'; // requires fetch
import 'resize-observer-polyfill';
import './styles/site.scss';
import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import Events from './utils/events.ts';
import ServerConnections from './components/ServerConnections';
import globalize from './scripts/globalize';
import browser from './scripts/browser';
import keyboardNavigation from './scripts/keyboardNavigation';
import './scripts/mouseManager';
import autoFocuser from './components/autoFocuser';
import { appHost } from './components/apphost';
import { getPlugins } from './scripts/settings/webSettings';
import { pluginManager } from './components/pluginManager';
import packageManager from './components/packageManager';
import './components/playback/displayMirrorManager.ts';
import { appRouter, history } from './components/router/appRouter';
import './elements/emby-button/emby-button';
import './scripts/autoThemes';
import './components/themeMediaPlayer';
import { pageClassOn, serverAddress } from './utils/dashboard';
import './scripts/screensavermanager';
import './scripts/serverNotifications';
import './components/playback/playerSelectionMenu';
import './legacy/domParserTextHtml';
import './legacy/focusPreventScroll';
import './legacy/htmlMediaElement';
import './legacy/keyboardEvent';
import './legacy/vendorStyles';
import { currentSettings } from './scripts/settings/userSettings';
import taskButton from './scripts/taskbutton';
import RootApp from './RootApp.tsx';

import './styles/livetv.scss';
import './styles/dashboard.scss';
import './styles/detailtable.scss';

function loadCoreDictionary() {
    const languages = ['af', 'ar', 'be-by', 'bg-bg', 'bn_bd', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en-gb', 'en-us', 'eo', 'es', 'es_419', 'es-ar', 'es_do', 'es-mx', 'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'fr-ca', 'gl', 'gsw', 'he', 'hi-in', 'hr', 'hu', 'id', 'it', 'ja', 'kk', 'ko', 'lt-lt', 'lv', 'mr', 'ms', 'nb', 'nl', 'nn', 'pl', 'pr', 'pt', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl-si', 'sq', 'sv', 'ta', 'th', 'tr', 'uk', 'ur_pk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];
    const translations = languages.map(function (language) {
        return {
            lang: language,
            path: language + '.json'
        };
    });
    globalize.defaultModule('core');
    return globalize.loadStrings({
        name: 'core',
        translations: translations
    });
}

function init() {
    // Log current version to console to help out with issue triage and debugging
    console.log(`${__PACKAGE_JSON_NAME__} version ${__PACKAGE_JSON_VERSION__} build ${__JF_BUILD_VERSION__}`);

    // This is used in plugins
    window.Events = Events;
    window.TaskButton = taskButton;

    serverAddress().then(server => {
        if (server) {
            ServerConnections.initApiClient(server);
        }
    }).then(() => {
        console.debug('initAfterDependencies promises resolved');

        loadCoreDictionary().then(function () {
            onGlobalizeInit();
        });

        keyboardNavigation.enable();
        autoFocuser.enable();

        Events.on(ServerConnections, 'localusersignedin', globalize.updateCurrentCulture);
        Events.on(ServerConnections, 'localusersignedout', globalize.updateCurrentCulture);
    });
}

function onGlobalizeInit() {
    if (window.appMode === 'android'
        && window.location.href.toString().toLowerCase().indexOf('start=backgroundsync') !== -1
    ) {
        return onAppReady();
    }

    document.title = globalize.translateHtml(document.title, 'core');

    if (browser.tv && !browser.android) {
        console.debug('using system fonts with explicit sizes');
        import('./styles/fonts.sized.scss');
    } else if (__USE_SYSTEM_FONTS__) {
        console.debug('using system fonts');
        import('./styles/fonts.scss');
    } else {
        console.debug('using default fonts');
        import('./styles/fonts.scss');
        import('./styles/fonts.noto.scss');
    }

    import('./styles/librarybrowser.scss');

    loadPlugins().then(onAppReady);
}

function loadPlugins() {
    console.groupCollapsed('loading installed plugins');
    console.dir(pluginManager);
    return getPlugins().then(function (list) {
        if (!appHost.supports('remotecontrol')) {
            // Disable remote player plugins if not supported
            list = list.filter(plugin => !plugin.startsWith('sessionPlayer')
                && !plugin.startsWith('chromecastPlayer'));
        } else if (!browser.chrome && !browser.edgeChromium && !browser.opera) {
            // Disable chromecast player in unsupported browsers
            list = list.filter(plugin => !plugin.startsWith('chromecastPlayer'));
        }

        // add any native plugins
        if (window.NativeShell) {
            list = list.concat(window.NativeShell.getPlugins());
        }

        Promise.all(list.map(plugin => pluginManager.loadPlugin(plugin)))
            .then(() => console.debug('finished loading plugins'))
            .catch(e => console.warn('failed loading plugins', e))
            .finally(() => {
                console.groupEnd('loading installed plugins');
                packageManager.init();
            })
        ;
    });
}

async function onAppReady() {
    console.debug('begin onAppReady');

    console.debug('onAppReady: loading dependencies');

    if (browser.iOS) {
        import('./styles/ios.scss');
    }

    Events.on(appHost, 'resume', () => {
        ServerConnections.currentApiClient()?.ensureWebSocket();
    });

    const root = document.getElementById('reactRoot');
    // Remove the splash logo
    root.innerHTML = '';

    await appRouter.start();

    ReactDOM.render(
        <StrictMode>
            <RootApp history={history} />
        </StrictMode>,
        root
    );

    if (!browser.tv && !browser.xboxOne && !browser.ps4) {
        import('./components/nowPlayingBar/nowPlayingBar');
    }

    if (appHost.supports('remotecontrol')) {
        import('./components/playback/playerSelectionMenu');
        import('./components/playback/remotecontrolautoplay');
    }

    if (!appHost.supports('physicalvolumecontrol') || browser.touch) {
        import('./components/playback/volumeosd');
    }

    /* eslint-disable-next-line compat/compat */
    if (navigator.mediaSession || window.NativeShell) {
        import('./components/playback/mediasession');
    }

    if (!browser.tv && !browser.xboxOne) {
        import('./components/playback/playbackorientation');
        registerServiceWorker();

        if (window.Notification) {
            import('./components/notifications/notifications');
        }
    }

    const apiClient = ServerConnections.currentApiClient();
    if (apiClient) {
        const updateStyle = (css) => {
            let style = document.querySelector('#cssBranding');
            if (!style) {
                // Inject the branding css as a dom element in body so it will take
                // precedence over other stylesheets
                style = document.createElement('style');
                style.id = 'cssBranding';
                document.body.appendChild(style);
            }
            style.textContent = css;
        };

        const style = fetch(apiClient.getUrl('Branding/Css'))
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }
                return response.text();
            })
            .catch(function(err) {
                console.warn('Error applying custom css', err);
            });

        const handleStyleChange = async () => {
            if (currentSettings.disableCustomCss()) {
                updateStyle('');
            } else {
                updateStyle(await style);
            }

            const localCss = currentSettings.customCss();
            let localStyle = document.querySelector('#localCssBranding');
            if (localCss) {
                if (!localStyle) {
                    // Inject the branding css as a dom element in body so it will take
                    // precedence over other stylesheets
                    localStyle = document.createElement('style');
                    localStyle.id = 'localCssBranding';
                    document.body.appendChild(localStyle);
                }
                localStyle.textContent = localCss;
            } else if (localStyle) {
                localStyle.textContent = '';
            }
        };

        const handleUserChange = () => {
            handleStyleChange();
        };

        Events.on(ServerConnections, 'localusersignedin', handleUserChange);
        Events.on(ServerConnections, 'localusersignedout', handleUserChange);
        Events.on(currentSettings, 'change', (e, prop) => {
            if (prop == 'disableCustomCss' || prop == 'customCss') {
                handleStyleChange();
            }
        });

        style.then(updateStyle);
    }
}

function registerServiceWorker() {
    /* eslint-disable compat/compat */
    if (navigator.serviceWorker && window.appMode !== 'cordova' && window.appMode !== 'android') {
        navigator.serviceWorker.register('serviceworker.js').then(() =>
            console.log('serviceWorker registered')
        ).catch(error =>
            console.log('error registering serviceWorker: ' + error)
        );
    } else {
        console.warn('serviceWorker unsupported');
    }
    /* eslint-enable compat/compat */
}

init();

pageClassOn('viewshow', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.add('noHeaderRight');
});

pageClassOn('viewhide', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.remove('noHeaderRight');
});
