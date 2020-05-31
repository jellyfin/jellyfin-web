function getWindowLocationSearch(win) {
    // TODO: Replace with URLSearchParams
    'use strict';

    var search = (win || window).location.search;

    if (!search) {
        var index = window.location.href.indexOf('?');

        if (-1 != index) {
            search = window.location.href.substring(index);
        }
    }

    return search || '';
}

var Dashboard = {
    getCurrentUser: function () {
        return window.ApiClient.getCurrentUser(false);
    },

    //TODO: investigate url prefix support for serverAddress function
    serverAddress: function () {
        if (AppInfo.isNativeApp) {
            var apiClient = window.ApiClient;

            if (apiClient) {
                return apiClient.serverAddress();
            }

            return null;
        }

        var urlLower = window.location.href.toLowerCase();
        var index = urlLower.lastIndexOf('/web');

        if (-1 != index) {
            return urlLower.substring(0, index);
        }

        var loc = window.location;
        var address = loc.protocol + '//' + loc.hostname;

        if (loc.port) {
            address += ':' + loc.port;
        }

        return address;
    },
    getCurrentUserId: function () {
        var apiClient = window.ApiClient;

        if (apiClient) {
            return apiClient.getCurrentUserId();
        }

        return null;
    },
    onServerChanged: function (userId, accessToken, apiClient) {
        apiClient = apiClient || window.ApiClient;
        window.ApiClient = apiClient;
    },
    logout: function () {
        ConnectionManager.logout().then(function () {
            var loginPage;

            if (AppInfo.isNativeApp) {
                loginPage = 'selectserver.html';
                window.ApiClient = null;
            } else {
                loginPage = 'login.html';
            }

            Dashboard.navigate(loginPage);
        });
    },
    getConfigurationPageUrl: function (name) {
        return 'configurationpage?name=' + encodeURIComponent(name);
    },
    getConfigurationResourceUrl: function (name) {
        if (AppInfo.isNativeApp) {
            return ApiClient.getUrl('web/ConfigurationPage', {
                name: name
            });
        }

        return Dashboard.getConfigurationPageUrl(name);
    },
    navigate: function (url, preserveQueryString) {
        if (!url) {
            throw new Error('url cannot be null or empty');
        }

        var queryString = getWindowLocationSearch();

        if (preserveQueryString && queryString) {
            url += queryString;
        }

        return new Promise(function (resolve, reject) {
            require(['appRouter'], function (appRouter) {
                return appRouter.show(url).then(resolve, reject);
            });
        });
    },
    navigate_direct: function (path) {
        return new Promise(function (resolve, reject) {
            require(['appRouter'], function (appRouter) {
                return appRouter.showDirect(path).then(resolve, reject);
            });
        });
    },
    processPluginConfigurationUpdateResult: function () {
        require(['loading', 'toast'], function (loading, toast) {
            loading.hide();
            toast(Globalize.translate('MessageSettingsSaved'));
        });
    },
    processServerConfigurationUpdateResult: function () {
        require(['loading', 'toast'], function (loading, toast) {
            loading.hide();
            toast(Globalize.translate('MessageSettingsSaved'));
        });
    },
    processErrorResponse: function (response) {
        require(['loading'], function (loading) {
            loading.hide();
        });

        var status = '' + response.status;

        if (response.statusText) {
            status = response.statusText;
        }

        Dashboard.alert({
            title: status,
            message: response.headers ? response.headers.get('X-Application-Error-Code') : null
        });
    },
    alert: function (options) {
        if ('string' == typeof options) {
            return void require(['toast'], function (toast) {
                toast({
                    text: options
                });
            });
        }

        require(['alert'], function (alert) {
            alert({
                title: options.title || Globalize.translate('HeaderAlert'),
                text: options.message
            }).then(options.callback || function () {});
        });
    },
    restartServer: function () {
        var apiClient = window.ApiClient;

        if (apiClient) {
            require(['serverRestartDialog', 'events'], function (ServerRestartDialog, events) {
                var dialog = new ServerRestartDialog({
                    apiClient: apiClient
                });
                events.on(dialog, 'restarted', function () {
                    if (AppInfo.isNativeApp) {
                        apiClient.ensureWebSocket();
                    } else {
                        window.location.reload(true);
                    }
                });
                dialog.show();
            });
        }
    },
    capabilities: function (appHost) {
        var capabilities = {
            PlayableMediaTypes: ['Audio', 'Video'],
            SupportedCommands: ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter', 'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back', 'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp', 'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex', 'DisplayContent', 'GoToSearch', 'DisplayMessage', 'SetRepeatMode', 'ChannelUp', 'ChannelDown', 'PlayMediaSource', 'PlayTrailers'],
            SupportsPersistentIdentifier: 'cordova' === self.appMode || 'android' === self.appMode,
            SupportsMediaControl: true
        };
        appHost.getPushTokenInfo();
        return capabilities = Object.assign(capabilities, appHost.getPushTokenInfo());
    },
    selectServer: function () {
        if (window.NativeShell && typeof window.NativeShell.selectServer === 'function') {
            window.NativeShell.selectServer();
        } else {
            Dashboard.navigate('selectserver.html');
        }
    },
    hideLoadingMsg: function() {
        'use strict';
        require(['loading'], function(loading) {
            loading.hide();
        });
    },
    showLoadingMsg: function() {
        'use strict';
        require(['loading'], function(loading) {
            loading.show();
        });
    },
    confirm: function(message, title, callback) {
        'use strict';
        require(['confirm'], function(confirm) {
            confirm(message, title).then(function() {
                callback(!0);
            }).catch(function() {
                callback(!1);
            });
        });
    }
};

var AppInfo = {};

!function () {
    'use strict';

    function defineConnectionManager(connectionManager) {
        window.ConnectionManager = connectionManager;
        define('connectionManager', [], function () {
            return connectionManager;
        });
    }

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
        return require(['dom', 'connectionManagerFactory', 'apphost', 'credentialprovider', 'events', 'userSettings'], function (dom, ConnectionManager, apphost, credentialProvider, events, userSettings) {
            dom.pageClassOn('viewshow', 'standalonePage', function () {
                document.querySelector('.skinHeader').classList.add('noHeaderRight');
            });

            dom.pageClassOn('viewhide', 'standalonePage', function () {
                document.querySelector('.skinHeader').classList.remove('noHeaderRight');
            });

            var credentialProviderInstance = new credentialProvider();
            var promises = [apphost.getSyncProfile(), apphost.init()];

            return Promise.all(promises).then(function (responses) {
                var deviceProfile = responses[0];
                var capabilities = Dashboard.capabilities(apphost);

                capabilities.DeviceProfile = deviceProfile;

                var connectionManager = new ConnectionManager(credentialProviderInstance, apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), capabilities);

                defineConnectionManager(connectionManager);
                bindConnectionManagerEvents(connectionManager, events, userSettings);

                if (!AppInfo.isNativeApp) {
                    console.debug('loading ApiClient singleton');

                    return require(['apiclient'], function (apiClientFactory) {
                        console.debug('creating ApiClient singleton');

                        var apiClient = new apiClientFactory(Dashboard.serverAddress(), apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId());

                        apiClient.enableAutomaticNetworking = false;
                        apiClient.manualAddressOnly = true;

                        connectionManager.addApiClient(apiClient);

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

    function getPlaybackManager(playbackManager) {
        window.addEventListener('beforeunload', function () {
            try {
                playbackManager.onAppClose();
            } catch (err) {
                console.error('error in onAppClose: ' + err);
            }
        });
        return playbackManager;
    }

    function getLayoutManager(layoutManager, appHost) {
        if (appHost.getDefaultLayout) {
            layoutManager.defaultLayout = appHost.getDefaultLayout();
        }

        layoutManager.init();
        return layoutManager;
    }

    function createSharedAppFooter(appFooter) {
        return new appFooter({});
    }

    function onRequireJsError(requireType, requireModules) {
        console.error('RequireJS error: ' + (requireType || 'unknown') + '. Failed modules: ' + (requireModules || []).join(','));
    }

    function defineResizeObserver() {
        if (self.ResizeObserver) {
            define('ResizeObserver', [], function () {
                return self.ResizeObserver;
            });
        } else {
            define('ResizeObserver', ['resize-observer-polyfill'], returnFirstDependency);
        }
    }

    function init() {
        define('livetvcss', ['css!assets/css/livetv.css'], returnFirstDependency);
        define('detailtablecss', ['css!assets/css/detailtable.css'], returnFirstDependency);

        var promises = [];
        if (!window.fetch) {
            promises.push(require(['fetch']));
        }

        Promise.all(promises).then(function () {
            createConnectionManager().then(function () {
                console.debug('initAfterDependencies promises resolved');

                require(['globalize', 'browser'], function (globalize, browser) {
                    window.Globalize = globalize;
                    loadCoreDictionary(globalize).then(function () {
                        onGlobalizeInit(browser);
                    });
                });
                require(['keyboardnavigation'], function(keyboardnavigation) {
                    keyboardnavigation.enable();
                });
                require(['mouseManager']);
                require(['focusPreventScroll']);
                require(['autoFocuser'], function(autoFocuser) {
                    autoFocuser.enable();
                });
                require(['globalize', 'connectionManager', 'events'], function (globalize, connectionManager, events) {
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

    function onGlobalizeInit(browser) {
        if ('android' === self.appMode) {
            if (-1 !== self.location.href.toString().toLowerCase().indexOf('start=backgroundsync')) {
                return onAppReady(browser);
            }
        }

        document.title = Globalize.translateDocument(document.title, 'core');

        if (browser.tv && !browser.android) {
            console.debug('using system fonts with explicit sizes');
            require(['systemFontsSizedCss']);
        } else {
            console.debug('using default fonts');
            require(['systemFontsCss']);
        }

        require(['apphost', 'css!assets/css/librarybrowser'], function (appHost) {
            loadPlugins(appHost, browser).then(function () {
                onAppReady(browser);
            });
        });
    }

    function loadPlugins(appHost, browser) {
        console.debug('loading installed plugins');
        var list = [
            'plugins/playAccessValidation/plugin',
            'plugins/experimentalWarnings/plugin',
            'plugins/htmlAudioPlayer/plugin',
            'plugins/htmlVideoPlayer/plugin',
            'plugins/photoPlayer/plugin',
            'plugins/bookPlayer/plugin',
            'plugins/youtubePlayer/plugin',
            'plugins/backdropScreensaver/plugin',
            'plugins/logoScreensaver/plugin'
        ];

        if (appHost.supports('remotecontrol')) {
            list.push('plugins/sessionPlayer/plugin');

            if (browser.chrome || browser.opera) {
                list.push('plugins/chromecastPlayer/plugin');
            }
        }

        if (window.NativeShell) {
            list = list.concat(window.NativeShell.getPlugins());
        }

        return new Promise(function (resolve, reject) {
            Promise.all(list.map(loadPlugin)).then(function () {
                require(['packageManager'], function (packageManager) {
                    packageManager.init().then(resolve, reject);
                });
            }, reject);
        });
    }

    function loadPlugin(url) {
        return new Promise(function (resolve, reject) {
            require(['pluginManager'], function (pluginManager) {
                pluginManager.loadPlugin(url).then(resolve, reject);
            });
        });
    }

    function onAppReady(browser) {
        console.debug('begin onAppReady');

        // ensure that appHost is loaded in this point
        require(['apphost', 'appRouter'], function (appHost, appRouter) {
            window.Emby = {};

            console.debug('onAppReady: loading dependencies');
            if (browser.iOS) {
                require(['css!assets/css/ios.css']);
            }

            window.Emby.Page = appRouter;

            require(['emby-button', 'scripts/themeLoader', 'libraryMenu', 'scripts/routes'], function () {
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

    function onWebComponentsReady() {
        define('filesystem', ['scripts/filesystem'], returnFirstDependency);

        define('lazyLoader', ['components/lazyLoader/lazyLoaderIntersectionObserver'], returnFirstDependency);
        define('shell', ['scripts/shell'], returnFirstDependency);

        define('registerElement', ['document-register-element'], returnFirstDependency);

        define('alert', ['components/alert'], returnFirstDependency);

        defineResizeObserver();

        define('dialog', ['components/dialog/dialog'], returnFirstDependency);

        define('confirm', ['components/confirm/confirm'], returnFirstDependency);

        define('prompt', ['components/prompt/prompt'], returnFirstDependency);

        define('loading', ['components/loading/loading'], returnFirstDependency);
        define('multi-download', ['scripts/multiDownload'], returnFirstDependency);
        define('fileDownloader', ['scripts/fileDownloader'], returnFirstDependency);

        define('castSenderApiLoader', ['components/castSenderApi'], returnFirstDependency);

        if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
            AppInfo.isNativeApp = true;
        }

        init();
    }

    var localApiClient;

    (function () {
        var urlArgs = 'v=' + (window.dashboardVersion || new Date().getDate());

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
                    'document-register-element',
                    'fetch',
                    'flvjs',
                    'jstree',
                    'epubjs',
                    'jQuery',
                    'hlsjs',
                    'howler',
                    'resize-observer-polyfill',
                    'shaka',
                    'swiper',
                    'queryString',
                    'sortable',
                    'webcomponents',
                    'material-icons',
                    'jellyfin-noto',
                    'date-fns',
                    'page',
                    'fast-text-encoding',
                    'intersection-observer',
                    'classlist-polyfill',
                    'screenfull',
                    'headroom',
                    'apiclient',
                    'events',
                    'credentialprovider',
                    'connectionManagerFactory',
                    'appStorage'
                ]
            },
            urlArgs: urlArgs,
            paths: {
                browserdeviceprofile: 'scripts/browserDeviceProfile',
                browser: 'scripts/browser',
                libraryBrowser: 'scripts/libraryBrowser',
                inputManager: 'scripts/inputManager',
                datetime: 'scripts/datetime',
                globalize: 'scripts/globalize',
                dfnshelper: 'scripts/dfnshelper',
                libraryMenu: 'scripts/libraryMenu',
                playlisteditor: 'components/playlisteditor/playlisteditor',
                medialibrarycreator: 'components/mediaLibraryCreator/mediaLibraryCreator',
                medialibraryeditor: 'components/mediaLibraryEditor/mediaLibraryEditor',
                imageoptionseditor: 'components/imageOptionsEditor/imageOptionsEditor',
                apphost: 'components/apphost',
                visibleinviewport: 'libraries/visibleinviewport',
                qualityoptions: 'components/qualityOptions',
                focusManager: 'components/focusManager',
                itemHelper: 'components/itemHelper',
                itemShortcuts: 'components/shortcuts',
                playQueueManager: 'components/playback/playqueuemanager',
                nowPlayingHelper: 'components/playback/nowplayinghelper',
                pluginManager: 'components/pluginManager',
                packageManager: 'components/packageManager',
                screensaverManager: 'components/screensavermanager',
                chromecastHelper: 'plugins/chromecastPlayer/chromecastHelpers'
            },
            onError: onRequireJsError
        });

        require(['fetch']);
        require(['fast-text-encoding']);
        require(['intersection-observer']);
        require(['classlist-polyfill']);

        // Expose jQuery globally
        require(['jQuery'], function(jQuery) {
            window.$ = jQuery;
            window.jQuery = jQuery;
        });

        require(['css!assets/css/site']);
        require(['jellyfin-noto']);

        // define styles
        // TODO determine which of these files can be moved to the components themselves
        define('systemFontsCss', ['css!assets/css/fonts'], returnFirstDependency);
        define('systemFontsSizedCss', ['css!assets/css/fonts.sized'], returnFirstDependency);
        define('scrollStyles', ['css!assets/css/scrollstyles'], returnFirstDependency);
        define('dashboardcss', ['css!assets/css/dashboard'], returnFirstDependency);
        define('programStyles', ['css!components/guide/programs'], returnFirstDependency);
        define('listViewStyle', ['css!components/listview/listview'], returnFirstDependency);
        define('formDialogStyle', ['css!components/formdialog'], returnFirstDependency);
        define('clearButtonStyle', ['css!assets/css/clearbutton'], returnFirstDependency);
        define('cardStyle', ['css!components/cardbuilder/card'], returnFirstDependency);
        define('flexStyles', ['css!assets/css/flexstyles'], returnFirstDependency);

        // define legacy features
        // TODO delete the rest of these
        define('fnchecked', ['legacy/fnchecked'], returnFirstDependency);
        define('legacySelectMenu', ['legacy/selectmenu'], returnFirstDependency);

        // there are several objects that need to be instantiated
        // TODO find a better way to do this
        define('appFooter', ['components/appFooter/appFooter'], returnFirstDependency);
        define('appFooter-shared', ['appFooter'], createSharedAppFooter);

        // TODO remove these libraries
        // all of these have been modified so we need to fix that first
        define('scroller', ['libraries/scroller'], returnFirstDependency);
        define('navdrawer', ['libraries/navdrawer/navdrawer'], returnFirstDependency);

        define('emby-button', ['elements/emby-button/emby-button'], returnFirstDependency);
        define('paper-icon-button-light', ['elements/emby-button/paper-icon-button-light'], returnFirstDependency);
        define('emby-checkbox', ['elements/emby-checkbox/emby-checkbox'], returnFirstDependency);
        define('emby-collapse', ['elements/emby-collapse/emby-collapse'], returnFirstDependency);
        define('emby-input', ['elements/emby-input/emby-input'], returnFirstDependency);
        define('emby-progressring', ['elements/emby-progressring/emby-progressring'], returnFirstDependency);
        define('emby-radio', ['elements/emby-radio/emby-radio'], returnFirstDependency);
        define('emby-select', ['elements/emby-select/emby-select'], returnFirstDependency);
        define('emby-slider', ['elements/emby-slider/emby-slider'], returnFirstDependency);
        define('emby-textarea', ['elements/emby-textarea/emby-textarea'], returnFirstDependency);
        define('emby-toggle', ['elements/emby-toggle/emby-toggle'], returnFirstDependency);
        define('emby-scroller', ['elements/emby-scroller/emby-scroller'], returnFirstDependency);
        define('emby-tabs', ['elements/emby-tabs/emby-tabs'], returnFirstDependency);
        define('emby-scrollbuttons', ['elements/emby-scrollbuttons/emby-scrollbuttons'], returnFirstDependency);
        define('emby-itemrefreshindicator', ['elements/emby-itemrefreshindicator/emby-itemrefreshindicator'], returnFirstDependency);
        define('emby-itemscontainer', ['elements/emby-itemscontainer/emby-itemscontainer'], returnFirstDependency);
        define('emby-playstatebutton', ['elements/emby-playstatebutton/emby-playstatebutton'], returnFirstDependency);
        define('emby-ratingbutton', ['elements/emby-ratingbutton/emby-ratingbutton'], returnFirstDependency);
        define('emby-progressbar', ['elements/emby-progressbar/emby-progressbar'], returnFirstDependency);
        define('emby-programcell', ['elements/emby-programcell/emby-programcell'], returnFirstDependency);

        define('webSettings', ['scripts/settings/webSettings'], returnFirstDependency);
        define('appSettings', ['scripts/settings/appSettings'], returnFirstDependency);
        define('userSettings', ['scripts/settings/userSettings'], returnFirstDependency);

        define('mediaSession', ['components/playback/mediasession'], returnFirstDependency);
        define('actionsheet', ['components/actionSheet/actionSheet'], returnFirstDependency);
        define('tunerPicker', ['components/tunerPicker'], returnFirstDependency);
        define('mainTabsManager', ['components/maintabsmanager'], returnFirstDependency);
        define('imageLoader', ['components/images/imageLoader'], returnFirstDependency);
        define('directorybrowser', ['components/directorybrowser/directorybrowser'], returnFirstDependency);
        define('metadataEditor', ['components/metadataEditor/metadataEditor'], returnFirstDependency);
        define('personEditor', ['components/metadataEditor/personEditor'], returnFirstDependency);
        define('playerSelectionMenu', ['components/playback/playerSelectionMenu'], returnFirstDependency);
        define('playerSettingsMenu', ['components/playback/playersettingsmenu'], returnFirstDependency);
        define('playMethodHelper', ['components/playback/playmethodhelper'], returnFirstDependency);
        define('brightnessOsd', ['components/playback/brightnessosd'], returnFirstDependency);
        define('alphaNumericShortcuts', ['scripts/alphanumericshortcuts'], returnFirstDependency);
        define('multiSelect', ['components/multiSelect/multiSelect'], returnFirstDependency);
        define('alphaPicker', ['components/alphaPicker/alphaPicker'], returnFirstDependency);
        define('tabbedView', ['components/tabbedview/tabbedview'], returnFirstDependency);
        define('itemsTab', ['components/tabbedview/itemstab'], returnFirstDependency);
        define('collectionEditor', ['components/collectionEditor/collectionEditor'], returnFirstDependency);
        define('serverRestartDialog', ['components/serverRestartDialog'], returnFirstDependency);
        define('playlistEditor', ['components/playlisteditor/playlisteditor'], returnFirstDependency);
        define('recordingCreator', ['components/recordingcreator/recordingcreator'], returnFirstDependency);
        define('recordingEditor', ['components/recordingcreator/recordingeditor'], returnFirstDependency);
        define('seriesRecordingEditor', ['components/recordingcreator/seriesrecordingeditor'], returnFirstDependency);
        define('recordingFields', ['components/recordingcreator/recordingfields'], returnFirstDependency);
        define('recordingButton', ['components/recordingcreator/recordingbutton'], returnFirstDependency);
        define('recordingHelper', ['components/recordingcreator/recordinghelper'], returnFirstDependency);
        define('subtitleEditor', ['components/subtitleeditor/subtitleeditor'], returnFirstDependency);
        define('subtitleSync', ['components/subtitlesync/subtitlesync'], returnFirstDependency);
        define('itemIdentifier', ['components/itemidentifier/itemidentifier'], returnFirstDependency);
        define('itemMediaInfo', ['components/itemMediaInfo/itemMediaInfo'], returnFirstDependency);
        define('mediaInfo', ['components/mediainfo/mediainfo'], returnFirstDependency);
        define('itemContextMenu', ['components/itemContextMenu'], returnFirstDependency);
        define('imageEditor', ['components/imageeditor/imageeditor'], returnFirstDependency);
        define('imageDownloader', ['components/imageDownloader/imageDownloader'], returnFirstDependency);
        define('dom', ['scripts/dom'], returnFirstDependency);
        define('playerStats', ['components/playerstats/playerstats'], returnFirstDependency);
        define('searchFields', ['components/search/searchfields'], returnFirstDependency);
        define('searchResults', ['components/search/searchresults'], returnFirstDependency);
        define('upNextDialog', ['components/upnextdialog/upnextdialog'], returnFirstDependency);
        define('subtitleAppearanceHelper', ['components/subtitlesettings/subtitleappearancehelper'], returnFirstDependency);
        define('subtitleSettings', ['components/subtitlesettings/subtitlesettings'], returnFirstDependency);
        define('displaySettings', ['components/displaySettings/displaySettings'], returnFirstDependency);
        define('playbackSettings', ['components/playbackSettings/playbackSettings'], returnFirstDependency);
        define('homescreenSettings', ['components/homeScreenSettings/homeScreenSettings'], returnFirstDependency);
        define('playbackManager', ['components/playback/playbackmanager'], getPlaybackManager);
        define('timeSyncManager', ['components/syncPlay/timeSyncManager'], returnDefault);
        define('groupSelectionMenu', ['components/syncPlay/groupSelectionMenu'], returnFirstDependency);
        define('syncPlayManager', ['components/syncPlay/syncPlayManager'], returnDefault);
        define('playbackPermissionManager', ['components/syncPlay/playbackPermissionManager'], returnDefault);
        define('layoutManager', ['components/layoutManager', 'apphost'], getLayoutManager);
        define('homeSections', ['components/homesections/homesections'], returnFirstDependency);
        define('playMenu', ['components/playmenu'], returnFirstDependency);
        define('refreshDialog', ['components/refreshdialog/refreshdialog'], returnFirstDependency);
        define('backdrop', ['components/backdrop/backdrop'], returnFirstDependency);
        define('fetchHelper', ['components/fetchhelper'], returnFirstDependency);
        define('cardBuilder', ['components/cardbuilder/cardBuilder'], returnFirstDependency);
        define('peoplecardbuilder', ['components/cardbuilder/peoplecardbuilder'], returnFirstDependency);
        define('chaptercardbuilder', ['components/cardbuilder/chaptercardbuilder'], returnFirstDependency);
        define('deleteHelper', ['scripts/deleteHelper'], returnFirstDependency);
        define('tvguide', ['components/guide/guide'], returnFirstDependency);
        define('guide-settings-dialog', ['components/guide/guide-settings'], returnFirstDependency);
        define('loadingDialog', ['components/loadingDialog/loadingDialog'], returnFirstDependency);
        define('viewManager', ['components/viewManager/viewManager'], function (viewManager) {
            window.ViewManager = viewManager;
            viewManager.dispatchPageEvents(true);
            return viewManager;
        });
        define('slideshow', ['components/slideshow/slideshow'], returnFirstDependency);
        define('focusPreventScroll', ['legacy/focusPreventScroll'], returnFirstDependency);
        define('userdataButtons', ['components/userdatabuttons/userdatabuttons'], returnFirstDependency);
        define('listView', ['components/listview/listview'], returnFirstDependency);
        define('indicators', ['components/indicators/indicators'], returnFirstDependency);
        define('viewSettings', ['components/viewSettings/viewSettings'], returnFirstDependency);
        define('filterMenu', ['components/filtermenu/filtermenu'], returnFirstDependency);
        define('sortMenu', ['components/sortmenu/sortmenu'], returnFirstDependency);
        define('sanitizefilename', ['components/sanitizeFilename'], returnFirstDependency);
        define('toast', ['components/toast/toast'], returnFirstDependency);
        define('scrollHelper', ['scripts/scrollHelper'], returnFirstDependency);
        define('touchHelper', ['scripts/touchHelper'], returnFirstDependency);
        define('imageUploader', ['components/imageUploader/imageUploader'], returnFirstDependency);
        define('htmlMediaHelper', ['components/htmlMediaHelper'], returnFirstDependency);
        define('viewContainer', ['components/viewContainer'], returnFirstDependency);
        define('dialogHelper', ['components/dialogHelper/dialogHelper'], returnFirstDependency);
        define('serverNotifications', ['scripts/serverNotifications'], returnFirstDependency);
        define('skinManager', ['components/skinManager'], returnFirstDependency);
        define('keyboardnavigation', ['scripts/keyboardNavigation'], returnFirstDependency);
        define('mouseManager', ['scripts/mouseManager'], returnFirstDependency);
        define('scrollManager', ['components/scrollManager'], returnFirstDependency);
        define('autoFocuser', ['components/autoFocuser'], returnFirstDependency);
        define('connectionManager', [], function () {
            return ConnectionManager;
        });
        define('apiClientResolver', [], function () {
            return function () {
                return window.ApiClient;
            };
        });
        define('appRouter', ['components/appRouter', 'itemHelper'], function (appRouter, itemHelper) {
            function showItem(item, serverId, options) {
                if ('string' == typeof item) {
                    require(['connectionManager'], function (connectionManager) {
                        var apiClient = connectionManager.currentApiClient();
                        apiClient.getItem(apiClient.getCurrentUserId(), item).then(function (item) {
                            appRouter.showItem(item, options);
                        });
                    });
                } else {
                    if (2 == arguments.length) {
                        options = arguments[1];
                    }

                    appRouter.show('/' + appRouter.getRouteUrl(item, options), {
                        item: item
                    });
                }
            }

            appRouter.showLocalLogin = function (serverId) {
                Dashboard.navigate('login.html?serverid=' + serverId);
            };

            appRouter.showVideoOsd = function () {
                return Dashboard.navigate('videoosd.html');
            };

            appRouter.showSelectServer = function () {
                Dashboard.navigate(AppInfo.isNativeApp ? 'selectserver.html' : 'login.html');
            };

            appRouter.showWelcome = function () {
                Dashboard.navigate(AppInfo.isNativeApp ? 'selectserver.html' : 'login.html');
            };

            appRouter.showSettings = function () {
                Dashboard.navigate('mypreferencesmenu.html');
            };

            appRouter.showGuide = function () {
                Dashboard.navigate('livetv.html?tab=1');
            };

            appRouter.goHome = function () {
                Dashboard.navigate('home.html');
            };

            appRouter.showSearch = function () {
                Dashboard.navigate('search.html');
            };

            appRouter.showLiveTV = function () {
                Dashboard.navigate('livetv.html');
            };

            appRouter.showRecordedTV = function () {
                Dashboard.navigate('livetv.html?tab=3');
            };

            appRouter.showFavorites = function () {
                Dashboard.navigate('home.html?tab=1');
            };

            appRouter.showSettings = function () {
                Dashboard.navigate('mypreferencesmenu.html');
            };

            appRouter.setTitle = function (title) {
                LibraryMenu.setTitle(title);
            };

            appRouter.getRouteUrl = function (item, options) {
                if (!item) {
                    throw new Error('item cannot be null');
                }

                if (item.url) {
                    return item.url;
                }

                var context = options ? options.context : null;
                var id = item.Id || item.ItemId;

                if (!options) {
                    options = {};
                }

                var itemType = item.Type || (options ? options.itemType : null);
                var serverId = item.ServerId || options.serverId;

                if ('settings' === item) {
                    return 'mypreferencesmenu.html';
                }

                if ('wizard' === item) {
                    return 'wizardstart.html';
                }

                if ('manageserver' === item) {
                    return 'dashboard.html';
                }

                if ('recordedtv' === item) {
                    return 'livetv.html?tab=3&serverId=' + options.serverId;
                }

                if ('nextup' === item) {
                    return 'list.html?type=nextup&serverId=' + options.serverId;
                }

                if ('list' === item) {
                    var url = 'list.html?serverId=' + options.serverId + '&type=' + options.itemTypes;

                    if (options.isFavorite) {
                        url += '&IsFavorite=true';
                    }

                    return url;
                }

                if ('livetv' === item) {
                    if ('programs' === options.section) {
                        return 'livetv.html?tab=0&serverId=' + options.serverId;
                    }
                    if ('guide' === options.section) {
                        return 'livetv.html?tab=1&serverId=' + options.serverId;
                    }

                    if ('movies' === options.section) {
                        return 'list.html?type=Programs&IsMovie=true&serverId=' + options.serverId;
                    }

                    if ('shows' === options.section) {
                        return 'list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + options.serverId;
                    }

                    if ('sports' === options.section) {
                        return 'list.html?type=Programs&IsSports=true&serverId=' + options.serverId;
                    }

                    if ('kids' === options.section) {
                        return 'list.html?type=Programs&IsKids=true&serverId=' + options.serverId;
                    }

                    if ('news' === options.section) {
                        return 'list.html?type=Programs&IsNews=true&serverId=' + options.serverId;
                    }

                    if ('onnow' === options.section) {
                        return 'list.html?type=Programs&IsAiring=true&serverId=' + options.serverId;
                    }

                    if ('dvrschedule' === options.section) {
                        return 'livetv.html?tab=4&serverId=' + options.serverId;
                    }

                    if ('seriesrecording' === options.section) {
                        return 'livetv.html?tab=5&serverId=' + options.serverId;
                    }

                    return 'livetv.html?serverId=' + options.serverId;
                }

                if ('SeriesTimer' == itemType) {
                    return 'itemdetails.html?seriesTimerId=' + id + '&serverId=' + serverId;
                }

                if ('livetv' == item.CollectionType) {
                    return 'livetv.html';
                }

                if ('Genre' === item.Type) {
                    url = 'list.html?genreId=' + item.Id + '&serverId=' + serverId;

                    if ('livetv' === context) {
                        url += '&type=Programs';
                    }

                    if (options.parentId) {
                        url += '&parentId=' + options.parentId;
                    }

                    return url;
                }

                if ('MusicGenre' === item.Type) {
                    url = 'list.html?musicGenreId=' + item.Id + '&serverId=' + serverId;

                    if (options.parentId) {
                        url += '&parentId=' + options.parentId;
                    }

                    return url;
                }

                if ('Studio' === item.Type) {
                    url = 'list.html?studioId=' + item.Id + '&serverId=' + serverId;

                    if (options.parentId) {
                        url += '&parentId=' + options.parentId;
                    }

                    return url;
                }

                if ('folders' !== context && !itemHelper.isLocalItem(item)) {
                    if ('movies' == item.CollectionType) {
                        url = 'movies.html?topParentId=' + item.Id;

                        if (options && 'latest' === options.section) {
                            url += '&tab=1';
                        }

                        return url;
                    }

                    if ('tvshows' == item.CollectionType) {
                        url = 'tv.html?topParentId=' + item.Id;

                        if (options && 'latest' === options.section) {
                            url += '&tab=2';
                        }

                        return url;
                    }

                    if ('music' == item.CollectionType) {
                        return 'music.html?topParentId=' + item.Id;
                    }
                }

                var itemTypes = ['Playlist', 'TvChannel', 'Program', 'BoxSet', 'MusicAlbum', 'MusicGenre', 'Person', 'Recording', 'MusicArtist'];

                if (itemTypes.indexOf(itemType) >= 0) {
                    return 'itemdetails.html?id=' + id + '&serverId=' + serverId;
                }

                var contextSuffix = context ? '&context=' + context : '';

                if ('Series' == itemType || 'Season' == itemType || 'Episode' == itemType) {
                    return 'itemdetails.html?id=' + id + contextSuffix + '&serverId=' + serverId;
                }

                if (item.IsFolder) {
                    if (id) {
                        return 'list.html?parentId=' + id + '&serverId=' + serverId;
                    }

                    return '#';
                }

                return 'itemdetails.html?id=' + id + '&serverId=' + serverId;
            };

            appRouter.showItem = showItem;
            return appRouter;
        });
    })();

    return onWebComponentsReady();
}();
