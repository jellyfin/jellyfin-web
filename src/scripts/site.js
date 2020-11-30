import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'jquery';
import 'fast-text-encoding';
import 'intersection-observer';
import 'classlist.js';
import 'whatwg-fetch';
import 'resize-observer-polyfill';
import 'jellyfin-noto/font-faces.css';
import '../assets/css/site.scss';
import { Events } from 'jellyfin-apiclient';
import ServerConnections from '../components/ServerConnections';
import globalize from './globalize';
import browser from './browser';
import keyboardNavigation from './keyboardNavigation';
import './mouseManager';
import autoFocuser from '../components/autoFocuser';
import { appHost } from '../components/apphost';
import { getPlugins } from './settings/webSettings';
import { pluginManager } from '../components/pluginManager';
import packageManager from '../components/packageManager';
import { appRouter } from '../components/appRouter';
import '../elements/emby-button/emby-button';
import './autoThemes';
import './libraryMenu';
import './routes';
import '../components/themeMediaPlayer';
import './autoBackdrops';
import { pageClassOn, serverAddress } from './clientUtils';
import '../libraries/screensavermanager';
import './serverNotifications';
import '../components/playback/playerSelectionMenu';

// TODO: Move this elsewhere
window.getWindowLocationSearch = function(win) {
    let search = (win || window).location.search;

    if (!search) {
        const index = window.location.href.indexOf('?');

        if (index != -1) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
};

// TODO: Move this elsewhere
window.getParameterByName = function(name, url) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regexS = '[\\?&]' + name + '=([^&#]*)';
    const regex = new RegExp(regexS, 'i');
    const results = regex.exec(url || getWindowLocationSearch());

    if (results == null) {
        return '';
    }

    return decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function loadCoreDictionary() {
    const languages = ['ar', 'be-by', 'bg-bg', 'ca', 'cs', 'da', 'de', 'el', 'en-gb', 'en-us', 'es', 'es-ar', 'es-mx', 'fa', 'fi', 'fr', 'fr-ca', 'gsw', 'he', 'hi-in', 'hr', 'hu', 'id', 'it', 'ja', 'kk', 'ko', 'lt-lt', 'ms', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl-si', 'sv', 'tr', 'uk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];
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
    });
}

function onGlobalizeInit() {
    if (window.appMode === 'android') {
        if (window.location.href.toString().toLowerCase().indexOf('start=backgroundsync') !== -1) {
            return onAppReady();
        }
    }

    document.title = globalize.translateHtml(document.title, 'core');

    if (browser.tv && !browser.android) {
        console.debug('using system fonts with explicit sizes');
        import('../assets/css/fonts.sized.scss');
    } else {
        console.debug('using default fonts');
        import('../assets/css/fonts.scss');
    }

    import('../assets/css/librarybrowser.css');

    loadPlugins().then(function () {
        onAppReady();
    });
}

function loadPlugins() {
    console.groupCollapsed('loading installed plugins');
    console.dir(pluginManager);
    return getPlugins().then(function (list) {
        if (!appHost.supports('remotecontrol')) {
            // Disable remote player plugins if not supported
            list.splice(list.indexOf('sessionPlayer'), 1);
            list.splice(list.indexOf('chromecastPlayer'), 1);
        } else if (!browser.chrome && !browser.edgeChromium && !browser.opera) {
            // Disable chromecast player in unsupported browsers
            list.splice(list.indexOf('chromecastPlayer'), 1);
        }

        // add any native plugins
        if (window.NativeShell) {
            list = list.concat(window.NativeShell.getPlugins());
        }

        Promise.all(list.map((plugin) => {
            return pluginManager.loadPlugin(plugin);
        }))
            .then(function () {
                console.debug('finished loading plugins');
            })
            .catch(() => console.debug('failed loading plugins'))
            .finally(() => {
                console.groupEnd('loading installed plugins');
                packageManager.init();
            })
        ;
    });
}

function onAppReady() {
    console.debug('begin onAppReady');

    console.debug('onAppReady: loading dependencies');

    if (browser.iOS) {
        import('../assets/css/ios.scss');
    }

    appRouter.start({
        click: false,
        hashbang: true
    });

    if (!browser.tv && !browser.xboxOne && !browser.ps4) {
        import('../components/nowPlayingBar/nowPlayingBar');
    }

    if (appHost.supports('remotecontrol')) {
        import('../components/playback/playerSelectionMenu');
        import('../components/playback/remotecontrolautoplay');
    }

    if (!appHost.supports('physicalvolumecontrol') || browser.touch) {
        import('../components/playback/volumeosd');
    }

    /* eslint-disable-next-line compat/compat */
    if (navigator.mediaSession || window.NativeShell) {
        import('../components/playback/mediasession');
    }

    if (!browser.tv && !browser.xboxOne) {
        import('../components/playback/playbackorientation');
        registerServiceWorker();

        if (window.Notification) {
            import('../components/notifications/notifications');
        }
    }

    const apiClient = ServerConnections.currentApiClient();
    if (apiClient) {
        fetch(apiClient.getUrl('Branding/Css'))
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }
                return response.text();
            })
            .then(function(css) {
                let style = document.querySelector('#cssBranding');
                if (!style) {
                    // Inject the branding css as a dom element in body so it will take
                    // precedence over other stylesheets
                    style = document.createElement('style');
                    style.id = 'cssBranding';
                    document.body.appendChild(style);
                }
                style.textContent = css;
            })
            .catch(function(err) {
                console.warn('Error applying custom css', err);
            });
    }
}

function registerServiceWorker() {
    /* eslint-disable compat/compat */
    if (navigator.serviceWorker && window.appMode !== 'cordova' && window.appMode !== 'android') {
        try {
            navigator.serviceWorker.register('/serviceworker.js').then(() =>
                console.log('serviceWorker registered')
            ).catch(error =>
                console.log('error registering serviceWorker: ' + error)
            );
        } catch (err) {
            console.error('error registering serviceWorker: ' + err);
        }
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
