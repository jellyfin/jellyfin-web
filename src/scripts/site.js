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
        var caps = {
            PlayableMediaTypes: ["Audio", "Video"],
            SupportedCommands: ["MoveUp", "MoveDown", "MoveLeft", "MoveRight", "PageUp", "PageDown", "PreviousLetter", "NextLetter", "ToggleOsd", "ToggleContextMenu", "Select", "Back", "SendKey", "SendString", "GoHome", "GoToSettings", "VolumeUp", "VolumeDown", "Mute", "Unmute", "ToggleMute", "SetVolume", "SetAudioStreamIndex", "SetSubtitleStreamIndex", "DisplayContent", "GoToSearch", "DisplayMessage", "SetRepeatMode", "ChannelUp", "ChannelDown", "PlayMediaSource", "PlayTrailers"],
            SupportsPersistentIdentifier: "cordova" === self.appMode || "android" === self.appMode,
            SupportsMediaControl: true
        };
        caps.IconUrl = appHost.deviceIconUrl();
        caps.SupportsSync = appHost.supports("sync");
        caps.SupportsContentUploading = appHost.supports("cameraupload");
        appHost.getPushTokenInfo();
        return caps = Object.assign(caps, appHost.getPushTokenInfo());
    }
};
var AppInfo = {};
!function () {
    "use strict";

    function onApiClientCreated(e, newApiClient) {
        if (window.$) {
            $.ajax = newApiClient.ajax;
        }
    }

    function defineConnectionManager(connectionManager) {
        window.ConnectionManager = connectionManager;
        define("connectionManager", [], function () {
            return connectionManager;
        });
    }

    function bindConnectionManagerEvents(connectionManager, events, userSettings) {
        window.Events = events;
        events.on(ConnectionManager, "apiclientcreated", onApiClientCreated);

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
                    console.log("loading ApiClient singleton");

                    return require(["apiclient"], function (apiClientFactory) {
                        console.log("creating ApiClient singleton");

                        var apiClient = new apiClientFactory(Dashboard.serverAddress(), apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), window.devicePixelRatio);

                        apiClient.enableAutomaticNetworking = false;
                        apiClient.manualAddressOnly = true;

                        connectionManager.addApiClient(apiClient);

                        window.ApiClient = apiClient;
                        localApiClient   = apiClient;

                        console.log("loaded ApiClient singleton");
                    });
                }

                return Promise.resolve();
            });
        });
    }

    function returnFirstDependency(obj) {
        return obj;
    }

    function getSettingsBuilder(UserSettings, layoutManager, browser) {
        return UserSettings;
    }

    function getBowerPath() {
        return "bower_components";
    }

    function getPlaybackManager(playbackManager) {
        window.addEventListener("beforeunload", function () {
            try {
                playbackManager.onAppClose();
            } catch (err) {
                console.log("error in onAppClose: " + err);
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
        console.log("RequireJS error: " + (requireType || "unknown") + ". Failed modules: " + (requireModules || []).join(","));
    }

    function defineResizeObserver() {
        if (self.ResizeObserver) {
            define("ResizeObserver", [], function () {
                return self.ResizeObserver;
            });
        } else {
            define("ResizeObserver", ["thirdparty/resize-observer-polyfill/ResizeObserver"], returnFirstDependency);
        }
    }

    function initRequireWithBrowser(browser) {
        var bowerPath = getBowerPath();
        var apiClientBowerPath = bowerPath + "/apiclient";
        var componentsPath = "components";

        define("filesystem", [componentsPath + "/filesystem"], returnFirstDependency);

        if (window.IntersectionObserver && !browser.edge) {
            define("lazyLoader", [componentsPath + "/lazyloader/lazyloader-intersectionobserver"], returnFirstDependency);
        } else {
            define("lazyLoader", [componentsPath + "/lazyloader/lazyloader-scroll"], returnFirstDependency);
        }

        define("shell", [componentsPath + "/shell"], returnFirstDependency);

        define("apiclient", ["bower_components/apiclient/apiclient"], returnFirstDependency);

        if ("registerElement" in document) {
            define("registerElement", []);
        } else if (browser.msie) {
            define("registerElement", [bowerPath + "/webcomponentsjs/webcomponents-lite.min.js"], returnFirstDependency);
        } else {
            define("registerElement", [bowerPath + "/document-register-element/build/document-register-element"], returnFirstDependency);
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
        define("localassetmanager", [apiClientBowerPath + "/localassetmanager"], returnFirstDependency);

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("castSenderApiLoader", [], getDummyCastSenderApiLoader);
        } else {
            define("castSenderApiLoader", [], getCastSenderApiLoader);
        }

        define("transfermanager", [apiClientBowerPath + "/sync/transfermanager"], returnFirstDependency);
        define("filerepository", [apiClientBowerPath + "/sync/filerepository"], returnFirstDependency);
        define("localsync", [apiClientBowerPath + "/sync/localsync"], returnFirstDependency);
    }

    function init() {
        define("livetvcss", ["css!css/livetv.css"], returnFirstDependency);
        define("detailtablecss", ["css!css/detailtable.css"], returnFirstDependency);
        define("buttonenabled", ["legacy/buttonenabled"], returnFirstDependency);
        var promises = [];

        if (!window.fetch) {
            promises.push(require(["fetch"]));
        }
        if ("function" != typeof Object.assign) {
            promises.push(require(["objectassign"]));
        }

        Promise.all(promises).then(function () {
            createConnectionManager().then(function () {
                console.log("initAfterDependencies promises resolved");

                require(["globalize", "browser"], function (globalize, browser) {
                    window.Globalize = globalize;
                    loadCoreDictionary(globalize).then(function () {
                        onGlobalizeInit(browser);
                    });
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
            console.log("Using system fonts with explicit sizes");
            require(["systemFontsSizedCss"]);
        } else {
            console.log("Using default fonts");
            require(["systemFontsCss"]);
        }

        require(["apphost", "css!css/librarybrowser"], function (appHost) {
            loadPlugins([], appHost, browser).then(function () {
                onAppReady(browser);
            });
        });
    }

    function loadPlugins(externalPlugins, appHost, browser, shell) {
        console.log("Loading installed plugins");
        var list = [
            "components/playback/playaccessvalidation",
            "components/playback/experimentalwarnings",
            "components/htmlaudioplayer/plugin",
            "components/htmlvideoplayer/plugin",
            "components/photoplayer/plugin",
            "components/youtubeplayer/plugin"
        ];

        if (appHost.supports("remotecontrol")) {
            list.push("components/sessionplayer");

            if (browser.chrome || browser.opera) {
                list.push("components/chromecast/chromecastplayer");
            }
        }

        for (var index = 0, length = externalPlugins.length; index < length; index++) {
            list.push(externalPlugins[index]);
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
        console.log("Begin onAppReady");

        // ensure that appHost is loaded in this point
        require(['apphost', 'appRouter'], function (appHost, appRouter) {
            var isInBackground = -1 !== self.location.href.toString().toLowerCase().indexOf("start=backgroundsync");

            window.Emby = {};

            console.log("onAppReady - loading dependencies");

            if (isInBackground) {
                syncNow();
            } else {

                if (browser.iOS) {
                    require(['css!css/ios.css']);
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

                    if (appHost.supports("sync")) {
                        initLocalSyncEvents();
                    }

                    if (!AppInfo.isNativeApp && window.ApiClient) {
                        require(["css!" + ApiClient.getUrl("Branding/Css")]);
                    }
                });
            }
        });
    }

    function registerServiceWorker() {
        if (navigator.serviceWorker && "cordova" !== self.appMode && "android" !== self.appMode) {
            try {
                navigator.serviceWorker.register("serviceworker.js");
            } catch (err) {
                console.log("Error registering serviceWorker: " + err);
            }
        }
    }

    function syncNow() {
        require(["localsync"], function (localSync) {
            localSync.sync();
        });
    }

    function initLocalSyncEvents() {
        require(["serverNotifications", "events"], function (serverNotifications, events) {
            events.on(serverNotifications, "SyncJobItemReady", syncNow);
            events.on(serverNotifications, "SyncJobCancelled", syncNow);
            events.on(serverNotifications, "SyncJobItemCancelled", syncNow);
        });
    }

    function onWebComponentsReady(browser) {
        initRequireWithBrowser(browser);

        if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
            AppInfo.isNativeApp = true;
        }

        if (!window.Promise || browser.web0s) {
            require(["thirdparty/native-promise-only/lib/npo.src"], init);
        } else {
            init();
        }
    }

    var localApiClient;

    (function () {
        var urlArgs = "v=" + (window.dashboardVersion || new Date().getDate());
        var bowerPath = getBowerPath();
        var apiClientBowerPath = bowerPath + "/apiclient";
        var componentsPath = "components";
        var paths = {
            velocity: bowerPath + "/velocity/velocity.min",
            vibrant: bowerPath + "/vibrant/dist/vibrant",
            staticBackdrops: componentsPath + "/staticbackdrops",
            ironCardList: "components/ironcardlist/ironcardlist",
            scrollThreshold: "components/scrollthreshold",
            playlisteditor: "components/playlisteditor/playlisteditor",
            medialibrarycreator: "components/medialibrarycreator/medialibrarycreator",
            medialibraryeditor: "components/medialibraryeditor/medialibraryeditor",
            imageoptionseditor: "components/imageoptionseditor/imageoptionseditor",
            howler: bowerPath + "/howlerjs/dist/howler.min",
            sortable: bowerPath + "/Sortable/Sortable.min",
            isMobile: bowerPath + "/isMobile/isMobile.min",
            masonry: bowerPath + "/masonry/dist/masonry.pkgd.min",
            humanedate: "components/humanedate",
            libraryBrowser: "scripts/librarybrowser",
            events: apiClientBowerPath + "/events",
            credentialprovider: apiClientBowerPath + "/credentials",
            connectionManagerFactory: bowerPath + "/apiclient/connectionmanager",
            visibleinviewport: componentsPath + "/visibleinviewport",
            browserdeviceprofile: componentsPath + "/browserdeviceprofile",
            browser: componentsPath + "/browser",
            inputManager: componentsPath + "/inputmanager",
            qualityoptions: componentsPath + "/qualityoptions",
            hammer: bowerPath + "/hammerjs/hammer.min",
            page: "thirdparty/page",
            focusManager: componentsPath + "/focusmanager",
            datetime: componentsPath + "/datetime",
            globalize: componentsPath + "/globalize",
            itemHelper: componentsPath + "/itemhelper",
            itemShortcuts: componentsPath + "/shortcuts",
            playQueueManager: componentsPath + "/playback/playqueuemanager",
            autoPlayDetect: componentsPath + "/playback/autoplaydetect",
            nowPlayingHelper: componentsPath + "/playback/nowplayinghelper",
            pluginManager: componentsPath + "/pluginmanager",
            packageManager: componentsPath + "/packagemanager"
        };
        paths.hlsjs = bowerPath + "/hlsjs/dist/hls.min";
        paths.flvjs = "thirdparty/flvjs/flv.min";
        paths.shaka = "thirdparty/shaka/shaka-player.compiled";
        define("chromecastHelper", [componentsPath + "/chromecast/chromecasthelpers"], returnFirstDependency);
        define("mediaSession", [componentsPath + "/playback/mediasession"], returnFirstDependency);
        define("actionsheet", [componentsPath + "/actionsheet/actionsheet"], returnFirstDependency);
        define("libjass", [bowerPath + "/libjass/libjass.min", "css!" + bowerPath + "/libjass/libjass"], returnFirstDependency);
        define("tunerPicker", ["components/tunerpicker"], returnFirstDependency);
        define("mainTabsManager", [componentsPath + "/maintabsmanager"], returnFirstDependency);
        define("imageLoader", [componentsPath + "/images/imageLoader"], returnFirstDependency);
        define("appFooter", [componentsPath + "/appfooter/appfooter"], returnFirstDependency);
        define("directorybrowser", ["components/directorybrowser/directorybrowser"], returnFirstDependency);
        define("metadataEditor", [componentsPath + "/metadataeditor/metadataeditor"], returnFirstDependency);
        define("personEditor", [componentsPath + "/metadataeditor/personeditor"], returnFirstDependency);
        define("playerSelectionMenu", [componentsPath + "/playback/playerSelectionMenu"], returnFirstDependency);
        define("playerSettingsMenu", [componentsPath + "/playback/playersettingsmenu"], returnFirstDependency);
        define("playMethodHelper", [componentsPath + "/playback/playmethodhelper"], returnFirstDependency);
        define("brightnessOsd", [componentsPath + "/playback/brightnessosd"], returnFirstDependency);
        define("libraryMenu", ["scripts/librarymenu"], returnFirstDependency);
        define("emby-collapse", [componentsPath + "/emby-collapse/emby-collapse"], returnFirstDependency);
        define("emby-button", [componentsPath + "/emby-button/emby-button"], returnFirstDependency);
        define("emby-itemscontainer", [componentsPath + "/emby-itemscontainer/emby-itemscontainer"], returnFirstDependency);
        define("alphaNumericShortcuts", [componentsPath + "/alphanumericshortcuts/alphanumericshortcuts"], returnFirstDependency);
        define("emby-scroller", [componentsPath + "/emby-scroller/emby-scroller"], returnFirstDependency);
        define("emby-tabs", [componentsPath + "/emby-tabs/emby-tabs"], returnFirstDependency);
        define("emby-scrollbuttons", [componentsPath + "/emby-scrollbuttons/emby-scrollbuttons"], returnFirstDependency);
        define("emby-progressring", [componentsPath + "/emby-progressring/emby-progressring"], returnFirstDependency);
        define("emby-itemrefreshindicator", [componentsPath + "/emby-itemrefreshindicator/emby-itemrefreshindicator"], returnFirstDependency);
        define("multiSelect", [componentsPath + "/multiselect/multiselect"], returnFirstDependency);
        define("alphaPicker", [componentsPath + "/alphapicker/alphapicker"], returnFirstDependency);
        define("paper-icon-button-light", [componentsPath + "/emby-button/paper-icon-button-light"], returnFirstDependency);
        define("tabbedView", [componentsPath + "/tabbedview/tabbedview"], returnFirstDependency);
        define("itemsTab", [componentsPath + "/tabbedview/itemstab"], returnFirstDependency);
        define("emby-input", [componentsPath + "/emby-input/emby-input"], returnFirstDependency);
        define("emby-select", [componentsPath + "/emby-select/emby-select"], returnFirstDependency);
        define("emby-slider", [componentsPath + "/emby-slider/emby-slider"], returnFirstDependency);
        define("emby-checkbox", [componentsPath + "/emby-checkbox/emby-checkbox"], returnFirstDependency);
        define("emby-toggle", [componentsPath + "/emby-toggle/emby-toggle"], returnFirstDependency);
        define("emby-radio", [componentsPath + "/emby-radio/emby-radio"], returnFirstDependency);
        define("emby-textarea", [componentsPath + "/emby-textarea/emby-textarea"], returnFirstDependency);
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
        define("itemIdentifier", [componentsPath + "/itemidentifier/itemidentifier"], returnFirstDependency);
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
        define("headroom", [componentsPath + "/headroom/headroom"], returnFirstDependency);
        define("subtitleAppearanceHelper", [componentsPath + "/subtitlesettings/subtitleappearancehelper"], returnFirstDependency);
        define("subtitleSettings", [componentsPath + "/subtitlesettings/subtitlesettings"], returnFirstDependency);
        define("displaySettings", [componentsPath + "/displaysettings/displaysettings"], returnFirstDependency);
        define("playbackSettings", [componentsPath + "/playbacksettings/playbacksettings"], returnFirstDependency);
        define("homescreenSettings", [componentsPath + "/homescreensettings/homescreensettings"], returnFirstDependency);
        define("homescreenSettingsDialog", [componentsPath + "/homescreensettings/homescreensettingsdialog"], returnFirstDependency);
        define("playbackManager", [componentsPath + "/playback/playbackmanager"], getPlaybackManager);
        define("layoutManager", [componentsPath + "/layoutmanager", "apphost"], getLayoutManager);
        define("homeSections", [componentsPath + "/homesections/homesections"], returnFirstDependency);
        define("playMenu", [componentsPath + "/playmenu"], returnFirstDependency);
        define("refreshDialog", [componentsPath + "/refreshdialog/refreshdialog"], returnFirstDependency);
        define("backdrop", [componentsPath + "/backdrop/backdrop"], returnFirstDependency);
        define("fetchHelper", [componentsPath + "/fetchhelper"], returnFirstDependency);
        define("roundCardStyle", ["cardStyle", "css!" + componentsPath + "/cardbuilder/roundcard"], returnFirstDependency);
        define("cardStyle", ["css!" + componentsPath + "/cardbuilder/card"], returnFirstDependency);
        define("cardBuilder", [componentsPath + "/cardbuilder/cardbuilder"], returnFirstDependency);
        define("peoplecardbuilder", [componentsPath + "/cardbuilder/peoplecardbuilder"], returnFirstDependency);
        define("chaptercardbuilder", [componentsPath + "/cardbuilder/chaptercardbuilder"], returnFirstDependency);
        define("flexStyles", ["css!" + componentsPath + "/flexstyles"], returnFirstDependency);
        define("deleteHelper", [componentsPath + "/deletehelper"], returnFirstDependency);
        define("tvguide", [componentsPath + "/guide/guide"], returnFirstDependency);
        define("programStyles", ["css!" + componentsPath + "/guide/programs"], returnFirstDependency);
        define("guide-settings-dialog", [componentsPath + "/guide/guide-settings"], returnFirstDependency);
        define("loadingDialog", [componentsPath + "/loadingdialog/loadingdialog"], returnFirstDependency);
        define("viewManager", [componentsPath + "/viewManager/viewManager"], function (viewManager) {
            window.ViewManager = viewManager;
            viewManager.dispatchPageEvents(true);
            return viewManager;
        });

        paths.apphost = "components/apphost";
        define('appStorage', [apiClientBowerPath + '/appStorage'], returnFirstDependency);

        requirejs.config({
            waitSeconds: 0,
            map: {
                "*": {
                    css: "components/require/requirecss",
                    text: "components/require/requiretext"
                }
            },
            urlArgs: urlArgs,
            paths: paths,
            onError: onRequireJsError
        });
        requirejs.onError = onRequireJsError;
        define("jstree", ["thirdparty/jstree/jstree", "css!thirdparty/jstree/themes/default/style.css"], returnFirstDependency);
        define("dashboardcss", ["css!css/dashboard"], returnFirstDependency);
        define("slideshow", [componentsPath + "/slideshow/slideshow"], returnFirstDependency);
        define("fetch", [bowerPath + "/fetch/fetch"], returnFirstDependency);
        define("objectassign", [componentsPath + "/polyfills/objectassign"], returnFirstDependency);
        define("clearButtonStyle", ["css!" + componentsPath + "/clearbutton"], returnFirstDependency);
        define("userdataButtons", [componentsPath + "/userdatabuttons/userdatabuttons"], returnFirstDependency);
        define("emby-playstatebutton", [componentsPath + "/userdatabuttons/emby-playstatebutton"], returnFirstDependency);
        define("emby-ratingbutton", [componentsPath + "/userdatabuttons/emby-ratingbutton"], returnFirstDependency);
        define("listView", [componentsPath + "/listview/listview"], returnFirstDependency);
        define("listViewStyle", ["css!" + componentsPath + "/listview/listview"], returnFirstDependency);
        define("formDialogStyle", ["css!" + componentsPath + "/formdialog"], returnFirstDependency);
        define("indicators", [componentsPath + "/indicators/indicators"], returnFirstDependency);
        define("viewSettings", [componentsPath + "/viewsettings/viewsettings"], returnFirstDependency);
        define("filterMenu", [componentsPath + "/filtermenu/filtermenu"], returnFirstDependency);
        define("sortMenu", [componentsPath + "/sortmenu/sortmenu"], returnFirstDependency);
        define("connectionmanager", [apiClientBowerPath + "/connectionmanager"]);
        define("serversync", [apiClientBowerPath + "/sync/serversync"], returnFirstDependency);
        define("multiserversync", [apiClientBowerPath + "/sync/multiserversync"], returnFirstDependency);
        define("mediasync", [apiClientBowerPath + "/sync/mediasync"], returnFirstDependency);
        define("idb", [componentsPath + "/idb"], returnFirstDependency);
        define("sanitizefilename", [componentsPath + "/sanitizefilename"], returnFirstDependency);
        define("itemrepository", [apiClientBowerPath + "/sync/itemrepository"], returnFirstDependency);
        define("useractionrepository", [apiClientBowerPath + "/sync/useractionrepository"], returnFirstDependency);
        define("swiper", [bowerPath + "/Swiper/dist/js/swiper.min", "css!" + bowerPath + "/Swiper/dist/css/swiper.min"], returnFirstDependency);
        define("scroller", [componentsPath + "/scroller"], returnFirstDependency);
        define("toast", [componentsPath + "/toast/toast"], returnFirstDependency);
        define("scrollHelper", [componentsPath + "/scrollhelper"], returnFirstDependency);
        define("touchHelper", [componentsPath + "/touchhelper"], returnFirstDependency);
        define("appSettings", [componentsPath + "/appsettings"], returnFirstDependency);
        define("userSettings", [componentsPath + "/usersettings/usersettings"], returnFirstDependency);
        define("userSettingsBuilder", [componentsPath + "/usersettings/usersettingsbuilder", "layoutManager", "browser"], getSettingsBuilder);
        define("material-icons", ["css!css/material-icons/style"], returnFirstDependency);
        define("systemFontsCss", ["css!css/fonts"], returnFirstDependency);
        define("systemFontsSizedCss", ["css!css/fonts.sized"], returnFirstDependency);
        define("scrollStyles", ["css!" + componentsPath + "/scrollstyles"], returnFirstDependency);
        define("imageUploader", [componentsPath + "/imageuploader/imageuploader"], returnFirstDependency);
        define("navdrawer", ["components/navdrawer/navdrawer"], returnFirstDependency);
        define("htmlMediaHelper", [componentsPath + "/htmlMediaHelper"], returnFirstDependency);
        define("viewcontainer", ["components/viewContainer"], returnFirstDependency);
        define("queryString", [bowerPath + "/query-string/index"], function () {
            return queryString;
        });
        define("jQuery", [bowerPath + "/jquery/dist/jquery.slim.min"], function () {
            if (window.ApiClient) {
                jQuery.ajax = ApiClient.ajax;
            }

            return jQuery;
        });
        define("fnchecked", ["legacy/fnchecked"], returnFirstDependency);
        define("dialogHelper", [componentsPath + "/dialogHelper/dialogHelper"], returnFirstDependency);
        define("inputmanager", ["inputManager"], returnFirstDependency);
        define("serverNotifications", [componentsPath + "/serverNotifications/serverNotifications"], returnFirstDependency);
        define("appFooter-shared", ["appFooter"], createSharedAppFooter);
        define("skinManager", [componentsPath + "/skinManager"], returnFirstDependency);
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

            appRouter.showNowPlaying = function () {
                Dashboard.navigate("nowplaying.html");
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
                    return "list/list.html?type=nextup&serverId=" + options.serverId;
                }

                if ("list" === item) {
                    var url = "list/list.html?serverId=" + options.serverId + "&type=" + options.itemTypes;

                    if (options.isFavorite) {
                        url += "&IsFavorite=true";
                    }

                    return url;
                }

                if ("livetv" === item) {
                    if ("guide" === options.section) {
                        return "livetv.html?tab=1&serverId=" + options.serverId;
                    }

                    if ("movies" === options.section) {
                        return "list/list.html?type=Programs&IsMovie=true&serverId=" + options.serverId;
                    }

                    if ("shows" === options.section) {
                        return "list/list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=" + options.serverId;
                    }

                    if ("sports" === options.section) {
                        return "list/list.html?type=Programs&IsSports=true&serverId=" + options.serverId;
                    }

                    if ("kids" === options.section) {
                        return "list/list.html?type=Programs&IsKids=true&serverId=" + options.serverId;
                    }

                    if ("news" === options.section) {
                        return "list/list.html?type=Programs&IsNews=true&serverId=" + options.serverId;
                    }

                    if ("onnow" === options.section) {
                        return "list/list.html?type=Programs&IsAiring=true&serverId=" + options.serverId;
                    }

                    if ("dvrschedule" === options.section) {
                        return "livetv.html?tab=4&serverId=" + options.serverId;
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
                    url = "list/list.html?genreId=" + item.Id + "&serverId=" + serverId;

                    if ("livetv" === context) {
                        url += "&type=Programs";
                    }

                    if (options.parentId) {
                        url += "&parentId=" + options.parentId;
                    }

                    return url;
                }

                if ("MusicGenre" === item.Type) {
                    url = "list/list.html?musicGenreId=" + item.Id + "&serverId=" + serverId;

                    if (options.parentId) {
                        url += "&parentId=" + options.parentId;
                    }

                    return url;
                }

                if ("Studio" === item.Type) {
                    url = "list/list.html?studioId=" + item.Id + "&serverId=" + serverId;

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
                        return "list/list.html?parentId=" + id + "&serverId=" + serverId;
                    }

                    return "#";
                }

                return "itemdetails.html?id=" + id + "&serverId=" + serverId;
            };

            appRouter.showItem = showItem;
            return appRouter;
        });
    })();

    require(["css!css/site"]);
    
    return require(["browser"], onWebComponentsReady);
}();
pageClassOn("viewshow", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.add("noHeaderRight");
});
pageClassOn("viewhide", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.remove("noHeaderRight");
});
