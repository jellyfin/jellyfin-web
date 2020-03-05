function getWindowLocationSearch(win) {
    "use strict";

    var search = (win || window).location.search;

    if (!search) {
        var index = window.location.href.indexOf("?");

        if (-1 != index) {
            search = window.location.href.substring(index);
        }
    }

    return search || "";
}

function getParameterByName(name, url) {
    "use strict";

    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS, "i");
    var results = regex.exec(url || getWindowLocationSearch());

    if (null == results) {
        return "";
    }

    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function pageClassOn(eventName, className, fn) {
    "use strict";

    document.addEventListener(eventName, function (event) {
        var target = event.target;

        if (target.classList.contains(className)) {
            fn.call(target, event);
        }
    });
}

function pageIdOn(eventName, id, fn) {
    "use strict";

    document.addEventListener(eventName, function (event) {
        var target = event.target;

        if (target.id === id) {
            fn.call(target, event);
        }
    });
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
        var index = urlLower.lastIndexOf("/web");

        if (-1 != index) {
            return urlLower.substring(0, index);
        }

        var loc = window.location;
        var address = loc.protocol + "//" + loc.hostname;

        if (loc.port) {
            address += ":" + loc.port;
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
                loginPage = "selectserver.html";
                window.ApiClient = null;
            } else {
                loginPage = "login.html";
            }

            Dashboard.navigate(loginPage);
        });
    },
    getConfigurationPageUrl: function (name) {
        return "configurationpage?name=" + encodeURIComponent(name);
    },
    getConfigurationResourceUrl: function (name) {
        if (AppInfo.isNativeApp) {
            return ApiClient.getUrl("web/ConfigurationPage", {
                name: name
            });
        }

        return Dashboard.getConfigurationPageUrl(name);
    },
    navigate: function (url, preserveQueryString) {
        if (!url) {
            throw new Error("url cannot be null or empty");
        }

        var queryString = getWindowLocationSearch();

        if (preserveQueryString && queryString) {
            url += queryString;
        }

        return new Promise(function (resolve, reject) {
            require(["appRouter"], function (appRouter) {
                return appRouter.show(url).then(resolve, reject);
            });
        });
    },
    navigate_direct: function (path) {
        return new Promise(function (resolve, reject) {
            require(["appRouter"], function (appRouter) {
                return appRouter.showDirect(path).then(resolve, reject);
            });
        });
    },
    processPluginConfigurationUpdateResult: function () {
        require(["loading", "toast"], function (loading, toast) {
            loading.hide();
            toast(Globalize.translate("MessageSettingsSaved"));
        });
    },
    processServerConfigurationUpdateResult: function (result) {
        require(["loading", "toast"], function (loading, toast) {
            loading.hide();
            toast(Globalize.translate("MessageSettingsSaved"));
        });
    },
    processErrorResponse: function (response) {
        require(["loading"], function (loading) {
            loading.hide();
        });

        var status = "" + response.status;

        if (response.statusText) {
            status = response.statusText;
        }

        Dashboard.alert({
            title: status,
            message: response.headers ? response.headers.get("X-Application-Error-Code") : null
        });
    },
    alert: function (options) {
        if ("string" == typeof options) {
            return void require(["toast"], function (toast) {
                toast({
                    text: options
                });
            });
        }

        require(["alert"], function (alert) {
            alert({
                title: options.title || Globalize.translate("HeaderAlert"),
                text: options.message
            }).then(options.callback || function () {});
        });
    },
    restartServer: function () {
        var apiClient = window.ApiClient;

        if (apiClient) {
            require(["serverRestartDialog", "events"], function (ServerRestartDialog, events) {
                var dialog = new ServerRestartDialog({
                    apiClient: apiClient
                });
                events.on(dialog, "restarted", function () {
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
            PlayableMediaTypes: ["Audio", "Video"],
            SupportedCommands: ["MoveUp", "MoveDown", "MoveLeft", "MoveRight", "PageUp", "PageDown", "PreviousLetter", "NextLetter", "ToggleOsd", "ToggleContextMenu", "Select", "Back", "SendKey", "SendString", "GoHome", "GoToSettings", "VolumeUp", "VolumeDown", "Mute", "Unmute", "ToggleMute", "SetVolume", "SetAudioStreamIndex", "SetSubtitleStreamIndex", "DisplayContent", "GoToSearch", "DisplayMessage", "SetRepeatMode", "ChannelUp", "ChannelDown", "PlayMediaSource", "PlayTrailers"],
            SupportsPersistentIdentifier: "cordova" === self.appMode || "android" === self.appMode,
            SupportsMediaControl: true
        };
        appHost.getPushTokenInfo();
        return capabilities = Object.assign(capabilities, appHost.getPushTokenInfo());
    },
    selectServer: function () {
        if (window.NativeShell && typeof window.NativeShell.selectServer === "function") {
            window.NativeShell.selectServer();
        } else {
            Dashboard.navigate("selectserver.html");
        }
    }
};

var AppInfo = {};

!function () {
    "use strict";

    function defineConnectionManager(connectionManager) {
        window.ConnectionManager = connectionManager;
        define("connectionManager", [], function () {
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

        events.on(connectionManager, "localusersignedout", function () {
            userSettings.setUserInfo(null, null);
        });
    }

    function createConnectionManager() {
        return require(["connectionManagerFactory", "apphost", "credentialprovider", "events", "userSettings"], function (ConnectionManager, apphost, credentialProvider, events, userSettings) {
            var credentialProviderInstance = new credentialProvider();
            var promises = [apphost.getSyncProfile(), apphost.init()];

            return Promise.all(promises).then(function (responses) {
                var deviceProfile = responses[0];
                var capabilities = Dashboard.capabilities(apphost);

                capabilities.DeviceProfile = deviceProfile;

                var connectionManager = new ConnectionManager(credentialProviderInstance, apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), capabilities, window.devicePixelRatio);

                defineConnectionManager(connectionManager);
                bindConnectionManagerEvents(connectionManager, events, userSettings);

                if (!AppInfo.isNativeApp) {
                    console.debug("loading ApiClient singleton");

                    return require(["apiclient"], function (apiClientFactory) {
                        console.debug("creating ApiClient singleton");

                        var apiClient = new apiClientFactory(Dashboard.serverAddress(), apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), window.devicePixelRatio);

                        apiClient.enableAutomaticNetworking = false;
                        apiClient.manualAddressOnly = true;

                        connectionManager.addApiClient(apiClient);

                        window.ApiClient = apiClient;
                        localApiClient = apiClient;

                        console.debug("loaded ApiClient singleton");
                    });
                }

                return Promise.resolve();
            });
        });
    }

    function returnFirstDependency(obj) {
        return obj;
    }

    function getBowerPath() {
        return "libraries";
    }

    function getComponentsPath() {
        return "components";
    }

    function getElementsPath() {
        return "elements"
    }

    function getScriptsPath() {
        return "scripts"
    }

    function getPlaybackManager(playbackManager) {
        window.addEventListener("beforeunload", function () {
            try {
                playbackManager.onAppClose();
            } catch (err) {
                console.error("error in onAppClose: " + err);
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

    function createWindowHeadroom(Headroom) {
        var headroom = new Headroom([], {});
        return headroom;
    }

    function getCastSenderApiLoader() {
        var ccLoaded = false;
        return {
            load: function () {
                if (ccLoaded) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {
                    var fileref = document.createElement("script");
                    fileref.setAttribute("type", "text/javascript");

                    fileref.onload = function () {
                        ccLoaded = true;
                        resolve();
                    };

                    fileref.setAttribute("src", "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js");
                    document.querySelector("head").appendChild(fileref);
                });
            }
        };
    }

    function getDummyCastSenderApiLoader() {
        return {
            load: function () {
                window.chrome = window.chrome || {};
                return Promise.resolve();
            }
        };
    }

    function createSharedAppFooter(appFooter) {
        return new appFooter({});
    }

    function onRequireJsError(requireType, requireModules) {
        console.error("RequireJS error: " + (requireType || "unknown") + ". Failed modules: " + (requireModules || []).join(","));
    }

    function defineResizeObserver() {
        if (self.ResizeObserver) {
            define("ResizeObserver", [], function () {
                return self.ResizeObserver;
            });
        } else {
            define("ResizeObserver", ["resize-observer-polyfill"], returnFirstDependency);
        }
    }

    function initRequireWithBrowser(browser) {
        var bowerPath = getBowerPath();
        var componentsPath = getComponentsPath();

        define("filesystem", [componentsPath + "/filesystem"], returnFirstDependency);

        if (window.IntersectionObserver && !browser.edge) {
            define("lazyLoader", [componentsPath + "/lazyloader/lazyloader-intersectionobserver"], returnFirstDependency);
        } else {
            define("lazyLoader", [componentsPath + "/lazyloader/lazyloader-scroll"], returnFirstDependency);
        }

        define("shell", [componentsPath + "/shell"], returnFirstDependency);

        define("apiclient", [bowerPath + "/apiclient/apiclient"], returnFirstDependency);

        if ("registerElement" in document) {
            define("registerElement", []);
        } else if (browser.msie) {
            define("registerElement", ["webcomponents"], returnFirstDependency);
        } else {
            define("registerElement", ["document-register-element"], returnFirstDependency);
        }

        define("imageFetcher", [componentsPath + "/images/imageFetcher"], returnFirstDependency);

        var preferNativeAlerts = browser.tv;

        define("alert", [componentsPath + "/alert"], returnFirstDependency);

        defineResizeObserver();
        define("dialog", [componentsPath + "/dialog/dialog"], returnFirstDependency);

        if (preferNativeAlerts && window.confirm) {
            define("confirm", [componentsPath + "/confirm/nativeconfirm"], returnFirstDependency);
        } else {
            define("confirm", [componentsPath + "/confirm/confirm"], returnFirstDependency);
        }

        if ((preferNativeAlerts || browser.xboxOne) && window.confirm) {
            define("prompt", [componentsPath + "/prompt/nativeprompt"], returnFirstDependency);
        } else {
            define("prompt", [componentsPath + "/prompt/prompt"], returnFirstDependency);
        }

        define("loading", [componentsPath + "/loading/loading"], returnFirstDependency);
        define("multi-download", [componentsPath + "/multidownload"], returnFirstDependency);
        define("fileDownloader", [componentsPath + "/filedownloader"], returnFirstDependency);
        define("localassetmanager", [bowerPath + "/apiclient/localassetmanager"], returnFirstDependency);

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("castSenderApiLoader", [], getDummyCastSenderApiLoader);
        } else {
            define("castSenderApiLoader", [], getCastSenderApiLoader);
        }

        define("transfermanager", [bowerPath + "/apiclient/sync/transfermanager"], returnFirstDependency);
        define("filerepository", [bowerPath + "/apiclient/sync/filerepository"], returnFirstDependency);
        define("localsync", [bowerPath + "/apiclient/sync/localsync"], returnFirstDependency);
    }

    function init() {
        define("livetvcss", ["css!assets/css/livetv.css"], returnFirstDependency);
        define("detailtablecss", ["css!assets/css/detailtable.css"], returnFirstDependency);

        var promises = [];
        if (!window.fetch) {
            promises.push(require(["fetch"]));
        }
        if ("function" != typeof Object.assign) {
            promises.push(require(["objectassign"]));
        }

        Promise.all(promises).then(function () {
            createConnectionManager().then(function () {
                console.debug("initAfterDependencies promises resolved");

                require(["globalize", "browser"], function (globalize, browser) {
                    window.Globalize = globalize;
                    loadCoreDictionary(globalize).then(function () {
                        onGlobalizeInit(browser);
                    });
                });
                require(["keyboardnavigation"], function(keyboardnavigation) {
                    keyboardnavigation.enable();
                });
                require(["mouseManager"]);
                require(["focusPreventScroll"]);
                require(["autoFocuser"], function(autoFocuser) {
                    autoFocuser.enable();
                });
            });
        });
    }

    function loadCoreDictionary(globalize) {
        var languages = ["ar", "be-by", "bg-bg", "ca", "cs", "da", "de", "el", "en-gb", "en-us", "es", "es-ar", "es-mx", "fa", "fi", "fr", "fr-ca", "gsw", "he", "hi-in", "hr", "hu", "id", "it", "kk", "ko", "lt-lt", "ms", "nb", "nl", "pl", "pt-br", "pt-pt", "ro", "ru", "sk", "sl-si", "sv", "tr", "uk", "vi", "zh-cn", "zh-hk", "zh-tw"];
        var translations = languages.map(function (language) {
            return {
                lang: language,
                path: "strings/" + language + ".json"
            };
        });
        globalize.defaultModule("core");
        return globalize.loadStrings({
            name: "core",
            translations: translations
        });
    }

    function onGlobalizeInit(browser) {
        if ("android" === self.appMode) {
            if (-1 !== self.location.href.toString().toLowerCase().indexOf("start=backgroundsync")) {
                return onAppReady(browser);
            }
        }

        document.title = Globalize.translateDocument(document.title, "core");

        if (browser.tv && !browser.android) {
            console.debug("using system fonts with explicit sizes");
            require(["systemFontsSizedCss"]);
        } else {
            console.debug("using default fonts");
            require(["systemFontsCss"]);
        }

        require(["apphost", "css!assets/css/librarybrowser"], function (appHost) {
            loadPlugins(appHost, browser).then(function () {
                onAppReady(browser);
            });
        });
    }

    function loadPlugins(appHost, browser, shell) {
        console.debug("loading installed plugins");
        var list = [
            "components/playback/playaccessvalidation",
            "components/playback/experimentalwarnings",
            "components/htmlaudioplayer/plugin",
            "components/htmlvideoplayer/plugin",
            "components/photoplayer/plugin",
            "components/youtubeplayer/plugin",
            "components/backdropscreensaver/plugin",
            "components/logoscreensaver/plugin"
        ];

        if (appHost.supports("remotecontrol")) {
            list.push("components/sessionplayer");

            if (browser.chrome || browser.opera) {
                list.push("components/chromecast/chromecastplayer");
            }
        }

        if (window.NativeShell) {
            list = list.concat(window.NativeShell.getPlugins());
        }

        return new Promise(function (resolve, reject) {
            Promise.all(list.map(loadPlugin)).then(function () {
                require(["packageManager"], function (packageManager) {
                    packageManager.init().then(resolve, reject);
                });
            }, reject);
        });
    }

    function loadPlugin(url) {
        return new Promise(function (resolve, reject) {
            require(["pluginManager"], function (pluginManager) {
                pluginManager.loadPlugin(url).then(resolve, reject);
            });
        });
    }

    function onAppReady(browser) {
        console.debug("begin onAppReady");

        // ensure that appHost is loaded in this point
        require(['apphost', 'appRouter'], function (appHost, appRouter) {
            window.Emby = {};

            console.debug("onAppReady: loading dependencies");
            if (browser.iOS) {
                require(['css!assets/css/ios.css']);
            }

            window.Emby.Page = appRouter;

            require(['emby-button', 'scripts/themeloader', 'libraryMenu', 'scripts/routes'], function () {
                Emby.Page.start({
                    click: false,
                    hashbang: true
                });

                require(["components/thememediaplayer", "scripts/autobackdrops"]);

                if (!browser.tv && !browser.xboxOne && !browser.ps4) {
                    require(["components/nowplayingbar/nowplayingbar"]);
                }

                if (appHost.supports("remotecontrol")) {
                    require(["playerSelectionMenu", "components/playback/remotecontrolautoplay"]);
                }

                require(["components/screensavermanager"]);

                if (!appHost.supports("physicalvolumecontrol") || browser.touch) {
                    require(["components/playback/volumeosd"]);
                }

                require(["mediaSession", "serverNotifications"]);

                if (!browser.tv && !browser.xboxOne) {
                    require(["components/playback/playbackorientation"]);
                    registerServiceWorker();

                    if (window.Notification) {
                        require(["components/notifications/notifications"]);
                    }
                }

                require(["playerSelectionMenu", "fullscreenManager"]);

                var apiClient = window.ConnectionManager && window.ConnectionManager.currentApiClient();
                if (apiClient) {
                    fetch(apiClient.getUrl("Branding/Css"))
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
        if (navigator.serviceWorker && "cordova" !== self.appMode && "android" !== self.appMode) {
            try {
                navigator.serviceWorker.register("serviceworker.js");
            } catch (err) {
                console.error("error registering serviceWorker: " + err);
            }
        }
    }

    function onWebComponentsReady(browser) {
        initRequireWithBrowser(browser);

        if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
            AppInfo.isNativeApp = true;
        }

        init();
    }

    var localApiClient;

    (function () {
        var urlArgs = "v=" + (window.dashboardVersion || new Date().getDate());

        var bowerPath = getBowerPath();
        var componentsPath = getComponentsPath();
        var elementsPath = getElementsPath();
        var scriptsPath = getScriptsPath();

        var paths = {
            browserdeviceprofile: "scripts/browserdeviceprofile",
            browser: "scripts/browser",
            libraryBrowser: "scripts/librarybrowser",
            inputManager: "scripts/inputManager",
            datetime: "scripts/datetime",
            globalize: "scripts/globalize",
            libraryMenu: "scripts/librarymenu",
            playlisteditor: componentsPath + "/playlisteditor/playlisteditor",
            medialibrarycreator: componentsPath + "/medialibrarycreator/medialibrarycreator",
            medialibraryeditor: componentsPath + "/medialibraryeditor/medialibraryeditor",
            imageoptionseditor: componentsPath + "/imageoptionseditor/imageoptionseditor",
            humanedate: componentsPath + "/humanedate",
            apphost: componentsPath + "/apphost",
            visibleinviewport: componentsPath + "/visibleinviewport",
            qualityoptions: componentsPath + "/qualityoptions",
            focusManager: componentsPath + "/focusManager",
            itemHelper: componentsPath + "/itemhelper",
            itemShortcuts: componentsPath + "/shortcuts",
            playQueueManager: componentsPath + "/playback/playqueuemanager",
            nowPlayingHelper: componentsPath + "/playback/nowplayinghelper",
            pluginManager: componentsPath + "/pluginManager",
            packageManager: componentsPath + "/packagemanager",
            screensaverManager: componentsPath + "/screensavermanager"
        };

        requirejs.onError = onRequireJsError;
        requirejs.config({
            waitSeconds: 0,
            map: {
                "*": {
                    css: "components/require/requirecss",
                    text: "components/require/requiretext"
                }
            },
            bundles: {
                bundle: [
                    "document-register-element",
                    "fetch",
                    "flvjs",
                    "jstree",
                    "jQuery",
                    "hlsjs",
                    "howler",
                    "native-promise-only",
                    "resize-observer-polyfill",
                    "shaka",
                    "swiper",
                    "sortable",
                    "libjass",
                    "webcomponents",
                    "material-icons",
                    "jellyfin-noto"
                ]
            },
            urlArgs: urlArgs,
            paths: paths,
            onError: onRequireJsError
        });

        // Expose jQuery globally
        require(["jQuery"], function(jQuery) {
            window.$ = jQuery;
            window.jQuery = jQuery;
        });

        require(["css!assets/css/site"]);
        require(["jellyfin-noto"]);

        // define styles
        // TODO determine which of these files can be moved to the components themselves
        define("systemFontsCss", ["css!assets/css/fonts"], returnFirstDependency);
        define("systemFontsSizedCss", ["css!assets/css/fonts.sized"], returnFirstDependency);
        define("scrollStyles", ["css!assets/css/scrollstyles"], returnFirstDependency);
        define("dashboardcss", ["css!assets/css/dashboard"], returnFirstDependency);
        define("programStyles", ["css!" + componentsPath + "/guide/programs"], returnFirstDependency);
        define("listViewStyle", ["css!" + componentsPath + "/listview/listview"], returnFirstDependency);
        define("formDialogStyle", ["css!" + componentsPath + "/formdialog"], returnFirstDependency);
        define("clearButtonStyle", ["css!assets/css/clearbutton"], returnFirstDependency);
        define("cardStyle", ["css!" + componentsPath + "/cardbuilder/card"], returnFirstDependency);
        define("flexStyles", ["css!assets/css/flexstyles"], returnFirstDependency);

        // define legacy features
        // TODO delete the rest of these
        define("fnchecked", ["legacy/fnchecked"], returnFirstDependency);
        define("legacyDashboard", ["legacy/dashboard"], returnFirstDependency);
        define("legacySelectMenu", ["legacy/selectmenu"], returnFirstDependency);

        // there are several objects that need to be instantiated
        // TODO find a better way to do this
        define("appFooter", [componentsPath + "/appfooter/appfooter"], returnFirstDependency);
        define("appFooter-shared", ["appFooter"], createSharedAppFooter);

        // TODO pull apiclient out of this repository
        define('events', [bowerPath + "/apiclient/events"], returnFirstDependency);
        define('credentialprovider', [bowerPath + "/apiclient/credentialprovider"], returnFirstDependency);
        define('connectionManagerFactory', [bowerPath + "/apiclient/connectionmanager"], returnFirstDependency);
        define('appStorage', [bowerPath + "/apiclient/appStorage"], returnFirstDependency);
        define("serversync", [bowerPath + "/apiclient/sync/serversync"], returnFirstDependency);
        define("multiserversync", [bowerPath + "/apiclient/sync/multiserversync"], returnFirstDependency);
        define("mediasync", [bowerPath + "/apiclient/sync/mediasync"], returnFirstDependency);
        define("itemrepository", [bowerPath + "/apiclient/sync/itemrepository"], returnFirstDependency);
        define("useractionrepository", [bowerPath + "/apiclient/sync/useractionrepository"], returnFirstDependency);

        // TODO remove these libraries
        // all of these have been modified so we need to fix that first
        define("page", [bowerPath + "/pagejs/page"], returnFirstDependency);
        define("headroom", [componentsPath + "/headroom/headroom"], returnFirstDependency);
        define("scroller", [componentsPath + "/scroller"], returnFirstDependency);
        define("navdrawer", [componentsPath + "/navdrawer/navdrawer"], returnFirstDependency);
        define("queryString", [bowerPath + "/query-string/index"], function () {
            return queryString;
        });

        define("emby-button", [elementsPath + "/emby-button/emby-button"], returnFirstDependency);
        define("paper-icon-button-light", [elementsPath + "/emby-button/paper-icon-button-light"], returnFirstDependency);
        define("emby-checkbox", [elementsPath + "/emby-checkbox/emby-checkbox"], returnFirstDependency);
        define("emby-collapse", [elementsPath + "/emby-collapse/emby-collapse"], returnFirstDependency);
        define("emby-input", [elementsPath + "/emby-input/emby-input"], returnFirstDependency);
        define("emby-progressring", [elementsPath + "/emby-progressring/emby-progressring"], returnFirstDependency);
        define("emby-radio", [elementsPath + "/emby-radio/emby-radio"], returnFirstDependency);
        define("emby-select", [elementsPath + "/emby-select/emby-select"], returnFirstDependency);
        define("emby-slider", [elementsPath + "/emby-slider/emby-slider"], returnFirstDependency);
        define("emby-textarea", [elementsPath + "/emby-textarea/emby-textarea"], returnFirstDependency);
        define("emby-toggle", [elementsPath + "/emby-toggle/emby-toggle"], returnFirstDependency);

        define("appSettings", [scriptsPath + "/settings/appSettings"], returnFirstDependency);
        define("userSettingsBuilder", [scriptsPath + "/settings/userSettingsBuilder"], returnFirstDependency);
        define("userSettings", ["userSettingsBuilder"], function(userSettingsBuilder) {
            return new userSettingsBuilder();
        });

        define("chromecastHelper", [componentsPath + "/chromecast/chromecasthelpers"], returnFirstDependency);
        define("mediaSession", [componentsPath + "/playback/mediasession"], returnFirstDependency);
        define("actionsheet", [componentsPath + "/actionsheet/actionsheet"], returnFirstDependency);
        define("tunerPicker", [componentsPath + "/tunerpicker"], returnFirstDependency);
        define("mainTabsManager", [componentsPath + "/maintabsmanager"], returnFirstDependency);
        define("imageLoader", [componentsPath + "/images/imageLoader"], returnFirstDependency);
        define("directorybrowser", [componentsPath + "/directorybrowser/directorybrowser"], returnFirstDependency);
        define("metadataEditor", [componentsPath + "/metadataeditor/metadataeditor"], returnFirstDependency);
        define("personEditor", [componentsPath + "/metadataeditor/personeditor"], returnFirstDependency);
        define("playerSelectionMenu", [componentsPath + "/playback/playerSelectionMenu"], returnFirstDependency);
        define("playerSettingsMenu", [componentsPath + "/playback/playersettingsmenu"], returnFirstDependency);
        define("playMethodHelper", [componentsPath + "/playback/playmethodhelper"], returnFirstDependency);
        define("brightnessOsd", [componentsPath + "/playback/brightnessosd"], returnFirstDependency);
        define("emby-itemscontainer", [componentsPath + "/emby-itemscontainer/emby-itemscontainer"], returnFirstDependency);
        define("alphaNumericShortcuts", [componentsPath + "/alphanumericshortcuts/alphanumericshortcuts"], returnFirstDependency);
        define("emby-scroller", [componentsPath + "/emby-scroller/emby-scroller"], returnFirstDependency);
        define("emby-tabs", [componentsPath + "/emby-tabs/emby-tabs"], returnFirstDependency);
        define("emby-scrollbuttons", [componentsPath + "/emby-scrollbuttons/emby-scrollbuttons"], returnFirstDependency);
        define("emby-itemrefreshindicator", [componentsPath + "/emby-itemrefreshindicator/emby-itemrefreshindicator"], returnFirstDependency);
        define("multiSelect", [componentsPath + "/multiselect/multiselect"], returnFirstDependency);
        define("alphaPicker", [componentsPath + "/alphapicker/alphapicker"], returnFirstDependency);
        define("tabbedView", [componentsPath + "/tabbedview/tabbedview"], returnFirstDependency);
        define("itemsTab", [componentsPath + "/tabbedview/itemstab"], returnFirstDependency);
        define("collectionEditor", [componentsPath + "/collectioneditor/collectioneditor"], returnFirstDependency);
        define("serverRestartDialog", [componentsPath + "/serverRestartDialog"], returnFirstDependency);
        define("playlistEditor", [componentsPath + "/playlisteditor/playlisteditor"], returnFirstDependency);
        define("recordingCreator", [componentsPath + "/recordingcreator/recordingcreator"], returnFirstDependency);
        define("recordingEditor", [componentsPath + "/recordingcreator/recordingeditor"], returnFirstDependency);
        define("seriesRecordingEditor", [componentsPath + "/recordingcreator/seriesrecordingeditor"], returnFirstDependency);
        define("recordingFields", [componentsPath + "/recordingcreator/recordingfields"], returnFirstDependency);
        define("recordingButton", [componentsPath + "/recordingcreator/recordingbutton"], returnFirstDependency);
        define("recordingHelper", [componentsPath + "/recordingcreator/recordinghelper"], returnFirstDependency);
        define("subtitleEditor", [componentsPath + "/subtitleeditor/subtitleeditor"], returnFirstDependency);
        define("subtitleSync", [componentsPath + "/subtitlesync/subtitlesync"], returnFirstDependency);
        define("itemIdentifier", [componentsPath + "/itemidentifier/itemidentifier"], returnFirstDependency);
        define("itemMediaInfo", [componentsPath + "/itemMediaInfo/itemMediaInfo"], returnFirstDependency);
        define("mediaInfo", [componentsPath + "/mediainfo/mediainfo"], returnFirstDependency);
        define("itemContextMenu", [componentsPath + "/itemcontextmenu"], returnFirstDependency);
        define("imageEditor", [componentsPath + "/imageeditor/imageeditor"], returnFirstDependency);
        define("imageDownloader", [componentsPath + "/imagedownloader/imagedownloader"], returnFirstDependency);
        define("dom", [componentsPath + "/dom"], returnFirstDependency);
        define("playerStats", [componentsPath + "/playerstats/playerstats"], returnFirstDependency);
        define("searchFields", [componentsPath + "/search/searchfields"], returnFirstDependency);
        define("searchResults", [componentsPath + "/search/searchresults"], returnFirstDependency);
        define("upNextDialog", [componentsPath + "/upnextdialog/upnextdialog"], returnFirstDependency);
        define("fullscreen-doubleclick", [componentsPath + "/fullscreen/fullscreen-dc"], returnFirstDependency);
        define("fullscreenManager", [componentsPath + "/fullscreenManager", "events"], returnFirstDependency);
        define("subtitleAppearanceHelper", [componentsPath + "/subtitlesettings/subtitleappearancehelper"], returnFirstDependency);
        define("subtitleSettings", [componentsPath + "/subtitlesettings/subtitlesettings"], returnFirstDependency);
        define("displaySettings", [componentsPath + "/displaysettings/displaysettings"], returnFirstDependency);
        define("playbackSettings", [componentsPath + "/playbacksettings/playbacksettings"], returnFirstDependency);
        define("homescreenSettings", [componentsPath + "/homescreensettings/homescreensettings"], returnFirstDependency);
        define("playbackManager", [componentsPath + "/playback/playbackmanager"], getPlaybackManager);
        define("layoutManager", [componentsPath + "/layoutManager", "apphost"], getLayoutManager);
        define("homeSections", [componentsPath + "/homesections/homesections"], returnFirstDependency);
        define("playMenu", [componentsPath + "/playmenu"], returnFirstDependency);
        define("refreshDialog", [componentsPath + "/refreshdialog/refreshdialog"], returnFirstDependency);
        define("backdrop", [componentsPath + "/backdrop/backdrop"], returnFirstDependency);
        define("fetchHelper", [componentsPath + "/fetchhelper"], returnFirstDependency);
        define("cardBuilder", [componentsPath + "/cardbuilder/cardBuilder"], returnFirstDependency);
        define("peoplecardbuilder", [componentsPath + "/cardbuilder/peoplecardbuilder"], returnFirstDependency);
        define("chaptercardbuilder", [componentsPath + "/cardbuilder/chaptercardbuilder"], returnFirstDependency);
        define("deleteHelper", [componentsPath + "/deletehelper"], returnFirstDependency);
        define("tvguide", [componentsPath + "/guide/guide"], returnFirstDependency);
        define("guide-settings-dialog", [componentsPath + "/guide/guide-settings"], returnFirstDependency);
        define("loadingDialog", [componentsPath + "/loadingdialog/loadingdialog"], returnFirstDependency);
        define("viewManager", [componentsPath + "/viewManager/viewManager"], function (viewManager) {
            window.ViewManager = viewManager;
            viewManager.dispatchPageEvents(true);
            return viewManager;
        });
        define("slideshow", [componentsPath + "/slideshow/slideshow"], returnFirstDependency);
        define("objectassign", [componentsPath + "/polyfills/objectassign"], returnFirstDependency);
        define("focusPreventScroll", [componentsPath + "/polyfills/focusPreventScroll"], returnFirstDependency);
        define("userdataButtons", [componentsPath + "/userdatabuttons/userdatabuttons"], returnFirstDependency);
        define("emby-playstatebutton", [componentsPath + "/userdatabuttons/emby-playstatebutton"], returnFirstDependency);
        define("emby-ratingbutton", [componentsPath + "/userdatabuttons/emby-ratingbutton"], returnFirstDependency);
        define("listView", [componentsPath + "/listview/listview"], returnFirstDependency);
        define("indicators", [componentsPath + "/indicators/indicators"], returnFirstDependency);
        define("viewSettings", [componentsPath + "/viewsettings/viewsettings"], returnFirstDependency);
        define("filterMenu", [componentsPath + "/filtermenu/filtermenu"], returnFirstDependency);
        define("sortMenu", [componentsPath + "/sortmenu/sortmenu"], returnFirstDependency);
        define("idb", [componentsPath + "/idb"], returnFirstDependency);
        define("sanitizefilename", [componentsPath + "/sanitizefilename"], returnFirstDependency);
        define("toast", [componentsPath + "/toast/toast"], returnFirstDependency);
        define("scrollHelper", [componentsPath + "/scrollhelper"], returnFirstDependency);
        define("touchHelper", [componentsPath + "/touchhelper"], returnFirstDependency);
        define("imageUploader", [componentsPath + "/imageuploader/imageuploader"], returnFirstDependency);
        define("htmlMediaHelper", [componentsPath + "/htmlMediaHelper"], returnFirstDependency);
        define("viewContainer", [componentsPath + "/viewContainer"], returnFirstDependency);
        define("dialogHelper", [componentsPath + "/dialogHelper/dialogHelper"], returnFirstDependency);
        define("serverNotifications", [componentsPath + "/serverNotifications"], returnFirstDependency);
        define("skinManager", [componentsPath + "/skinManager"], returnFirstDependency);
        define("keyboardnavigation", [componentsPath + "/input/keyboardnavigation"], returnFirstDependency);
        define("mouseManager", [componentsPath + "/input/mouseManager"], returnFirstDependency);
        define("scrollManager", [componentsPath + "/scrollManager"], returnFirstDependency);
        define("autoFocuser", [componentsPath + "/autoFocuser"], returnFirstDependency);
        define("connectionManager", [], function () {
            return ConnectionManager;
        });
        define("apiClientResolver", [], function () {
            return function () {
                return window.ApiClient;
            };
        });
        define("appRouter", [componentsPath + "/appRouter", "itemHelper"], function (appRouter, itemHelper) {
            function showItem(item, serverId, options) {
                if ("string" == typeof item) {
                    require(["connectionManager"], function (connectionManager) {
                        var apiClient = connectionManager.currentApiClient();
                        apiClient.getItem(apiClient.getCurrentUserId(), item).then(function (item) {
                            appRouter.showItem(item, options);
                        });
                    });
                } else {
                    if (2 == arguments.length) {
                        options = arguments[1];
                    }

                    appRouter.show("/" + appRouter.getRouteUrl(item, options), {
                        item: item
                    });
                }
            }

            appRouter.showLocalLogin = function (serverId, manualLogin) {
                Dashboard.navigate("login.html?serverid=" + serverId);
            };

            appRouter.showVideoOsd = function () {
                return Dashboard.navigate("videoosd.html");
            };

            appRouter.showSelectServer = function () {
                Dashboard.navigate(AppInfo.isNativeApp ? "selectserver.html" : "login.html");
            };

            appRouter.showWelcome = function () {
                Dashboard.navigate(AppInfo.isNativeApp ? "selectserver.html" : "login.html");
            };

            appRouter.showSettings = function () {
                Dashboard.navigate("mypreferencesmenu.html");
            };

            appRouter.showGuide = function () {
                Dashboard.navigate("livetv.html?tab=1");
            };

            appRouter.goHome = function () {
                Dashboard.navigate("home.html");
            };

            appRouter.showSearch = function () {
                Dashboard.navigate("search.html");
            };

            appRouter.showLiveTV = function () {
                Dashboard.navigate("livetv.html");
            };

            appRouter.showRecordedTV = function () {
                Dashboard.navigate("livetv.html?tab=3");
            };

            appRouter.showFavorites = function () {
                Dashboard.navigate("home.html?tab=1");
            };

            appRouter.showSettings = function () {
                Dashboard.navigate("mypreferencesmenu.html");
            };

            appRouter.setTitle = function (title) {
                LibraryMenu.setTitle(title);
            };

            appRouter.getRouteUrl = function (item, options) {
                if (!item) {
                    throw new Error("item cannot be null");
                }

                if (item.url) {
                    return item.url;
                }

                var context = options ? options.context : null;
                var id = item.Id || item.ItemId;

                if (!options) {
                    options = {};
                }

                var url;
                var itemType = item.Type || (options ? options.itemType : null);
                var serverId = item.ServerId || options.serverId;

                if ("settings" === item) {
                    return "mypreferencesmenu.html";
                }

                if ("wizard" === item) {
                    return "wizardstart.html";
                }

                if ("manageserver" === item) {
                    return "dashboard.html";
                }

                if ("recordedtv" === item) {
                    return "livetv.html?tab=3&serverId=" + options.serverId;
                }

                if ("nextup" === item) {
                    return "list.html?type=nextup&serverId=" + options.serverId;
                }

                if ("list" === item) {
                    var url = "list.html?serverId=" + options.serverId + "&type=" + options.itemTypes;

                    if (options.isFavorite) {
                        url += "&IsFavorite=true";
                    }

                    return url;
                }

                if ("livetv" === item) {
                    if ("programs" === options.section) {
                        return "livetv.html?tab=0&serverId=" + options.serverId;
                    }
                    if ("guide" === options.section) {
                        return "livetv.html?tab=1&serverId=" + options.serverId;
                    }

                    if ("movies" === options.section) {
                        return "list.html?type=Programs&IsMovie=true&serverId=" + options.serverId;
                    }

                    if ("shows" === options.section) {
                        return "list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=" + options.serverId;
                    }

                    if ("sports" === options.section) {
                        return "list.html?type=Programs&IsSports=true&serverId=" + options.serverId;
                    }

                    if ("kids" === options.section) {
                        return "list.html?type=Programs&IsKids=true&serverId=" + options.serverId;
                    }

                    if ("news" === options.section) {
                        return "list.html?type=Programs&IsNews=true&serverId=" + options.serverId;
                    }

                    if ("onnow" === options.section) {
                        return "list.html?type=Programs&IsAiring=true&serverId=" + options.serverId;
                    }

                    if ("dvrschedule" === options.section) {
                        return "livetv.html?tab=4&serverId=" + options.serverId;
                    }

                    if ("seriesrecording" === options.section) {
                        return "livetv.html?tab=5&serverId=" + options.serverId;
                    }

                    return "livetv.html?serverId=" + options.serverId;
                }

                if ("SeriesTimer" == itemType) {
                    return "itemdetails.html?seriesTimerId=" + id + "&serverId=" + serverId;
                }

                if ("livetv" == item.CollectionType) {
                    return "livetv.html";
                }

                if ("Genre" === item.Type) {
                    url = "list.html?genreId=" + item.Id + "&serverId=" + serverId;

                    if ("livetv" === context) {
                        url += "&type=Programs";
                    }

                    if (options.parentId) {
                        url += "&parentId=" + options.parentId;
                    }

                    return url;
                }

                if ("MusicGenre" === item.Type) {
                    url = "list.html?musicGenreId=" + item.Id + "&serverId=" + serverId;

                    if (options.parentId) {
                        url += "&parentId=" + options.parentId;
                    }

                    return url;
                }

                if ("Studio" === item.Type) {
                    url = "list.html?studioId=" + item.Id + "&serverId=" + serverId;

                    if (options.parentId) {
                        url += "&parentId=" + options.parentId;
                    }

                    return url;
                }

                if ("folders" !== context && !itemHelper.isLocalItem(item)) {
                    if ("movies" == item.CollectionType) {
                        url = "movies.html?topParentId=" + item.Id;

                        if (options && "latest" === options.section) {
                            url += "&tab=1";
                        }

                        return url;
                    }

                    if ("tvshows" == item.CollectionType) {
                        url = "tv.html?topParentId=" + item.Id;

                        if (options && "latest" === options.section) {
                            url += "&tab=2";
                        }

                        return url;
                    }

                    if ("music" == item.CollectionType) {
                        return "music.html?topParentId=" + item.Id;
                    }
                }

                var itemTypes = ["Playlist", "TvChannel", "Program", "BoxSet", "MusicAlbum", "MusicGenre", "Person", "Recording", "MusicArtist"];

                if (itemTypes.indexOf(itemType) >= 0) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                var contextSuffix = context ? "&context=" + context : "";

                if ("Series" == itemType || "Season" == itemType || "Episode" == itemType) {
                    return "itemdetails.html?id=" + id + contextSuffix + "&serverId=" + serverId;
                }

                if (item.IsFolder) {
                    if (id) {
                        return "list.html?parentId=" + id + "&serverId=" + serverId;
                    }

                    return "#";
                }

                return "itemdetails.html?id=" + id + "&serverId=" + serverId;
            };

            appRouter.showItem = showItem;
            return appRouter;
        });
    })();

    return require(["browser"], onWebComponentsReady);
}();

pageClassOn("viewshow", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.add("noHeaderRight");
});

pageClassOn("viewhide", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.remove("noHeaderRight");
});
