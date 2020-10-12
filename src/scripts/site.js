import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'jquery';
import 'fast-text-encoding';
import 'intersection-observer';
import 'classlist.js';
import 'whatwg-fetch';
import 'resize-observer-polyfill';
import 'jellyfin-noto';
import '../assets/css/site.css';
import AppInfo from '../components/AppInfo';
import Dashboard from './clientUtils';

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

// TODO: Move this elsewhere
window.pageClassOn = function(eventName, className, fn) {
    document.addEventListener(eventName, function (event) {
        const target = event.target;

        if (target.classList.contains(className)) {
            fn.call(target, event);
        }
    });
};

// TODO: Move this elsewhere
window.pageIdOn = function(eventName, id, fn) {
    document.addEventListener(eventName, function (event) {
        const target = event.target;

        if (target.id === id) {
            fn.call(target, event);
        }
    });
};

if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
    AppInfo.isNativeApp = true;
}

Object.freeze(AppInfo);

function initClient() {
    function bindConnectionManagerEvents(connectionManager, events, userSettings) {
        window.Events = events;

        window.connectionManager.currentApiClient = function () {
            if (!localApiClient) {
                const server = window.connectionManager.getLastUsedServer();

                if (server) {
                    localApiClient = window.connectionManager.getApiClient(server.Id);
                }
            }

            return localApiClient;
        };

        window.connectionManager.onLocalUserSignedIn = function (user) {
            localApiClient = window.connectionManager.getApiClient(user.ServerId);
            window.ApiClient = localApiClient;
            return userSettings.setUserInfo(user.Id, localApiClient);
        };

        events.on(connectionManager, 'localusersignedout', function () {
            userSettings.setUserInfo(null, null);
        });
    }

    function createConnectionManager() {
        return Promise.all([
            import('jellyfin-apiclient'),
            import('../components/apphost'),
            import('./settings/userSettings')
        ])
            .then(([{ ConnectionManager, Credentials, Events }, { appHost }, userSettings]) => {
                var credentialProviderInstance = new Credentials();
                var promises = [appHost.init()];

                return Promise.all(promises).then(function (responses) {
                    const capabilities = Dashboard.capabilities(appHost);

                    window.ConnectionManager = new ConnectionManager(credentialProviderInstance, appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId(), capabilities);

                    bindConnectionManagerEvents(window.ConnectionManager, Events, userSettings);

                    if (!AppInfo.isNativeApp) {
                        console.debug('loading ApiClient singleton');

                        return Promise.all([
                            import('jellyfin-apiclient')
                        ])
                            .then(([{ ApiClient }]) => {
                                console.debug('creating ApiClient singleton');

                                var apiClient = new ApiClient(Dashboard.serverAddress(), appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId());

                                apiClient.enableAutomaticNetworking = false;
                                apiClient.manualAddressOnly = true;

                                window.ConnectionManager.addApiClient(apiClient);

                                window.ApiClient = apiClient;
                                localApiClient = apiClient;

                                console.debug('loaded ApiClient singleton');
                            });
                    }

                    return Promise.resolve();
                });
            });
    }

    function init() {
        import('./clientUtils')
            .then(function () {
                createConnectionManager().then(function () {
                    console.debug('initAfterDependencies promises resolved');

                    Promise.all([
                        import('./globalize'),
                        import('./browser')
                    ])
                        .then(([globalize, {default: browser}]) => {
                            window.Globalize = globalize;
                            loadCoreDictionary(globalize).then(function () {
                                onGlobalizeInit(browser, globalize);
                            });
                        });
                    import('./keyboardNavigation')
                        .then((keyboardnavigation) => {
                            keyboardnavigation.enable();
                        });
                    import('./mouseManager');
                    import('../components/autoFocuser').then((autoFocuser) => {
                        autoFocuser.enable();
                    });
                    Promise.all([
                        import('./globalize'),
                        import('jellyfin-apiclient')
                    ])
                        .then(([ globalize, { ConnectionManager, events } ]) => {
                            Events.on(ConnectionManager, 'localusersignedin', globalize.updateCurrentCulture);
                        });
                });
            });
    }

    function loadCoreDictionary(globalize) {
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

    function onGlobalizeInit(browser, globalize) {
        if (window.appMode === 'android') {
            if (window.location.href.toString().toLowerCase().indexOf('start=backgroundsync') !== -1) {
                return onAppReady(browser);
            }
        }

        document.title = globalize.translateHtml(document.title, 'core');

        if (browser.tv && !browser.android) {
            console.debug('using system fonts with explicit sizes');
            import('../assets/css/fonts.sized.css');
        } else {
            console.debug('using default fonts');
            import('../assets/css/fonts.css');
        }

        import('../assets/css/librarybrowser.css');
        import('../components/apphost')
            .then(({ appHost }) => {
                loadPlugins(appHost, browser).then(function () {
                    onAppReady(browser);
                });
            });
    }

    function loadPlugins(appHost, browser, shell) {
        console.groupCollapsed('loading installed plugins');
        return new Promise(function (resolve, reject) {
            Promise.all([
                import('./settings/webSettings'),
                import('../components/pluginManager')
            ])
                .then(([webSettings, { pluginManager: pluginManager }]) => {
                    console.dir(pluginManager);
                    webSettings.getPlugins().then(function (list) {
                        // these two plugins are dependent on features
                        if (!appHost.supports('remotecontrol')) {
                            list.splice(list.indexOf('sessionPlayer'), 1);

                            if (!browser.chrome && !browser.opera) {
                                list.splice(list.indexOf('chromecastPlayer', 1));
                            }
                        }

                        // add any native plugins
                        if (window.NativeShell) {
                            list = list.concat(window.NativeShell.getPlugins());
                        }

                        Promise.all(list.map((plugin) => {
                            return pluginManager.loadPlugin(import(/* webpackChunkName: "[request]" */ `../plugins/${plugin}`));
                        }))
                            .then(function (pluginPromises) {
                                console.debug('finished loading plugins');
                            })
                            .catch(() => reject)
                            .finally(() => {
                                console.groupEnd('loading installed plugins');
                                import('../components/packageManager')
                                    .then(({ default: packageManager }) => {
                                        packageManager.init().then(resolve, reject);
                                    });
                            })
                        ;
                    });
                });
        });
    }

    function onAppReady(browser) {
        console.debug('begin onAppReady');

        // ensure that appHost is loaded in this point
        Promise.all([
            import('../components/apphost'),
            import('../components/appRouter')
        ])
            .then(([{ appHost }, { appRouter }]) => {
                window.Emby = {};

                console.debug('onAppReady: loading dependencies');
                if (browser.iOS) {
                    import('../assets/css/ios.css');
                }

                window.Emby.Page = appRouter;

                Promise.all([
                    import('../elements/emby-button/emby-button'),
                    import('./autoThemes'),
                    import('./libraryMenu'),
                    import('./routes')
                ])
                    .then(() => {
                        Emby.Page.start({
                            click: false,
                            hashbang: true
                        });

                        import('../components/themeMediaPlayer');
                        import('./autoBackdrops');

                        if (!browser.tv && !browser.xboxOne && !browser.ps4) {
                            import('../components/nowPlayingBar/nowPlayingBar');
                        }

                        if (appHost.supports('remotecontrol')) {
                            import('../components/playback/playerSelectionMenu');
                            import('../components/playback/remotecontrolautoplay');
                        }

                        import('../libraries/screensavermanager');

                        if (!appHost.supports('physicalvolumecontrol') || browser.touch) {
                            import('../components/playback/volumeosd');
                        }

                        /* eslint-disable-next-line compat/compat */
                        if (navigator.mediaSession || window.NativeShell) {
                            import('../components/playback/mediasession');
                        }

                        import('./serverNotifications');

                        if (!browser.tv && !browser.xboxOne) {
                            import('../components/playback/playbackorientation');
                            registerServiceWorker();

                            if (window.Notification) {
                                import('../components/notifications/notifications');
                            }
                        }

                        import('../components/playback/playerSelectionMenu');

                        const apiClient = window.ConnectionManager && window.ConnectionManager.currentApiClient();
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
                    });
            });
    }

    function registerServiceWorker() {
        /* eslint-disable compat/compat */
        if (navigator.serviceWorker && window.appMode !== 'cordova' && window.appMode !== 'android') {
            try {
                navigator.serviceWorker.register('serviceworker.js');
            } catch (err) {
                console.error('error registering serviceWorker: ' + err);
            }
        } else {
            console.warn('serviceWorker unsupported');
        }
        /* eslint-enable compat/compat */
    }

    let localApiClient;

    init();
}

initClient();

pageClassOn('viewshow', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.add('noHeaderRight');
});

pageClassOn('viewhide', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.remove('noHeaderRight');
});
