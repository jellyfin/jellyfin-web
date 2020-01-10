import 'core-js/stable';
import 'regenerator-runtime/runtime';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

// If we're running in development mode, set the app as stand alone
if (process.env.NODE_ENV === 'development') {
    console.info("Running in development mode");
    window.appMode = 'standalone';
}

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

window.getParameterByName = function(name, url) {
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
        if (window.AppInfo.isNativeApp) {
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

            if (window.AppInfo.isNativeApp) {
                loginPage = "selectserver.html";
                window.ApiClient = null;
            } else {
                loginPage = "login.html";
            }

            window.Emby.Dashboard.navigate(loginPage);
        });
    },
    getConfigurationPageUrl: function (name) {
        return "configurationpage?name=" + encodeURIComponent(name);
    },
    getConfigurationResourceUrl: function (name) {
        if (window.AppInfo.isNativeApp) {
            return ApiClient.getUrl("web/ConfigurationPage", {
                name: name
            });
        }

        return window.Emby.Dashboard.getConfigurationPageUrl(name);
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

        window.Emby.Dashboard.alert({
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
                    if (window.AppInfo.isNativeApp) {
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
    confirm: function(message, title, callback) {
        "use strict";
        require(["confirm"], function(confirm) {
            confirm(message, title).then(function() {
                callback(!0)
            }, function() {
                callback(!1)
            })
        })
    },
    showLoadingMsg : function() {
        "use strict";
        require(["loading"], function(loading) {
            loading.show()
        })
    },
    hideLoadingMsg : function() {
        "use strict";
        require(["loading"], function(loading) {
            loading.hide()
        })
    }
};

window.AppInfo = {};

$(document).ready( function () {
    "use strict";

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
        return require(["connectionManager", "apphost", "events", "userSettings"], function (connectionManager, apphost, events, userSettings) {
            var promises = [apphost.getSyncProfile(), apphost.init()]

            return Promise.all(promises).then(function (responses) {
                var deviceProfile = responses[0];
                var capabilities = Dashboard.capabilities(apphost);
                window.capabilities = capabilities;

                capabilities.DeviceProfile = deviceProfile;

                bindConnectionManagerEvents(connectionManager, events, userSettings);

                if (!window.AppInfo.isNativeApp) {
                    console.log("loading ApiClient singleton");

                    return require(["apiclient"], function (apiClientFactory) {
                        console.log("creating ApiClient singleton");

                        var apiClient = new apiClientFactory(window.Emby.Dashboard.serverAddress(), apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), window.devicePixelRatio);

                        apiClient.enableAutomaticNetworking = false;
                        apiClient.manualAddressOnly = true;

                        connectionManager.addApiClient(apiClient);

                        window.ApiClient = apiClient;
                        localApiClient = apiClient;

                        console.log("loaded ApiClient singleton");
                    });
                }

                return Promise.resolve();
            });
        });
    }

    function initRequireWithBrowser(browser) {
        var preferNativeAlerts = browser.tv;
    }

    function init() {
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
                require(["keyboardnavigation"], function(keyboardnavigation) {
                    keyboardnavigation.enable();
                });
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
            console.log("Using system fonts with explicit sizes");
            require(["systemFontsSizedCss"]);
        } else {
            console.log("Using default fonts");
            require(["systemFontsCss"]);
        }

        require(["apphost", "css!assets/css/librarybrowser.css"], function (appHost) {
            //loadPlugins(appHost, browser).then(function () {
                onAppReady(browser);
            //});
        });
    }

    function loadPlugins(appHost, browser, shell) {
        console.log("Loading installed plugins");
        var list = [
            "playaccessvalidation",
            "experimentalwarnings",
            "htmlaudioplayer",
            "htmlvideoplayer",
            "photoplayer",
            "youtubeplayer",
            "backdropscreensaver",
            "logoscreensaver"
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
        console.log("Begin onAppReady");

        // ensure that appHost is loaded in this point
        require(['apphost', 'appRouter'], function (appHost, appRouter) {
            window.Emby = {};

            console.log("onAppReady - loading dependencies");
            if (browser.iOS) {
                require(['css!../assets/css/ios.css']);
            }

            window.Emby.Dashboard = Dashboard;
            window.Emby.Page = appRouter;

            require(['emby-button', 'themeloader', 'libraryMenu', 'scripts/routes'], function () {
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

                if (!AppInfo.isNativeApp && window.ApiClient) {
                    require(["css!" + ApiClient.getUrl("Branding/Css")]);
                }
            });
        });
    }

    function registerServiceWorker() {
        if (navigator.serviceWorker && "cordova" !== self.appMode && "android" !== self.appMode) {
            try {;
                runtime.register();
            } catch (err) {
                console.log("Error registering serviceWorker: " + err);
            }
        }
    }

    function onWebComponentsReady(browser) {
        initRequireWithBrowser(browser);

        if (self.appMode === 'cordova' || self.appMode === 'android' || self.appMode === 'standalone') {
            window.AppInfo.isNativeApp = true;
        }

        if (!window.Promise || browser.web0s) {
            require(["native-promise-only"], init);
        } else {
            console.log("Pre-init");
            init();
        }
    }

    var localApiClient;

    requirejs.onError = function (err) {
        console.error(err);
    };

    // Expose jQuery globally
    require(["jQuery"], function(jQuery) {
        window.$ = jQuery;
        window.jQuery = jQuery;
    });

    require(["css!assets/css/site.css"]);

    require(["browser"], onWebComponentsReady);
});

pageClassOn("viewshow", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.add("noHeaderRight");
});

pageClassOn("viewhide", "standalonePage", function () {
    document.querySelector(".skinHeader").classList.remove("noHeaderRight");
});
