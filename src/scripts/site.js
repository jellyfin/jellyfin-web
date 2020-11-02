window.getWindowLocationSearch = function(win) {
    'use strict';

    let search = (win || window).location.search;

    if (!search) {
        const index = window.location.href.indexOf('?');

        if (index != -1) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
};

window.getParameterByName = function(name, url) {
    'use strict';

    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regexS = '[\\?&]' + name + '=([^&#]*)';
    const regex = new RegExp(regexS, 'i');
    const results = regex.exec(url || getWindowLocationSearch());

    if (results == null) {
        return '';
    }

    return decodeURIComponent(results[1].replace(/\+/g, ' '));
};

window.pageClassOn = function(eventName, className, fn) {
    'use strict';

    document.addEventListener(eventName, function (event) {
        const target = event.target;

        if (target.classList.contains(className)) {
            fn.call(target, event);
        }
    });
};

window.pageIdOn = function(eventName, id, fn) {
    'use strict';

    document.addEventListener(eventName, function (event) {
        const target = event.target;

        if (target.id === id) {
            fn.call(target, event);
        }
    });
};

const AppInfo = {};

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
        return require(['connectionManagerFactory', 'apphost', 'credentialprovider', 'events', 'userSettings'], function (ConnectionManager, appHost, credentialProvider, events, userSettings) {
            appHost = appHost.default || appHost;

            const credentialProviderInstance = new credentialProvider();
            const promises = [appHost.init()];

            return Promise.all(promises).then(function (responses) {
                const capabilities = Dashboard.capabilities(appHost);

                window.connectionManager = new ConnectionManager(credentialProviderInstance, appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId(), capabilities);

                bindConnectionManagerEvents(window.connectionManager, events, userSettings);

                if (!AppInfo.isNativeApp) {
                    console.debug('loading ApiClient singleton');

                    return require(['apiclient', 'clientUtils'], function (apiClientFactory, clientUtils) {
                        console.debug('creating ApiClient singleton');

                        const apiClient = new apiClientFactory(Dashboard.serverAddress(), appHost.appName(), appHost.appVersion(), appHost.deviceName(), appHost.deviceId());

                        apiClient.enableAutomaticNetworking = false;
                        apiClient.manualAddressOnly = true;

                        window.connectionManager.addApiClient(apiClient);

                        window.ApiClient = apiClient;
                        localApiClient = apiClient;

                        console.debug('loaded ApiClient singleton');
                    });
                }

                return Promise.resolve();
            });
        });
    }

    function returnFirstDependency(obj) {
        return obj;
    }

    function returnDefault(obj) {
        if (obj.default === null) {
            throw new Error('Object has no default!');
        }
        return obj.default;
    }

    function getBowerPath() {
        return 'libraries';
    }

    function getComponentsPath() {
        return 'components';
    }

    function getElementsPath() {
        return 'elements';
    }

    function getScriptsPath() {
        return 'scripts';
    }

    function getPlaybackManager(playbackManager) {
        window.addEventListener('beforeunload', function () {
            try {
                playbackManager.default.onAppClose();
            } catch (err) {
                console.error('error in onAppClose: ' + err);
            }
        });
        return playbackManager;
    }

    function getLayoutManager(layoutManager, appHost) {
        layoutManager = layoutManager.default || layoutManager;
        appHost = appHost.default || appHost;
        if (appHost.getDefaultLayout) {
            layoutManager.defaultLayout = appHost.getDefaultLayout();
        }

        layoutManager.init();
        return layoutManager;
    }

    function createSharedAppFooter({default: appFooter}) {
        return new appFooter({});
    }

    function onRequireJsError(requireType, requireModules) {
        console.error('RequireJS error: ' + (requireType || 'unknown') + '. Failed modules: ' + (requireModules || []).join(','));
    }

    function defineResizeObserver() {
        if (window.ResizeObserver) {
            define('ResizeObserver', [], function () {
                return window.ResizeObserver;
            });
        } else {
            define('ResizeObserver', ['resize-observer-polyfill'], returnFirstDependency);
        }
    }

    function init() {
        define('livetvcss', ['css!assets/css/livetv.css'], returnFirstDependency);
        define('detailtablecss', ['css!assets/css/detailtable.css'], returnFirstDependency);

        require(['clientUtils']);

        const promises = [];
        if (!window.fetch) {
            promises.push(require(['fetch']));
        }

        Promise.all(promises).then(function () {
            createConnectionManager().then(function () {
                console.debug('initAfterDependencies promises resolved');

                require(['globalize', 'browser'], function (globalize, {default: browser}) {
                    window.Globalize = globalize;
                    loadCoreDictionary(globalize).then(function () {
                        onGlobalizeInit(browser, globalize);
                    });
                });
                require(['keyboardnavigation'], function(keyboardnavigation) {
                    keyboardnavigation.enable();
                });
                require(['mouseManager']);
                require(['focusPreventScroll']);
                require(['vendorStyles']);
                require(['autoFocuser'], function(autoFocuser) {
                    autoFocuser.enable();
                });
                require(['globalize', 'events'], function (globalize, events) {
                    events.on(window.connectionManager, 'localusersignedin', globalize.updateCurrentCulture);
                });
            });
        });
    }

    function loadCoreDictionary(globalize) {
        const languages = ['ar', 'be-by', 'bg-bg', 'ca', 'cs', 'da', 'de', 'el', 'en-gb', 'en-us', 'es', 'es-ar', 'es-mx', 'fa', 'fi', 'fr', 'fr-ca', 'gsw', 'he', 'hi-in', 'hr', 'hu', 'id', 'it', 'ja', 'kk', 'ko', 'lt-lt', 'ms', 'nb', 'nl', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sk', 'sl-si', 'sv', 'tr', 'uk', 'vi', 'zh-cn', 'zh-hk', 'zh-tw'];
        const translations = languages.map(function (language) {
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
        if (window.appMode === 'android') {
            if (window.location.href.toString().toLowerCase().indexOf('start=backgroundsync') !== -1) {
                return onAppReady(browser);
            }
        }

        document.title = globalize.translateHtml(document.title, 'core');

        if (browser.tv && !browser.android) {
            console.debug('using system fonts with explicit sizes');
            require(['systemFontsSizedCss']);
        } else {
            console.debug('using default fonts');
            require(['systemFontsCss']);
        }

        require(['apphost', 'css!assets/css/librarybrowser'], function (appHost) {
            appHost = appHost.default || appHost;

            loadPlugins(appHost, browser).then(function () {
                onAppReady(browser);
            });
        });
    }

    function loadPlugins(appHost, browser, shell) {
        console.groupCollapsed('loading installed plugins');
        return new Promise(function (resolve, reject) {
            require(['webSettings'], function (webSettings) {
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
                            require(['packageManager'], function (packageManager) {
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
            require(['pluginManager'], function (pluginManager) {
                pluginManager.default.loadPlugin(url).then(resolve, reject);
            });
        });
    }

    function onAppReady(browser) {
        console.debug('begin onAppReady');

        // ensure that appHost is loaded in this point
        require(['apphost', 'appRouter'], function (appHost, appRouter) {
            appRouter = appRouter.default || appRouter;
            appHost = appHost.default || appHost;

            window.Emby = {};

            console.debug('onAppReady: loading dependencies');
            if (browser.iOS) {
                require(['css!assets/css/ios.css']);
            }

            window.Emby.Page = appRouter;

            require(['emby-button', 'scripts/autoThemes', 'libraryMenu', 'scripts/routes'], function () {
                Emby.Page.start({
                    click: false,
                    hashbang: true
                });

                require(['components/themeMediaPlayer', 'scripts/autoBackdrops']);

                if (!browser.tv && !browser.xboxOne && !browser.ps4) {
                    require(['components/nowPlayingBar/nowPlayingBar']);
                }

                if (appHost.supports('remotecontrol')) {
                    require(['playerSelectionMenu', 'components/playback/remotecontrolautoplay']);
                }

                require(['libraries/screensavermanager']);

                if (!appHost.supports('physicalvolumecontrol') || browser.touch) {
                    require(['components/playback/volumeosd']);
                }

                /* eslint-disable-next-line compat/compat */
                if (navigator.mediaSession || window.NativeShell) {
                    require(['mediaSession']);
                }
                require(['serverNotifications']);
                require(['date-fns', 'date-fns/locale']);

                if (!browser.tv && !browser.xboxOne) {
                    require(['components/playback/playbackorientation']);
                    registerServiceWorker();

                    if (window.Notification) {
                        require(['components/notifications/notifications']);
                    }
                }

                require(['playerSelectionMenu']);

                const apiClient = window.connectionManager && window.connectionManager.currentApiClient();
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

    function onWebComponentsReady() {
        const componentsPath = getComponentsPath();
        const scriptsPath = getScriptsPath();

        define('filesystem', [scriptsPath + '/filesystem'], returnFirstDependency);

        define('lazyLoader', [componentsPath + '/lazyLoader/lazyLoaderIntersectionObserver'], returnFirstDependency);
        define('shell', [scriptsPath + '/shell'], returnFirstDependency);

        define('alert', [componentsPath + '/alert'], returnFirstDependency);

        defineResizeObserver();

        define('dialog', [componentsPath + '/dialog/dialog'], returnFirstDependency);

        define('confirm', [componentsPath + '/confirm/confirm'], returnFirstDependency);

        define('prompt', [componentsPath + '/prompt/prompt'], returnFirstDependency);

        define('loading', [componentsPath + '/loading/loading'], returnFirstDependency);
        define('multi-download', [scriptsPath + '/multiDownload'], returnFirstDependency);
        define('fileDownloader', [scriptsPath + '/fileDownloader'], returnFirstDependency);

        define('castSenderApiLoader', [componentsPath + '/castSenderApi'], returnFirstDependency);

        if (window.appMode === 'cordova' || window.appMode === 'android' || window.appMode === 'standalone') {
            AppInfo.isNativeApp = true;
        }

        init();
    }

    let promise;
    let localApiClient;

    function initRequireJs() {
        const urlArgs = 'v=' + (window.dashboardVersion || new Date().getDate());

        const bowerPath = getBowerPath();
        const componentsPath = getComponentsPath();
        const elementsPath = getElementsPath();
        const scriptsPath = getScriptsPath();

        const paths = {
            browserdeviceprofile: 'scripts/browserDeviceProfile',
            browser: 'scripts/browser',
            libraryBrowser: 'scripts/libraryBrowser',
            inputManager: 'scripts/inputManager',
            datetime: 'scripts/datetime',
            globalize: 'scripts/globalize',
            dfnshelper: 'scripts/dfnshelper',
            libraryMenu: 'scripts/libraryMenu',
            playlisteditor: componentsPath + '/playlisteditor/playlisteditor',
            medialibrarycreator: componentsPath + '/mediaLibraryCreator/mediaLibraryCreator',
            medialibraryeditor: componentsPath + '/mediaLibraryEditor/mediaLibraryEditor',
            imageoptionseditor: componentsPath + '/imageOptionsEditor/imageOptionsEditor',
            apphost: componentsPath + '/apphost',
            visibleinviewport: bowerPath + '/visibleinviewport',
            qualityoptions: componentsPath + '/qualityOptions',
            focusManager: componentsPath + '/focusManager',
            itemHelper: componentsPath + '/itemHelper',
            itemShortcuts: componentsPath + '/shortcuts',
            playQueueManager: componentsPath + '/playback/playqueuemanager',
            nowPlayingHelper: componentsPath + '/playback/nowplayinghelper',
            pluginManager: componentsPath + '/pluginManager',
            packageManager: componentsPath + '/packageManager',
            screensaverManager: componentsPath + '/screensavermanager',
            clientUtils: scriptsPath + '/clientUtils',
            appRouter: 'components/appRouter'
        };

        requirejs.onError = onRequireJsError;
        requirejs.config({
            waitSeconds: 0,
            map: {
                '*': {
                    css: 'components/require/requirecss',
                    text: 'components/require/requiretext'
                }
            },
            bundles: {
                bundle: [
                    'fetch',
                    'flvjs',
                    'jstree',
                    'epubjs',
                    'pdfjs',
                    'jQuery',
                    'hlsjs',
                    'howler',
                    'native-promise-only',
                    'resize-observer-polyfill',
                    'swiper',
                    'queryString',
                    'sortable',
                    'webcomponents',
                    'material-icons',
                    'date-fns',
                    'page',
                    'polyfill',
                    'fast-text-encoding',
                    'intersection-observer',
                    'classlist-polyfill',
                    'screenfull',
                    'headroom',
                    'apiclient',
                    'events',
                    'credentialprovider',
                    'connectionManagerFactory',
                    'appStorage',
                    'comicReader'
                ]
            },
            urlArgs: urlArgs,
            paths: paths,
            onError: onRequireJsError
        });

        promise = require(['fetch'])
            .then(() => require(['jQuery', 'polyfill', 'fast-text-encoding', 'intersection-observer', 'classlist-polyfill', 'css!assets/css/site'], (jQuery) => {
                // Expose jQuery globally
                window.$ = jQuery;
                window.jQuery = jQuery;
            }));

        // define styles
        // TODO determine which of these files can be moved to the components themselves
        define('systemFontsCss', ['css!assets/css/fonts'], returnFirstDependency);
        define('systemFontsSizedCss', ['css!assets/css/fonts.sized'], returnFirstDependency);
        define('scrollStyles', ['css!assets/css/scrollstyles'], returnFirstDependency);
        define('dashboardcss', ['css!assets/css/dashboard'], returnFirstDependency);
        define('programStyles', ['css!' + componentsPath + '/guide/programs'], returnFirstDependency);
        define('listViewStyle', ['css!' + componentsPath + '/listview/listview'], returnFirstDependency);
        define('formDialogStyle', ['css!' + componentsPath + '/formdialog'], returnFirstDependency);
        define('clearButtonStyle', ['css!assets/css/clearbutton'], returnFirstDependency);
        define('cardStyle', ['css!' + componentsPath + '/cardbuilder/card'], returnFirstDependency);
        define('flexStyles', ['css!assets/css/flexstyles'], returnFirstDependency);

        // there are several objects that need to be instantiated
        // TODO find a better way to do this
        define('appFooter', [componentsPath + '/appFooter/appFooter'], returnFirstDependency);
        define('appFooter-shared', ['appFooter'], createSharedAppFooter);

        // TODO remove these libraries
        // all of these have been modified so we need to fix that first
        define('scroller', [bowerPath + '/scroller'], returnFirstDependency);
        define('navdrawer', [bowerPath + '/navdrawer/navdrawer'], returnFirstDependency);

        define('emby-button', [elementsPath + '/emby-button/emby-button'], returnFirstDependency);
        define('paper-icon-button-light', [elementsPath + '/emby-button/paper-icon-button-light'], returnFirstDependency);
        define('emby-checkbox', [elementsPath + '/emby-checkbox/emby-checkbox'], returnFirstDependency);
        define('emby-collapse', [elementsPath + '/emby-collapse/emby-collapse'], returnFirstDependency);
        define('emby-input', [elementsPath + '/emby-input/emby-input'], returnFirstDependency);
        define('emby-progressring', [elementsPath + '/emby-progressring/emby-progressring'], returnFirstDependency);
        define('emby-radio', [elementsPath + '/emby-radio/emby-radio'], returnFirstDependency);
        define('emby-select', [elementsPath + '/emby-select/emby-select'], returnFirstDependency);
        define('emby-slider', [elementsPath + '/emby-slider/emby-slider'], returnFirstDependency);
        define('emby-textarea', [elementsPath + '/emby-textarea/emby-textarea'], returnFirstDependency);
        define('emby-toggle', [elementsPath + '/emby-toggle/emby-toggle'], returnFirstDependency);
        define('emby-scroller', [elementsPath + '/emby-scroller/emby-scroller'], returnFirstDependency);
        define('emby-tabs', [elementsPath + '/emby-tabs/emby-tabs'], returnFirstDependency);
        define('emby-scrollbuttons', [elementsPath + '/emby-scrollbuttons/emby-scrollbuttons'], returnFirstDependency);
        define('emby-itemrefreshindicator', [elementsPath + '/emby-itemrefreshindicator/emby-itemrefreshindicator'], returnFirstDependency);
        define('emby-itemscontainer', [elementsPath + '/emby-itemscontainer/emby-itemscontainer'], returnFirstDependency);
        define('emby-playstatebutton', [elementsPath + '/emby-playstatebutton/emby-playstatebutton'], returnFirstDependency);
        define('emby-ratingbutton', [elementsPath + '/emby-ratingbutton/emby-ratingbutton'], returnFirstDependency);
        define('emby-progressbar', [elementsPath + '/emby-progressbar/emby-progressbar'], returnFirstDependency);
        define('emby-programcell', [elementsPath + '/emby-programcell/emby-programcell'], returnFirstDependency);

        define('webSettings', [scriptsPath + '/settings/webSettings'], returnFirstDependency);
        define('appSettings', [scriptsPath + '/settings/appSettings'], returnFirstDependency);
        define('userSettings', [scriptsPath + '/settings/userSettings'], returnFirstDependency);
        define('autocast', [scriptsPath + '/autocast'], returnFirstDependency);

        define('mediaSession', [componentsPath + '/playback/mediasession'], returnFirstDependency);
        define('actionsheet', [componentsPath + '/actionSheet/actionSheet'], returnFirstDependency);
        define('tunerPicker', [componentsPath + '/tunerPicker'], returnFirstDependency);
        define('mainTabsManager', [componentsPath + '/maintabsmanager'], returnFirstDependency);
        define('imageLoader', [componentsPath + '/images/imageLoader'], returnFirstDependency);
        define('directorybrowser', [componentsPath + '/directorybrowser/directorybrowser'], returnFirstDependency);
        define('metadataEditor', [componentsPath + '/metadataEditor/metadataEditor'], returnFirstDependency);
        define('personEditor', [componentsPath + '/metadataEditor/personEditor'], returnFirstDependency);
        define('playerSelectionMenu', [componentsPath + '/playback/playerSelectionMenu'], returnFirstDependency);
        define('playerSettingsMenu', [componentsPath + '/playback/playersettingsmenu'], returnFirstDependency);
        define('playMethodHelper', [componentsPath + '/playback/playmethodhelper'], returnFirstDependency);
        define('brightnessOsd', [componentsPath + '/playback/brightnessosd'], returnFirstDependency);
        define('alphaNumericShortcuts', [scriptsPath + '/alphanumericshortcuts'], returnFirstDependency);
        define('multiSelect', [componentsPath + '/multiSelect/multiSelect'], returnFirstDependency);
        define('alphaPicker', [componentsPath + '/alphaPicker/alphaPicker'], returnFirstDependency);
        define('tabbedView', [componentsPath + '/tabbedview/tabbedview'], returnFirstDependency);
        define('collectionEditor', [componentsPath + '/collectionEditor/collectionEditor'], returnFirstDependency);
        define('playlistEditor', [componentsPath + '/playlisteditor/playlisteditor'], returnFirstDependency);
        define('recordingCreator', [componentsPath + '/recordingcreator/recordingcreator'], returnFirstDependency);
        define('recordingEditor', [componentsPath + '/recordingcreator/recordingeditor'], returnFirstDependency);
        define('seriesRecordingEditor', [componentsPath + '/recordingcreator/seriesrecordingeditor'], returnFirstDependency);
        define('recordingFields', [componentsPath + '/recordingcreator/recordingfields'], returnFirstDependency);
        define('recordingButton', [componentsPath + '/recordingcreator/recordingbutton'], returnFirstDependency);
        define('recordingHelper', [componentsPath + '/recordingcreator/recordinghelper'], returnFirstDependency);
        define('subtitleEditor', [componentsPath + '/subtitleeditor/subtitleeditor'], returnFirstDependency);
        define('subtitleSync', [componentsPath + '/subtitlesync/subtitlesync'], returnFirstDependency);
        define('itemIdentifier', [componentsPath + '/itemidentifier/itemidentifier'], returnFirstDependency);
        define('itemMediaInfo', [componentsPath + '/itemMediaInfo/itemMediaInfo'], returnFirstDependency);
        define('mediaInfo', [componentsPath + '/mediainfo/mediainfo'], returnFirstDependency);
        define('itemContextMenu', [componentsPath + '/itemContextMenu'], returnFirstDependency);
        define('imageEditor', [componentsPath + '/imageeditor/imageeditor'], returnFirstDependency);
        define('imageDownloader', [componentsPath + '/imageDownloader/imageDownloader'], returnFirstDependency);
        define('dom', [scriptsPath + '/dom'], returnFirstDependency);
        define('playerStats', [componentsPath + '/playerstats/playerstats'], returnFirstDependency);
        define('searchFields', [componentsPath + '/search/searchfields'], returnFirstDependency);
        define('searchResults', [componentsPath + '/search/searchresults'], returnFirstDependency);
        define('upNextDialog', [componentsPath + '/upnextdialog/upnextdialog'], returnFirstDependency);
        define('subtitleAppearanceHelper', [componentsPath + '/subtitlesettings/subtitleappearancehelper'], returnFirstDependency);
        define('subtitleSettings', [componentsPath + '/subtitlesettings/subtitlesettings'], returnFirstDependency);
        define('settingsHelper', [componentsPath + '/settingshelper'], returnFirstDependency);
        define('displaySettings', [componentsPath + '/displaySettings/displaySettings'], returnFirstDependency);
        define('playbackSettings', [componentsPath + '/playbackSettings/playbackSettings'], returnFirstDependency);
        define('homescreenSettings', [componentsPath + '/homeScreenSettings/homeScreenSettings'], returnFirstDependency);
        define('quickConnectSettings', [componentsPath + '/quickConnectSettings/quickConnectSettings'], returnFirstDependency);
        define('playbackManager', [componentsPath + '/playback/playbackmanager'], getPlaybackManager);
        define('timeSyncManager', [componentsPath + '/syncPlay/timeSyncManager'], returnDefault);
        define('groupSelectionMenu', [componentsPath + '/syncPlay/groupSelectionMenu'], returnFirstDependency);
        define('syncPlayManager', [componentsPath + '/syncPlay/syncPlayManager'], returnDefault);
        define('playbackPermissionManager', [componentsPath + '/syncPlay/playbackPermissionManager'], returnDefault);
        define('layoutManager', [componentsPath + '/layoutManager', 'apphost'], getLayoutManager);
        define('homeSections', [componentsPath + '/homesections/homesections'], returnFirstDependency);
        define('playMenu', [componentsPath + '/playmenu'], returnFirstDependency);
        define('refreshDialog', [componentsPath + '/refreshdialog/refreshdialog'], returnFirstDependency);
        define('backdrop', [componentsPath + '/backdrop/backdrop'], returnFirstDependency);
        define('fetchHelper', [componentsPath + '/fetchhelper'], returnFirstDependency);
        define('cardBuilder', [componentsPath + '/cardbuilder/cardBuilder'], returnFirstDependency);
        define('peoplecardbuilder', [componentsPath + '/cardbuilder/peoplecardbuilder'], returnFirstDependency);
        define('chaptercardbuilder', [componentsPath + '/cardbuilder/chaptercardbuilder'], returnFirstDependency);
        define('deleteHelper', [scriptsPath + '/deleteHelper'], returnFirstDependency);
        define('tvguide', [componentsPath + '/guide/guide'], returnFirstDependency);
        define('guide-settings-dialog', [componentsPath + '/guide/guide-settings'], returnFirstDependency);
        define('viewManager', [componentsPath + '/viewManager/viewManager'], function (viewManager) {
            window.ViewManager = viewManager.default;
            viewManager.default.dispatchPageEvents(true);
            return viewManager;
        });
        define('slideshow', [componentsPath + '/slideshow/slideshow'], returnFirstDependency);
        define('focusPreventScroll', ['legacy/focusPreventScroll'], returnFirstDependency);
        define('vendorStyles', ['legacy/vendorStyles'], returnFirstDependency);
        define('userdataButtons', [componentsPath + '/userdatabuttons/userdatabuttons'], returnFirstDependency);
        define('listView', [componentsPath + '/listview/listview'], returnFirstDependency);
        define('indicators', [componentsPath + '/indicators/indicators'], returnFirstDependency);
        define('viewSettings', [componentsPath + '/viewSettings/viewSettings'], returnFirstDependency);
        define('filterMenu', [componentsPath + '/filtermenu/filtermenu'], returnFirstDependency);
        define('sortMenu', [componentsPath + '/sortmenu/sortmenu'], returnFirstDependency);
        define('sanitizefilename', [componentsPath + '/sanitizeFilename'], returnFirstDependency);
        define('toast', [componentsPath + '/toast/toast'], returnFirstDependency);
        define('scrollHelper', [scriptsPath + '/scrollHelper'], returnFirstDependency);
        define('touchHelper', [scriptsPath + '/touchHelper'], returnFirstDependency);
        define('imageUploader', [componentsPath + '/imageUploader/imageUploader'], returnFirstDependency);
        define('htmlMediaHelper', [componentsPath + '/htmlMediaHelper'], returnFirstDependency);
        define('viewContainer', [componentsPath + '/viewContainer'], returnFirstDependency);
        define('dialogHelper', [componentsPath + '/dialogHelper/dialogHelper'], returnFirstDependency);
        define('serverNotifications', [scriptsPath + '/serverNotifications'], returnFirstDependency);
        define('skinManager', [scriptsPath + '/themeManager'], returnFirstDependency);
        define('keyboardnavigation', [scriptsPath + '/keyboardNavigation'], returnFirstDependency);
        define('mouseManager', [scriptsPath + '/mouseManager'], returnFirstDependency);
        define('scrollManager', [componentsPath + '/scrollManager'], returnFirstDependency);
        define('autoFocuser', [componentsPath + '/autoFocuser'], returnFirstDependency);
        define('apiClientResolver', [], function () {
            return function () {
                return window.ApiClient;
            };
        });
    }

    initRequireJs();
    promise.then(onWebComponentsReady);
}

initClient();

pageClassOn('viewshow', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.add('noHeaderRight');
});

pageClassOn('viewhide', 'standalonePage', function () {
    document.querySelector('.skinHeader').classList.remove('noHeaderRight');
});
