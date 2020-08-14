import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'jquery';
import 'fast-text-encoding';
import 'intersection-observer';
import 'classlist-polyfill';
import 'whatwg-fetch';
import 'resize-observer-polyfill';
import 'jellyfin-noto';
import '../assets/css/site.css';

// TODO: Move this elsewhere
window.getWindowLocationSearch = function(win) {
    var search = (win || window).location.search;

    if (!search) {
        var index = window.location.href.indexOf('?');

        if (index != -1) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
};

// TODO: Move this elsewhere
window.getParameterByName = function(name, url) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regexS = '[\\?&]' + name + '=([^&#]*)';
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url || getWindowLocationSearch());

    if (results == null) {
        return '';
    }

    return decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// TODO: Move this elsewhere
window.pageClassOn = function(eventName, className, fn) {
    document.addEventListener(eventName, function (event) {
        var target = event.target;

        if (target.classList.contains(className)) {
            fn.call(target, event);
        }
    });
};

// TODO: Move this elsewhere
window.pageIdOn = function(eventName, id, fn) {
    document.addEventListener(eventName, function (event) {
        var target = event.target;

        if (target.id === id) {
            fn.call(target, event);
        }
    });
};

var AppInfo = {};

function initClient() {
    function bindConnectionManagerEvents(connectionManager, events, userSettings) {
        window.Events = events;

        connectionManager.currentApiClient = function () {
            if (!localApiClient) {
                var server = connectionManager.getLastUsedServer();

                if (server) {
                    localApiClient = connectionManager.getApiClient(server.Id);
                }
            }

            return localApiClient;
        };

        connectionManager.onLocalUserSignedIn = function (user) {
            localApiClient = connectionManager.getApiClient(user.ServerId);
            window.ApiClient = localApiClient;
            return userSettings.setUserInfo(user.Id, localApiClient);
        };

        events.on(connectionManager, 'localusersignedout', function () {
            userSettings.setUserInfo(null, null);
        });
    }

    function createConnectionManager() {
        return Promise.all([
            import('jellyfin-apiclient/src/connectionManager'),
            import('../components/apphost'),
            import('jellyfin-apiclient/src/connectionManager'),
            import('jellyfin-apiclient/src/events'),
            import('./settings/userSettings')
        ])
            .then(([ConnectionManager, appHost, credentialProvider, events, userSettings]) => {
                appHost = appHost.default || appHost;

                var credentialProviderInstance = new credentialProvider();
                var promises = [appHost.init()];

                return Promise.all(promises).then(function (responses) {
                    var capabilities = Dashboard.capabilities(appHost);

                    window.ConnectionManager = new ConnectionManager(credentialProviderInstance, appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId(), capabilities);

                    bindConnectionManagerEvents(window.ConnectionManager, events, userSettings);

                    if (!AppInfo.isNativeApp) {
                        console.debug('loading ApiClient singleton');

                        return Promise.all([
                            import('jellyfin-apiclient/src/apiClient'),
                            import('./clientUtils')
                        ])
                            .then(([apiClientFactory, clientUtils]) => {
                                console.debug('creating ApiClient singleton');

                                var apiClient = new apiClientFactory(Dashboard.serverAddress(), appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId());

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
                        .then(([globalize, browser]) => {
                            window.Globalize = globalize;
                            loadCoreDictionary(globalize).then(function () {
                                onGlobalizeInit(browser, globalize);
                            });
                        });
                    import('./keyboardNavigation')
                        .then((keyboardnavigation) => {
                            keyboardnavigation.enable();
                        });
                    import(['./mouseManager']);
                    import('../components/autoFocuser').then((autoFocuser) => {
                        autoFocuser.enable();
                    });
                    Promise.all([
                        import('./globalize'),
                        import('jellyfin-apiclient/src/connectionManager'),
                        import('jellyfin-apiclient/src/events')
                    ])
                        .then((globalize, connectionManager, events) => {
                            events.on(connectionManager, 'localusersignedin', globalize.updateCurrentCulture);
                        });
                });
            });
    }

    function loadCoreDictionary(globalize) {
        var languages = ['ar', 'be-by', 'bg-bg', 'ca', 'cs', 'da', 'de', 'el', 'en-gb', 'en-us', 'es', 'es-ar', 'es-mx', 'fa', 'fi', 'fr', 'fr-ca', 'gsw', 'he', 'hi-in', 'hr', 'hu', 'id', 'it', 'kk', 'ko', 'lt-lt', 'ms', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl-si', 'sv', 'tr', 'uk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];
        var translations = languages.map(function (language) {
            return {
                lang: language,
                path: 'strings/' + language + '.json'
            };
        });
        globalize.defaultModule('core');
        return globalize.loadStrings({
            name: 'core',
            translations: translations
        });
    }

    function onGlobalizeInit(browser, globalize) {
        if (self.appMode === 'android') {
            if (self.location.href.toString().toLowerCase().indexOf('start=backgroundsync') !== -1) {
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

        Promise.all([
            import('../components/apphost'),
            import('../assets/css/librarybrowser.css')
        ]).then((appHost) => {
            loadPlugins(appHost, browser).then(function () {
                onAppReady(browser);
            });
        });
    }

    function loadPlugins(appHost, browser, shell) {
        console.groupCollapsed('loading installed plugins');
        return new Promise(function (resolve, reject) {
            import('./settings/webSettings')
                .then((webSettings) => {
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

                        Promise.all(list.map(loadPlugin))
                            .then(function () {
                                console.debug('finished loading plugins');
                            })
                            .catch(() => reject)
                            .finally(() => {
                                console.groupEnd('loading installed plugins');
                                import('../components/packageManager')
                                    .then((packageManager) => {
                                        packageManager.default.init().then(resolve, reject);
                                    });
                            })
                        ;
                    });
                });
        });
    }

    function loadPlugin(url) {
        return new Promise(function (resolve, reject) {
            import('pluginManager')
                .then((pluginManager) => {
                    pluginManager.default.loadPlugin(url).then(resolve, reject);
                });
        });
    }

    function onAppReady(browser) {
        console.debug('begin onAppReady');

        // ensure that appHost is loaded in this point
        Promise.all([
            import('jellyfin-apiclient/src/apiClient'),
            import('../components/appRouter')
        ])
            .then(([appHost, appRouter]) => {
                appRouter = appRouter.default || appRouter;
                appHost = appHost.default || appHost;

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

                        var apiClient = window.ConnectionManager && window.ConnectionManager.currentApiClient();
                        if (apiClient) {
                            fetch(apiClient.getUrl('Branding/Css'))
                                .then(function(response) {
                                    if (!response.ok) {
                                        throw new Error(response.status + ' ' + response.statusText);
                                    }
                                    return response.text();
                                })
                                .then(function(css) {
                                    // Inject the branding css as a dom element in body so it will take
                                    // precedence over other stylesheets
                                    var style = document.createElement('style');
                                    style.appendChild(document.createTextNode(css));
                                    document.body.appendChild(style);
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
        if (navigator.serviceWorker && self.appMode !== 'cordova' && self.appMode !== 'android') {
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

    var localApiClient;

    if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
        AppInfo.isNativeApp = true;
    }

    init();
}

initClient();

pageClassOn('viewshow', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.add('noHeaderRight');
});

pageClassOn('viewhide', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.remove('noHeaderRight');
});
