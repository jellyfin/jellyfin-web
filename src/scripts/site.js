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

            Promise.all(promises).then(function (responses) {
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
        UserSettings.prototype.enableThemeVideos = function (val) {
            if (val != null) {
                return this.set('enableThemeVideos', val.toString(), false);
            }

            val = this.get('enableThemeVideos', false);

            if (val !== 'false') {
                return !layoutManager.mobile;
            } else {
                return !browser.slow;
            }
        };

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

    function getAppStorage(basePath) {
        try {
            localStorage.setItem("_test", "0");
            localStorage.removeItem("_test");
            return basePath + "/appstorage-localstorage";
        } catch (e) {
            return basePath + "/appstorage-memory";
        }
    }

    function createWindowHeadroom(Headroom) {
        var headroom = new Headroom([], {});
        headroom.init();
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
            define("ResizeObserver", ["bower_components/emby-webcomponents/resize-observer-polyfill/ResizeObserver"], returnFirstDependency);
        }
    }

    function initRequireWithBrowser(browser) {
        var bowerPath = getBowerPath();
        var apiClientBowerPath = bowerPath + "/emby-apiclient";
        var embyWebComponentsBowerPath = bowerPath + "/emby-webcomponents";

        if ("android" === self.appMode) {
            define("filesystem", ["cordova/filesystem"], returnFirstDependency);
        } else {
            define("filesystem", [embyWebComponentsBowerPath + "/filesystem"], returnFirstDependency);
        }

        if (window.IntersectionObserver && !browser.edge) {
            define("lazyLoader", [embyWebComponentsBowerPath + "/lazyloader/lazyloader-intersectionobserver"], returnFirstDependency);
        } else {
            define("lazyLoader", [embyWebComponentsBowerPath + "/lazyloader/lazyloader-scroll"], returnFirstDependency);
        }

        if ("android" === self.appMode) {
            define("shell", ["cordova/shell"], returnFirstDependency);
        } else {
            define("shell", [embyWebComponentsBowerPath + "/shell"], returnFirstDependency);
        }

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("apiclientcore", ["bower_components/emby-apiclient/apiclient"], returnFirstDependency);
            define("apiclient", ["bower_components/emby-apiclient/apiclientex"], returnFirstDependency);
        } else {
            define("apiclient", ["bower_components/emby-apiclient/apiclient"], returnFirstDependency);
        }

        define("actionsheet", ["webActionSheet"], returnFirstDependency);

        if ("registerElement" in document) {
            define("registerElement", []);
        } else if (browser.msie) {
            define("registerElement", [bowerPath + "/webcomponentsjs/webcomponents-lite.min.js"], returnFirstDependency);
        } else {
            define("registerElement", [bowerPath + "/document-register-element/build/document-register-element"], returnFirstDependency);
        }

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("serverdiscovery", ["cordova/serverdiscovery"], returnFirstDependency);
        } else {
            define("serverdiscovery", [apiClientBowerPath + "/serverdiscovery"], returnFirstDependency);
        }

        if ("cordova" === self.appMode && browser.iOSVersion && browser.iOSVersion < 11) {
            define("imageFetcher", ["cordova/imagestore"], returnFirstDependency);
        } else {
            define("imageFetcher", [embyWebComponentsBowerPath + "/images/basicimagefetcher"], returnFirstDependency);
        }

        var preferNativeAlerts = browser.tv;

        if (preferNativeAlerts && window.alert) {
            define("alert", [embyWebComponentsBowerPath + "/alert/nativealert"], returnFirstDependency);
        } else {
            define("alert", [embyWebComponentsBowerPath + "/alert/alert"], returnFirstDependency);
        }

        defineResizeObserver();
        define("dialog", [embyWebComponentsBowerPath + "/dialog/dialog"], returnFirstDependency);

        if (preferNativeAlerts && window.confirm) {
            define("confirm", [embyWebComponentsBowerPath + "/confirm/nativeconfirm"], returnFirstDependency);
        } else {
            define("confirm", [embyWebComponentsBowerPath + "/confirm/confirm"], returnFirstDependency);
        }

        if ((preferNativeAlerts || browser.xboxOne) && window.confirm) {
            define("prompt", [embyWebComponentsBowerPath + "/prompt/nativeprompt"], returnFirstDependency);
        } else {
            define("prompt", [embyWebComponentsBowerPath + "/prompt/prompt"], returnFirstDependency);
        }

        if (browser.tizen || browser.operaTv || browser.chromecast || browser.orsay || browser.web0s || browser.ps4) {
            define("loading", [embyWebComponentsBowerPath + "/loading/loading-legacy"], returnFirstDependency);
        } else {
            define("loading", [embyWebComponentsBowerPath + "/loading/loading-lite"], returnFirstDependency);
        }

        define("multi-download", [embyWebComponentsBowerPath + "/multidownload"], returnFirstDependency);

        if ("android" === self.appMode) {
            define("fileDownloader", ["cordova/filedownloader"], returnFirstDependency);
        } else {
            define("fileDownloader", [embyWebComponentsBowerPath + "/filedownloader"], returnFirstDependency);
        }

        define("localassetmanager", [apiClientBowerPath + "/localassetmanager"], returnFirstDependency);

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("castSenderApiLoader", [], getDummyCastSenderApiLoader);
        } else {
            define("castSenderApiLoader", [], getCastSenderApiLoader);
        }

        if (self.Windows) {
            define("bgtaskregister", ["environments/windows-uwp/bgtaskregister"], returnFirstDependency);
            define("transfermanager", ["environments/windows-uwp/transfermanager"], returnFirstDependency);
            define("filerepository", ["environments/windows-uwp/filerepository"], returnFirstDependency);
        } else if ("cordova" === self.appMode) {
            define("filerepository", ["cordova/filerepository"], returnFirstDependency);
            define("transfermanager", ["filerepository"], returnFirstDependency);
        } else if ("android" === self.appMode) {
            define("transfermanager", ["cordova/transfermanager"], returnFirstDependency);
            define("filerepository", ["cordova/filerepository"], returnFirstDependency);
        } else {
            define("transfermanager", [apiClientBowerPath + "/sync/transfermanager"], returnFirstDependency);
            define("filerepository", [apiClientBowerPath + "/sync/filerepository"], returnFirstDependency);
        }

        if ("android" === self.appMode) {
            define("localsync", ["cordova/localsync"], returnFirstDependency);
        } else {
            define("localsync", [apiClientBowerPath + "/sync/localsync"], returnFirstDependency);
        }
    }

    function init() {
        if ("android" === self.appMode) {
            define("nativedirectorychooser", ["cordova/nativedirectorychooser"], returnFirstDependency);
        }

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

        if (!Array.prototype.filter) {
            promises.push(require(["arraypolyfills"]));
        }

        if (!Function.prototype.bind) {
            promises.push(require(["functionbind"]));
        }

        if (!window.requestAnimationFrame) {
            promises.push(require(["raf"]));
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

    function defineRoute(newRoute, dictionary) {
        var baseRoute = Emby.Page.baseUrl();
        var path = newRoute.path;
        path = path.replace(baseRoute, "");
        console.log("Defining route: " + path);
        newRoute.dictionary = newRoute.dictionary || dictionary || "core";
        Emby.Page.addRoute(path, newRoute);
    }

    function defineCoreRoutes(appHost) {
        console.log("Defining core routes");
        defineRoute({
            path: "/addplugin.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "scripts/addpluginpage"
        });
        defineRoute({
            path: "/appservices.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/autoorganizelog.html",
            dependencies: [],
            roles: "admin"
        });
        defineRoute({
            path: "/channelsettings.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/addserver.html",
            dependencies: ["emby-button", "emby-input"],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: "scripts/addserver"
        });
        defineRoute({
            path: "/dashboard.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "scripts/dashboardpage"
        });
        defineRoute({
            path: "/dashboardgeneral.html",
            controller: "dashboard/dashboardgeneral",
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/dashboardhosting.html",
            dependencies: ["emby-input", "emby-button"],
            autoFocus: false,
            roles: "admin",
            controller: "dashboard/dashboardhosting"
        });
        defineRoute({
            path: "/devices/devices.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "devices/devices"
        });
        defineRoute({
            path: "/devices/device.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "devices/device"
        });
        defineRoute({
            path: "/dlnaprofile.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/dlnaprofiles.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/dlnaserversettings.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/dlnasettings.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/edititemmetadata.html",
            dependencies: [],
            controller: "scripts/edititemmetadata",
            autoFocus: false
        });
        defineRoute({
            path: "/encodingsettings.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/opensubtitles.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/forgotpassword.html",
            dependencies: ["emby-input", "emby-button"],
            anonymous: true,
            startup: true,
            controller: "scripts/forgotpassword"
        });
        defineRoute({
            path: "/forgotpasswordpin.html",
            dependencies: ["emby-input", "emby-button"],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: "scripts/forgotpasswordpin"
        });
        defineRoute({
            path: "/home.html",
            dependencies: [],
            autoFocus: false,
            controller: "home/home",
            transition: "fade",
            type: "home"
        });
        defineRoute({
            path: "/list/list.html",
            dependencies: [],
            autoFocus: false,
            controller: "list/list",
            transition: "fade"
        });
        defineRoute({
            path: "/index.html",
            dependencies: [],
            autoFocus: false,
            isDefaultRoute: true
        });
        defineRoute({
            path: "/itemdetails.html",
            dependencies: ["emby-button", "scripts/livetvcomponents", "paper-icon-button-light", "emby-itemscontainer"],
            controller: "scripts/itemdetailpage",
            autoFocus: false,
            transition: "fade"
        });
        defineRoute({
            path: "/library.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/librarydisplay.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "dashboard/librarydisplay"
        });
        defineRoute({
            path: "/librarysettings.html",
            dependencies: ["emby-collapse", "emby-input", "emby-button", "emby-select"],
            autoFocus: false,
            roles: "admin",
            controller: "dashboard/librarysettings"
        });
        defineRoute({
            path: "/livetv.html",
            dependencies: ["emby-button", "livetvcss"],
            controller: "scripts/livetvsuggested",
            autoFocus: false,
            transition: "fade"
        });
        defineRoute({
            path: "/livetvguideprovider.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/livetvseriestimer.html",
            dependencies: ["emby-checkbox", "emby-input", "emby-button", "emby-collapse", "scripts/livetvcomponents", "scripts/livetvseriestimer", "livetvcss"],
            autoFocus: false,
            controller: "scripts/livetvseriestimer"
        });
        defineRoute({
            path: "/livetvsettings.html",
            dependencies: [],
            autoFocus: false
        });
        defineRoute({
            path: "/livetvstatus.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/livetvtuner.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "dashboard/livetvtuner"
        });
        defineRoute({
            path: "/log.html",
            dependencies: ["emby-checkbox"],
            roles: "admin",
            controller: "dashboard/logpage"
        });
        defineRoute({
            path: "/login.html",
            dependencies: ["emby-button", "emby-input"],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: "scripts/loginpage"
        });
        defineRoute({
            path: "/metadataadvanced.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/metadataimages.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/metadatanfo.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/movies.html",
            dependencies: ["emby-button"],
            autoFocus: false,
            controller: "scripts/moviesrecommended",
            transition: "fade"
        });
        defineRoute({
            path: "/music.html",
            dependencies: [],
            controller: "scripts/musicrecommended",
            autoFocus: false,
            transition: "fade"
        });
        defineRoute({
            path: "/mypreferencesdisplay.html",
            dependencies: ["emby-checkbox", "emby-button", "emby-select"],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/mypreferencesdisplay"
        });
        defineRoute({
            path: "/mypreferenceshome.html",
            dependencies: [],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/mypreferenceshome"
        });
        defineRoute({
            path: "/mypreferencessubtitles.html",
            dependencies: [],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/mypreferencessubtitles"
        });
        defineRoute({
            path: "/mypreferenceslanguages.html",
            dependencies: ["emby-button", "emby-checkbox", "emby-select"],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/mypreferenceslanguages"
        });
        defineRoute({
            path: "/mypreferencesmenu.html",
            dependencies: ["emby-button"],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/mypreferencescommon"
        });
        defineRoute({
            path: "/myprofile.html",
            dependencies: ["emby-button", "emby-collapse", "emby-checkbox", "emby-input"],
            autoFocus: false,
            transition: "fade",
            controller: "scripts/myprofile"
        });
        defineRoute({
            path: "/notificationsetting.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/notificationsettings.html",
            controller: "scripts/notificationsettings",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/nowplaying.html",
            dependencies: ["paper-icon-button-light", "emby-slider", "emby-button", "emby-input", "emby-itemscontainer"],
            controller: "scripts/nowplayingpage",
            autoFocus: false,
            transition: "fade",
            fullscreen: true,
            supportsThemeMedia: true,
            enableMediaControl: false
        });
        defineRoute({
            path: "/playbackconfiguration.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/plugincatalog.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "scripts/plugincatalogpage"
        });
        defineRoute({
            path: "/plugins.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/scheduledtask.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "scripts/scheduledtaskpage"
        });
        defineRoute({
            path: "/scheduledtasks.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "scripts/scheduledtaskspage"
        });
        defineRoute({
            path: "/search.html",
            dependencies: [],
            controller: "scripts/searchpage"
        });
        defineRoute({
            path: "/selectserver.html",
            dependencies: ["listViewStyle", "emby-button"],
            autoFocus: false,
            anonymous: true,
            startup: true,
            controller: "scripts/selectserver"
        });
        defineRoute({
            path: "/serveractivity.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin",
            controller: "dashboard/serveractivity"
        });
        defineRoute({
            path: "/serversecurity.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/streamingsettings.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/support.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/tv.html",
            dependencies: ["paper-icon-button-light", "emby-button"],
            autoFocus: false,
            controller: "scripts/tvrecommended",
            transition: "fade"
        });
        defineRoute({
            path: "/useredit.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/userlibraryaccess.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/usernew.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/userparentalcontrol.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/userpassword.html",
            dependencies: ["emby-input", "emby-button", "emby-checkbox"],
            autoFocus: false,
            controller: "scripts/userpasswordpage"
        });
        defineRoute({
            path: "/userprofiles.html",
            dependencies: [],
            autoFocus: false,
            roles: "admin"
        });
        defineRoute({
            path: "/wizardremoteaccess.html",
            dependencies: ["dashboardcss"],
            autoFocus: false,
            anonymous: true,
            controller: "dashboard/wizardremoteaccess"
        });
        defineRoute({
            path: "/wizardfinish.html",
            dependencies: ["emby-button", "dashboardcss"],
            autoFocus: false,
            anonymous: true,
            controller: "dashboard/wizardfinishpage"
        });
        defineRoute({
            path: "/wizardlibrary.html",
            dependencies: ["dashboardcss"],
            autoFocus: false,
            anonymous: true
        });
        defineRoute({
            path: "/wizardsettings.html",
            dependencies: ["dashboardcss"],
            autoFocus: false,
            anonymous: true,
            controller: "dashboard/wizardsettings"
        });
        defineRoute({
            path: "/wizardstart.html",
            dependencies: ["dashboardcss"],
            autoFocus: false,
            anonymous: true,
            controller: "dashboard/wizardstart"
        });
        defineRoute({
            path: "/wizarduser.html",
            dependencies: ["dashboardcss", "emby-input"],
            controller: "scripts/wizarduserpage",
            autoFocus: false,
            anonymous: true
        });
        defineRoute({
            path: "/videoosd.html",
            dependencies: [],
            transition: "fade",
            controller: "scripts/videoosd",
            autoFocus: false,
            type: "video-osd",
            supportsThemeMedia: true,
            fullscreen: true,
            enableMediaControl: false
        });
        defineRoute({
            path: "/configurationpage",
            dependencies: [],
            autoFocus: false,
            enableCache: false,
            enableContentQueryString: true,
            roles: "admin"
        });
        defineRoute({
            path: "/",
            isDefaultRoute: true,
            autoFocus: false,
            dependencies: []
        });
    }

    function getPluginPageContentPath() {
        if (window.ApiClient) {
            return ApiClient.getUrl("web/ConfigurationPage");
        }

        return null;
    }

    function loadPlugins(externalPlugins, appHost, browser, shell) {
        console.log("Loading installed plugins");
        var list = [
            "bower_components/emby-webcomponents/playback/playbackvalidation",
            "bower_components/emby-webcomponents/playback/playaccessvalidation",
            "bower_components/emby-webcomponents/playback/experimentalwarnings",
            "bower_components/emby-webcomponents/htmlaudioplayer/plugin",
            "bower_components/emby-webcomponents/htmlvideoplayer/plugin",
            "bower_components/emby-webcomponents/photoplayer/plugin",
            "bower_components/emby-webcomponents/youtubeplayer/plugin"
        ];

        if ("cordova" === self.appMode) {
            list.push("cordova/chromecast");
        }

        if ("android" === self.appMode) {
            list.push("cordova/externalplayer");
        }

        if (appHost.supports("remotecontrol")) {
            list.push("bower_components/emby-webcomponents/sessionplayer");

            if (browser.chrome || browser.opera) {
                list.push("bower_components/emby-webcomponents/chromecast/chromecastplayer");
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

    function enableNativeGamepadKeyMapping() {
        if (window.navigator && "string" == typeof window.navigator.gamepadInputEmulation) {
            window.navigator.gamepadInputEmulation = "keyboard";
            return true;
        }

        return false;
    }

    function isGamepadSupported() {
        return "ongamepadconnected" in window || navigator.getGamepads || navigator.webkitGetGamepads;
    }

    function onAppReady(browser) {
        console.log("Begin onAppReady");

        var isInBackground = -1 !== self.location.href.toString().toLowerCase().indexOf("start=backgroundsync");

        window.Emby = {};

        console.log("onAppReady - loading dependencies");

        if (isInBackground) {
            syncNow();
        } else {

            if (browser.iOS) {
                require(['css!devices/ios/ios.css']);
            }

            require(['apphost', 'appRouter', 'scripts/themeloader', 'libraryMenu'], function (appHost, pageObjects) {
                window.Emby.Page = pageObjects;

                defineCoreRoutes(appHost);

                Emby.Page.start({
                    click: false,
                    hashbang: true
                });

                if (!enableNativeGamepadKeyMapping() && isGamepadSupported()) {
                    require(["bower_components/emby-webcomponents/input/gamepadtokey"]);
                }

                require(["bower_components/emby-webcomponents/thememediaplayer", "scripts/autobackdrops"]);

                if ("cordova" === self.appMode || "android" === self.appMode) {
                    if (browser.android) {
                        require(["cordova/mediasession", "cordova/chromecast", "cordova/appshortcuts"]);
                    } else if (browser.safari) {
                        require(["cordova/mediasession", "cordova/volume", "cordova/statusbar", "cordova/backgroundfetch"]);
                    }
                }

                if (!browser.tv && !browser.xboxOne && !browser.ps4) {
                    require(["bower_components/emby-webcomponents/nowplayingbar/nowplayingbar"]);
                }

                if (appHost.supports("remotecontrol")) {
                    require(["playerSelectionMenu", "bower_components/emby-webcomponents/playback/remotecontrolautoplay"]);
                }

                if (!(appHost.supports("physicalvolumecontrol") && !browser.touch || browser.edge)) {
                    require(["bower_components/emby-webcomponents/playback/volumeosd"]);
                }

                if (navigator.mediaSession) {
                    require(["mediaSession"]);
                }

                require(["apiInput", "mouseManager"]);

                if (!browser.tv && !browser.xboxOne) {
                    require(["bower_components/emby-webcomponents/playback/playbackorientation"]);
                    registerServiceWorker();

                    if (window.Notification) {
                        require(["bower_components/emby-webcomponents/notifications/notifications"]);
                    }
                }

                require(["playerSelectionMenu"]);

                if (appHost.supports("fullscreenchange") && (browser.edgeUwp || -1 !== navigator.userAgent.toLowerCase().indexOf("electron"))) {
                    require(["fullscreen-doubleclick"]);
                }

                if (appHost.supports("sync")) {
                    initLocalSyncEvents();
                }

                if (!AppInfo.isNativeApp && window.ApiClient) {
                    require(["css!" + ApiClient.getUrl("Branding/Css")]);
                }
            });
        }
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
            initialDependencies.push();
            require(["bower_components/emby-webcomponents/native-promise-only/lib/npo.src"], init);
        } else {
            init();
        }
    }

    var localApiClient;

    (function () {
        var urlArgs = "v=" + (window.dashboardVersion || new Date().getDate());
        var bowerPath = getBowerPath();
        var apiClientBowerPath = bowerPath + "/emby-apiclient";
        var embyWebComponentsBowerPath = bowerPath + "/emby-webcomponents";
        var paths = {
            velocity: bowerPath + "/velocity/velocity.min",
            vibrant: bowerPath + "/vibrant/dist/vibrant",
            staticBackdrops: embyWebComponentsBowerPath + "/staticbackdrops",
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
            connectionManagerFactory: bowerPath + "/emby-apiclient/connectionmanager",
            visibleinviewport: embyWebComponentsBowerPath + "/visibleinviewport",
            browserdeviceprofile: embyWebComponentsBowerPath + "/browserdeviceprofile",
            browser: embyWebComponentsBowerPath + "/browser",
            inputManager: embyWebComponentsBowerPath + "/inputmanager",
            qualityoptions: embyWebComponentsBowerPath + "/qualityoptions",
            hammer: bowerPath + "/hammerjs/hammer.min",
            pageJs: embyWebComponentsBowerPath + "/pagejs/page",
            focusManager: embyWebComponentsBowerPath + "/focusmanager",
            datetime: embyWebComponentsBowerPath + "/datetime",
            globalize: embyWebComponentsBowerPath + "/globalize",
            itemHelper: embyWebComponentsBowerPath + "/itemhelper",
            itemShortcuts: embyWebComponentsBowerPath + "/shortcuts",
            playQueueManager: embyWebComponentsBowerPath + "/playback/playqueuemanager",
            autoPlayDetect: embyWebComponentsBowerPath + "/playback/autoplaydetect",
            nowPlayingHelper: embyWebComponentsBowerPath + "/playback/nowplayinghelper",
            pluginManager: embyWebComponentsBowerPath + "/pluginmanager",
            packageManager: embyWebComponentsBowerPath + "/packagemanager"
        };
        paths.hlsjs = bowerPath + "/hlsjs/dist/hls.min";
        paths.flvjs = embyWebComponentsBowerPath + "/flvjs/flv.min";
        paths.shaka = embyWebComponentsBowerPath + "/shaka/shaka-player.compiled";
        define("chromecastHelper", [embyWebComponentsBowerPath + "/chromecast/chromecasthelpers"], returnFirstDependency);
        define("mediaSession", [embyWebComponentsBowerPath + "/playback/mediasession"], returnFirstDependency);
        define("webActionSheet", [embyWebComponentsBowerPath + "/actionsheet/actionsheet"], returnFirstDependency);
        define("libjass", [bowerPath + "/libjass/libjass.min", "css!" + bowerPath + "/libjass/libjass"], returnFirstDependency);
        define("tunerPicker", ["components/tunerpicker"], returnFirstDependency);
        define("mainTabsManager", [embyWebComponentsBowerPath + "/maintabsmanager"], returnFirstDependency);
        define("imageLoader", [embyWebComponentsBowerPath + "/images/imagehelper"], returnFirstDependency);
        define("appFooter", [embyWebComponentsBowerPath + "/appfooter/appfooter"], returnFirstDependency);
        define("directorybrowser", ["components/directorybrowser/directorybrowser"], returnFirstDependency);
        define("metadataEditor", [embyWebComponentsBowerPath + "/metadataeditor/metadataeditor"], returnFirstDependency);
        define("personEditor", [embyWebComponentsBowerPath + "/metadataeditor/personeditor"], returnFirstDependency);
        define("playerSelectionMenu", [embyWebComponentsBowerPath + "/playback/playerselection"], returnFirstDependency);
        define("playerSettingsMenu", [embyWebComponentsBowerPath + "/playback/playersettingsmenu"], returnFirstDependency);
        define("playMethodHelper", [embyWebComponentsBowerPath + "/playback/playmethodhelper"], returnFirstDependency);
        define("brightnessOsd", [embyWebComponentsBowerPath + "/playback/brightnessosd"], returnFirstDependency);
        define("libraryMenu", ["scripts/librarymenu"], returnFirstDependency);
        define("emby-collapse", [embyWebComponentsBowerPath + "/emby-collapse/emby-collapse"], returnFirstDependency);
        define("emby-button", [embyWebComponentsBowerPath + "/emby-button/emby-button"], returnFirstDependency);
        define("emby-linkbutton", ["emby-button"], returnFirstDependency);
        define("emby-itemscontainer", [embyWebComponentsBowerPath + "/emby-itemscontainer/emby-itemscontainer"], returnFirstDependency);
        define("alphaNumericShortcuts", [embyWebComponentsBowerPath + "/alphanumericshortcuts/alphanumericshortcuts"], returnFirstDependency);
        define("emby-scroller", [embyWebComponentsBowerPath + "/emby-scroller/emby-scroller"], returnFirstDependency);
        define("emby-tabs", [embyWebComponentsBowerPath + "/emby-tabs/emby-tabs"], returnFirstDependency);
        define("emby-scrollbuttons", [embyWebComponentsBowerPath + "/emby-scrollbuttons/emby-scrollbuttons"], returnFirstDependency);
        define("emby-progressring", [embyWebComponentsBowerPath + "/emby-progressring/emby-progressring"], returnFirstDependency);
        define("emby-itemrefreshindicator", [embyWebComponentsBowerPath + "/emby-itemrefreshindicator/emby-itemrefreshindicator"], returnFirstDependency);
        define("multiSelect", [embyWebComponentsBowerPath + "/multiselect/multiselect"], returnFirstDependency);
        define("alphaPicker", [embyWebComponentsBowerPath + "/alphapicker/alphapicker"], returnFirstDependency);
        define("paper-icon-button-light", [embyWebComponentsBowerPath + "/emby-button/paper-icon-button-light"], returnFirstDependency);
        define("tabbedView", [embyWebComponentsBowerPath + "/tabbedview/tabbedview"], returnFirstDependency);
        define("itemsTab", [embyWebComponentsBowerPath + "/tabbedview/itemstab"], returnFirstDependency);
        define("emby-input", [embyWebComponentsBowerPath + "/emby-input/emby-input"], returnFirstDependency);
        define("emby-select", [embyWebComponentsBowerPath + "/emby-select/emby-select"], returnFirstDependency);
        define("emby-slider", [embyWebComponentsBowerPath + "/emby-slider/emby-slider"], returnFirstDependency);
        define("emby-checkbox", [embyWebComponentsBowerPath + "/emby-checkbox/emby-checkbox"], returnFirstDependency);
        define("emby-toggle", [embyWebComponentsBowerPath + "/emby-toggle/emby-toggle"], returnFirstDependency);
        define("emby-radio", [embyWebComponentsBowerPath + "/emby-radio/emby-radio"], returnFirstDependency);
        define("emby-textarea", [embyWebComponentsBowerPath + "/emby-textarea/emby-textarea"], returnFirstDependency);
        define("collectionEditor", [embyWebComponentsBowerPath + "/collectioneditor/collectioneditor"], returnFirstDependency);
        define("serverRestartDialog", [embyWebComponentsBowerPath + "/serverrestartdialog/serverrestartdialog"], returnFirstDependency);
        define("playlistEditor", [embyWebComponentsBowerPath + "/playlisteditor/playlisteditor"], returnFirstDependency);
        define("recordingCreator", [embyWebComponentsBowerPath + "/recordingcreator/recordingcreator"], returnFirstDependency);
        define("recordingEditor", [embyWebComponentsBowerPath + "/recordingcreator/recordingeditor"], returnFirstDependency);
        define("seriesRecordingEditor", [embyWebComponentsBowerPath + "/recordingcreator/seriesrecordingeditor"], returnFirstDependency);
        define("recordingFields", [embyWebComponentsBowerPath + "/recordingcreator/recordingfields"], returnFirstDependency);
        define("recordingButton", [embyWebComponentsBowerPath + "/recordingcreator/recordingbutton"], returnFirstDependency);
        define("recordingHelper", [embyWebComponentsBowerPath + "/recordingcreator/recordinghelper"], returnFirstDependency);
        define("subtitleEditor", [embyWebComponentsBowerPath + "/subtitleeditor/subtitleeditor"], returnFirstDependency);
        define("itemIdentifier", [embyWebComponentsBowerPath + "/itemidentifier/itemidentifier"], returnFirstDependency);
        define("mediaInfo", [embyWebComponentsBowerPath + "/mediainfo/mediainfo"], returnFirstDependency);
        define("itemContextMenu", [embyWebComponentsBowerPath + "/itemcontextmenu"], returnFirstDependency);
        define("imageEditor", [embyWebComponentsBowerPath + "/imageeditor/imageeditor"], returnFirstDependency);
        define("imageDownloader", [embyWebComponentsBowerPath + "/imagedownloader/imagedownloader"], returnFirstDependency);
        define("dom", [embyWebComponentsBowerPath + "/dom"], returnFirstDependency);
        define("playerStats", [embyWebComponentsBowerPath + "/playerstats/playerstats"], returnFirstDependency);
        define("searchFields", [embyWebComponentsBowerPath + "/search/searchfields"], returnFirstDependency);
        define("searchResults", [embyWebComponentsBowerPath + "/search/searchresults"], returnFirstDependency);
        define("upNextDialog", [embyWebComponentsBowerPath + "/upnextdialog/upnextdialog"], returnFirstDependency);
        define("fullscreen-doubleclick", [embyWebComponentsBowerPath + "/fullscreen/fullscreen-dc"], returnFirstDependency);
        define("fullscreenManager", [embyWebComponentsBowerPath + "/fullscreen/fullscreenmanager", "events"], returnFirstDependency);
        define("headroom", [embyWebComponentsBowerPath + "/headroom/headroom"], returnFirstDependency);
        define("subtitleAppearanceHelper", [embyWebComponentsBowerPath + "/subtitlesettings/subtitleappearancehelper"], returnFirstDependency);
        define("subtitleSettings", [embyWebComponentsBowerPath + "/subtitlesettings/subtitlesettings"], returnFirstDependency);
        define("displaySettings", [embyWebComponentsBowerPath + "/displaysettings/displaysettings"], returnFirstDependency);
        define("playbackSettings", [embyWebComponentsBowerPath + "/playbacksettings/playbacksettings"], returnFirstDependency);
        define("homescreenSettings", [embyWebComponentsBowerPath + "/homescreensettings/homescreensettings"], returnFirstDependency);
        define("homescreenSettingsDialog", [embyWebComponentsBowerPath + "/homescreensettings/homescreensettingsdialog"], returnFirstDependency);
        define("playbackManager", [embyWebComponentsBowerPath + "/playback/playbackmanager"], getPlaybackManager);
        define("layoutManager", [embyWebComponentsBowerPath + "/layoutmanager", "apphost"], getLayoutManager);
        define("homeSections", [embyWebComponentsBowerPath + "/homesections/homesections"], returnFirstDependency);
        define("playMenu", [embyWebComponentsBowerPath + "/playmenu"], returnFirstDependency);
        define("refreshDialog", [embyWebComponentsBowerPath + "/refreshdialog/refreshdialog"], returnFirstDependency);
        define("backdrop", [embyWebComponentsBowerPath + "/backdrop/backdrop"], returnFirstDependency);
        define("fetchHelper", [embyWebComponentsBowerPath + "/fetchhelper"], returnFirstDependency);
        define("roundCardStyle", ["cardStyle", "css!" + embyWebComponentsBowerPath + "/cardbuilder/roundcard"], returnFirstDependency);
        define("cardStyle", ["css!" + embyWebComponentsBowerPath + "/cardbuilder/card"], returnFirstDependency);
        define("cardBuilder", [embyWebComponentsBowerPath + "/cardbuilder/cardbuilder"], returnFirstDependency);
        define("peoplecardbuilder", [embyWebComponentsBowerPath + "/cardbuilder/peoplecardbuilder"], returnFirstDependency);
        define("chaptercardbuilder", [embyWebComponentsBowerPath + "/cardbuilder/chaptercardbuilder"], returnFirstDependency);
        define("mouseManager", [embyWebComponentsBowerPath + "/input/mouse"], returnFirstDependency);
        define("flexStyles", ["css!" + embyWebComponentsBowerPath + "/flexstyles"], returnFirstDependency);
        define("deleteHelper", [embyWebComponentsBowerPath + "/deletehelper"], returnFirstDependency);
        define("tvguide", [embyWebComponentsBowerPath + "/guide/guide"], returnFirstDependency);
        define("programStyles", ["css!" + embyWebComponentsBowerPath + "/guide/programs"], returnFirstDependency);
        define("guide-settings-dialog", [embyWebComponentsBowerPath + "/guide/guide-settings"], returnFirstDependency);
        define("loadingDialog", [embyWebComponentsBowerPath + "/loadingdialog/loadingdialog"], returnFirstDependency);
        define("syncDialog", [embyWebComponentsBowerPath + "/sync/sync"], returnFirstDependency);
        define("viewManager", [embyWebComponentsBowerPath + "/viewmanager/viewmanager"], function (viewManager) {
            window.ViewManager = viewManager;
            viewManager.dispatchPageEvents(true);
            return viewManager;
        });

        if ("cordova" === self.appMode || "android" === self.appMode) {
            paths.apphost = "cordova/apphost";
        } else {
            paths.apphost = "components/apphost";
        }

        paths.appStorage = getAppStorage(apiClientBowerPath);
        requirejs.config({
            waitSeconds: 0,
            map: {
                "*": {
                    css: bowerPath + "/emby-webcomponents/require/requirecss",
                    text: bowerPath + "/emby-webcomponents/require/requiretext"
                }
            },
            urlArgs: urlArgs,
            paths: paths,
            onError: onRequireJsError
        });
        requirejs.onError = onRequireJsError;
        define("jstree", ["thirdparty/jstree/jstree", "css!thirdparty/jstree/themes/default/style.css"], returnFirstDependency);
        define("dashboardcss", ["css!css/dashboard"], returnFirstDependency);
        define("slideshow", [embyWebComponentsBowerPath + "/slideshow/slideshow"], returnFirstDependency);
        define("fetch", [bowerPath + "/fetch/fetch"], returnFirstDependency);
        define("raf", [embyWebComponentsBowerPath + "/polyfills/raf"], returnFirstDependency);
        define("functionbind", [embyWebComponentsBowerPath + "/polyfills/bind"], returnFirstDependency);
        define("arraypolyfills", [embyWebComponentsBowerPath + "/polyfills/array"], returnFirstDependency);
        define("objectassign", [embyWebComponentsBowerPath + "/polyfills/objectassign"], returnFirstDependency);
        define("clearButtonStyle", ["css!" + embyWebComponentsBowerPath + "/clearbutton"], returnFirstDependency);
        define("userdataButtons", [embyWebComponentsBowerPath + "/userdatabuttons/userdatabuttons"], returnFirstDependency);
        define("emby-playstatebutton", [embyWebComponentsBowerPath + "/userdatabuttons/emby-playstatebutton"], returnFirstDependency);
        define("emby-ratingbutton", [embyWebComponentsBowerPath + "/userdatabuttons/emby-ratingbutton"], returnFirstDependency);
        define("emby-downloadbutton", [embyWebComponentsBowerPath + "/sync/emby-downloadbutton"], returnFirstDependency);
        define("listView", [embyWebComponentsBowerPath + "/listview/listview"], returnFirstDependency);
        define("listViewStyle", ["css!" + embyWebComponentsBowerPath + "/listview/listview"], returnFirstDependency);
        define("formDialogStyle", ["css!" + embyWebComponentsBowerPath + "/formdialog"], returnFirstDependency);
        define("indicators", [embyWebComponentsBowerPath + "/indicators/indicators"], returnFirstDependency);
        define("viewSettings", [embyWebComponentsBowerPath + "/viewsettings/viewsettings"], returnFirstDependency);
        define("filterMenu", [embyWebComponentsBowerPath + "/filtermenu/filtermenu"], returnFirstDependency);
        define("sortMenu", [embyWebComponentsBowerPath + "/sortmenu/sortmenu"], returnFirstDependency);
        define("registrationServices", [embyWebComponentsBowerPath + "/registrationservices/registrationservices"], returnFirstDependency);

        if ("cordova" === self.appMode || "android" === self.appMode) {
            define("fileupload", ["cordova/fileupload"], returnFirstDependency);
        } else {
            define("fileupload", [apiClientBowerPath + "/fileupload"], returnFirstDependency);
        }

        define("connectionmanager", [apiClientBowerPath + "/connectionmanager"]);
        define("serversync", [apiClientBowerPath + "/sync/serversync"], returnFirstDependency);
        define("multiserversync", [apiClientBowerPath + "/sync/multiserversync"], returnFirstDependency);
        define("mediasync", [apiClientBowerPath + "/sync/mediasync"], returnFirstDependency);
        define("idb", [embyWebComponentsBowerPath + "/idb"], returnFirstDependency);
        define("sanitizefilename", [embyWebComponentsBowerPath + "/sanitizefilename"], returnFirstDependency);
        define("itemrepository", [apiClientBowerPath + "/sync/itemrepository"], returnFirstDependency);
        define("useractionrepository", [apiClientBowerPath + "/sync/useractionrepository"], returnFirstDependency);
        define("swiper", [bowerPath + "/Swiper/dist/js/swiper.min", "css!" + bowerPath + "/Swiper/dist/css/swiper.min"], returnFirstDependency);
        define("scroller", [embyWebComponentsBowerPath + "/scroller/smoothscroller"], returnFirstDependency);
        define("toast", [embyWebComponentsBowerPath + "/toast/toast"], returnFirstDependency);
        define("scrollHelper", [embyWebComponentsBowerPath + "/scrollhelper"], returnFirstDependency);
        define("touchHelper", [embyWebComponentsBowerPath + "/touchhelper"], returnFirstDependency);
        define("appSettings", [embyWebComponentsBowerPath + "/appsettings"], returnFirstDependency);
        define("userSettings", [embyWebComponentsBowerPath + "/usersettings/usersettings"], returnFirstDependency);
        define("userSettingsBuilder", [embyWebComponentsBowerPath + "/usersettings/usersettingsbuilder", "layoutManager", "browser"], getSettingsBuilder);
        define("material-icons", ["css!" + embyWebComponentsBowerPath + "/fonts/material-icons/style"], returnFirstDependency);
        define("systemFontsCss", ["css!" + embyWebComponentsBowerPath + "/fonts/fonts"], returnFirstDependency);
        define("systemFontsSizedCss", ["css!" + embyWebComponentsBowerPath + "/fonts/fonts.sized"], returnFirstDependency);
        define("scrollStyles", ["css!" + embyWebComponentsBowerPath + "/scrollstyles"], returnFirstDependency);
        define("imageUploader", [embyWebComponentsBowerPath + "/imageuploader/imageuploader"], returnFirstDependency);
        define("navdrawer", ["components/navdrawer/navdrawer"], returnFirstDependency);
        define("htmlMediaHelper", [embyWebComponentsBowerPath + "/htmlvideoplayer/htmlmediahelper"], returnFirstDependency);
        define("viewcontainer", ["components/viewcontainer-lite", "css!" + embyWebComponentsBowerPath + "/viewmanager/viewcontainer-lite"], returnFirstDependency);
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
        define("dialogHelper", [embyWebComponentsBowerPath + "/dialoghelper/dialoghelper"], returnFirstDependency);
        define("inputmanager", ["inputManager"], returnFirstDependency);
        define("apiInput", [embyWebComponentsBowerPath + "/input/api"], returnFirstDependency);
        define("serverNotifications", ["apiInput"], returnFirstDependency);
        define("headroom-window", ["headroom"], createWindowHeadroom);
        define("appFooter-shared", ["appFooter"], createSharedAppFooter);
        define("skinManager", [embyWebComponentsBowerPath + "/skinmanager"], function (skinManager) {
            skinManager.loadUserSkin = function (options) {
                require(["appRouter"], function (appRouter) {
                    options = options || {};

                    if (options.start) {
                        appRouter.invokeShortcut(options.start);
                    } else {
                        appRouter.goHome();
                    }
                });
            };

            skinManager.getThemes = function () {
                return [{
                    name: "Apple TV",
                    id: "appletv"
                }, {
                    name: "Blue Radiance",
                    id: "blueradiance"
                }, {
                    name: "Dark",
                    id: "dark",
                    isDefault: true,
                    isDefaultServerDashboard: true
                }, {
                    name: "Dark (green accent)",
                    id: "dark-green"
                }, {
                    name: "Dark (red accent)",
                    id: "dark-red"
                }, {
                    name: "Light",
                    id: "light"
                }, {
                    name: "Light (blue accent)",
                    id: "light-blue"
                }, {
                    name: "Light (green accent)",
                    id: "light-green"
                }, {
                    name: "Light (pink accent)",
                    id: "light-pink"
                }, {
                    name: "Light (purple accent)",
                    id: "light-purple"
                }, {
                    name: "Light (red accent)",
                    id: "light-red"
                }, {
                    name: "Windows Media Center",
                    id: "wmc"
                }];
            };

            return skinManager;
        });
        define("connectionManager", [], function () {
            return ConnectionManager;
        });
        define("apiClientResolver", [], function () {
            return function () {
                return window.ApiClient;
            };
        });
        define("appRouter", [embyWebComponentsBowerPath + "/router", "itemHelper"], function (appRouter, itemHelper) {
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

                if ("Playlist" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("TvChannel" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("Program" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("BoxSet" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("MusicAlbum" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("MusicGenre" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("Person" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("Recording" == itemType) {
                    return "itemdetails.html?id=" + id + "&serverId=" + serverId;
                }

                if ("MusicArtist" == itemType) {
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
