define(["events", "apiclient", "appStorage"], function (events, apiClientFactory, appStorage) {
    "use strict";

    function getServerAddress(server, mode) {
        switch (mode) {
            case ConnectionMode.Local:
                return server.LocalAddress;

            case ConnectionMode.Manual:
                return server.ManualAddress;

            case ConnectionMode.Remote:
                return server.RemoteAddress;

            default:
                return server.ManualAddress || server.LocalAddress || server.RemoteAddress;
        }
    }

    function paramsToString(params) {
        var values = [];

        for (var key in params) {
            var value = params[key];

            if (null !== value && void 0 !== value && "" !== value) {
                values.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
            }
        }

        return values.join("&");
    }

    function resolveFailure(instance, resolve) {
        resolve({
            State: "Unavailable",
            ConnectUser: instance.connectUser()
        });
    }

    function mergeServers(credentialProvider, list1, list2) {
        for (var i = 0, length = list2.length; i < length; i++) {
            credentialProvider.addOrUpdateServer(list1, list2[i]);
        }

        return list1;
    }

    function updateServerInfo(server, systemInfo) {
        server.Name = systemInfo.ServerName;
        server.Id = systemInfo.Id;

        if (systemInfo.LocalAddress) {
            server.LocalAddress = systemInfo.LocalAddress;
        }
    }

    function getEmbyServerUrl(baseUrl, handler) {
        return baseUrl + "/" + handler;
    }

    function getFetchPromise(request) {
        var headers = request.headers || {};

        if ("json" === request.dataType) {
            headers.accept = "application/json";
        }

        var fetchRequest = {
            headers: headers,
            method: request.type,
            credentials: "same-origin"
        };
        var contentType = request.contentType;

        if (request.data) {
            if ("string" == typeof request.data) {
                fetchRequest.body = request.data;
            } else {
                fetchRequest.body = paramsToString(request.data);
                contentType = contentType || "application/x-www-form-urlencoded; charset=UTF-8";
            }
        }

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        if (request.timeout) {
            return fetchWithTimeout(request.url, fetchRequest, request.timeout);
        }

        return fetch(request.url, fetchRequest);
    }

    function fetchWithTimeout(url, options, timeoutMs) {
        console.log("fetchWithTimeout: timeoutMs: " + timeoutMs + ", url: " + url);
        return new Promise(function (resolve, reject) {
            var timeout = setTimeout(reject, timeoutMs);
            options = options || {};
            options.credentials = "same-origin";
            fetch(url, options).then(function (response) {
                clearTimeout(timeout);
                console.log("fetchWithTimeout: succeeded connecting to url: " + url);
                resolve(response);
            }, function (error) {
                clearTimeout(timeout);
                console.log("fetchWithTimeout: timed out connecting to url: " + url);
                reject();
            });
        });
    }

    function ajax(request) {
        if (!request) {
            throw new Error("Request cannot be null");
        }

        request.headers = request.headers || {};
        console.log("ConnectionManager requesting url: " + request.url);
        return getFetchPromise(request).then(function (response) {
            console.log("ConnectionManager response status: " + response.status + ", url: " + request.url);

            if (response.status < 400) {
                if ("json" === request.dataType || "application/json" === request.headers.accept) {
                    return response.json();
                }

                return response;
            }

            return Promise.reject(response);
        }, function (err) {
            throw console.log("ConnectionManager request failed to url: " + request.url), err;
        });
    }

    //To be remove
    /*function getConnectUrl(handler) {
        return "https://connect.emby.media/service/" + handler;
    }*/

    function replaceAll(originalString, strReplace, strWith) {
        var reg = new RegExp(strReplace, "ig");
        return originalString.replace(reg, strWith);
    }

    function normalizeAddress(address) {
        address = address.trim();

        if (0 !== address.toLowerCase().indexOf("http")) {
            address = "http://" + address;
        }

        address = replaceAll(address, "Http:", "http:");
        return address = replaceAll(address, "Https:", "https:");
    }

    function stringEqualsIgnoreCase(str1, str2) {
        return (str1 || "").toLowerCase() === (str2 || "").toLowerCase();
    }

    function compareVersions(a, b) {
        a = a.split(".");
        b = b.split(".");

        for (var i = 0, length = Math.max(a.length, b.length); i < length; i++) {
            var aVal = parseInt(a[i] || "0");
            var bVal = parseInt(b[i] || "0");

            if (aVal < bVal) {
                return -1;
            }

            if (aVal > bVal) {
                return 1;
            }
        }

        return 0;
    }

    var defaultTimeout = 2e4;
    var ConnectionMode = {
        Local: 0,
        Remote: 1,
        Manual: 2
    };

    var ConnectionManager = function (credentialProvider, appName, appVersion, deviceName, deviceId, capabilities, devicePixelRatio) {
        function onConnectUserSignIn(user) {
            connectUser = user;
            events.trigger(self, "connectusersignedin", [user]);
        }

        function onAuthenticated(apiClient, result, options, saveCredentials) {
            var credentials = credentialProvider.credentials();
            var servers = credentials.Servers.filter(function (s) {
                return s.Id === result.ServerId;
            });
            var server = servers.length ? servers[0] : apiClient.serverInfo();

            if (false !== options.updateDateLastAccessed) {
                server.DateLastAccessed = new Date().getTime();
            }

            server.Id = result.ServerId;

            if (saveCredentials) {
                server.UserId = result.User.Id;
                server.AccessToken = result.AccessToken;
            } else {
                server.UserId = null;
                server.AccessToken = null;
            }

            credentialProvider.addOrUpdateServer(credentials.Servers, server);
            credentialProvider.credentials(credentials);
            apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
            apiClient.serverInfo(server);
            afterConnected(apiClient, options);
            return onLocalUserSignIn(server, apiClient.serverAddress(), result.User);
        }

        function afterConnected(apiClient, options) {
            options = options || {};

            if (false !== options.reportCapabilities) {
                apiClient.reportCapabilities(capabilities);
            }

            apiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;

            if (false !== options.enableWebSocket) {
                console.log("calling apiClient.ensureWebSocket");
                apiClient.ensureWebSocket();
            }
        }

        function onLocalUserSignIn(server, serverUrl, user) {
            self._getOrAddApiClient(server, serverUrl);

            return (self.onLocalUserSignedIn ? self.onLocalUserSignedIn.call(self, user) : Promise.resolve()).then(function () {
                events.trigger(self, "localusersignedin", [user]);
            });
        }

        function ensureConnectUser(credentials) {
            if (connectUser && connectUser.Id === credentials.ConnectUserId) {
                return Promise.resolve();
            }

            if (credentials.ConnectUserId && credentials.ConnectAccessToken) {
                connectUser = null;
                return getConnectUser(credentials.ConnectUserId, credentials.ConnectAccessToken).then(function (user) {
                    onConnectUserSignIn(user);
                    return Promise.resolve();
                }, function () {
                    return Promise.resolve();
                });
            }

            return Promise.resolve();
        }

        //To be remove
        /*function getConnectUser(userId, accessToken) {
            if (!userId) {
                throw new Error("null userId");
            }

            if (!accessToken) {
                throw new Error("null accessToken");
            }

            return ajax({
                type: "GET",
                url: "https://connect.emby.media/service/user?id=" + userId,
                dataType: "json",
                headers: {
                    "X-Application": appName + "/" + appVersion,
                    "X-Connect-UserToken": accessToken
                }
            });
        }*/

        function addAuthenticationInfoFromConnect(server, serverUrl, credentials) {
            if (!server.ExchangeToken) {
                throw new Error("server.ExchangeToken cannot be null");
            }

            if (!credentials.ConnectUserId) {
                throw new Error("credentials.ConnectUserId cannot be null");
            }

            var url = getEmbyServerUrl(serverUrl, "Connect/Exchange?format=json&ConnectUserId=" + credentials.ConnectUserId);
            var auth = 'MediaBrowser Client="' + appName + '", Device="' + deviceName + '", DeviceId="' + deviceId + '", Version="' + appVersion + '"';
            return ajax({
                type: "GET",
                url: url,
                dataType: "json",
                headers: {
                    "X-MediaBrowser-Token": server.ExchangeToken,
                    "X-Emby-Authorization": auth
                }
            }).then(function (auth) {
                server.UserId = auth.LocalUserId;
                server.AccessToken = auth.AccessToken;
                return auth;
            }, function () {
                server.UserId = null;
                server.AccessToken = null;
                return Promise.reject();
            });
        }

        function validateAuthentication(server, serverUrl) {
            return ajax({
                type: "GET",
                url: getEmbyServerUrl(serverUrl, "System/Info"),
                dataType: "json",
                headers: {
                    "X-MediaBrowser-Token": server.AccessToken
                }
            }).then(function (systemInfo) {
                updateServerInfo(server, systemInfo);
                return Promise.resolve();
            }, function () {
                server.UserId = null;
                server.AccessToken = null;
                return Promise.resolve();
            });
        }

        function getImageUrl(localUser) {
            if (connectUser && connectUser.ImageUrl) {
                return {
                    url: connectUser.ImageUrl
                };
            }

            if (localUser && localUser.PrimaryImageTag) {
                return {
                    url: self.getApiClient(localUser).getUserImageUrl(localUser.Id, {
                        tag: localUser.PrimaryImageTag,
                        type: "Primary"
                    }),
                    supportsParams: true
                };
            }

            return {
                url: null,
                supportsParams: false
            };
        }

        function logoutOfServer(apiClient) {
            var serverInfo = apiClient.serverInfo() || {};
            var logoutInfo = {
                serverId: serverInfo.Id
            };
            return apiClient.logout().then(function () {
                events.trigger(self, "localusersignedout", [logoutInfo]);
            }, function () {
                events.trigger(self, "localusersignedout", [logoutInfo]);
            });
        }

        //To be remove
        /*function getConnectServers(credentials) {
            console.log("Begin getConnectServers");

            if (credentials.ConnectAccessToken && credentials.ConnectUserId) {
                return ajax({
                    type: "GET",
                    url: "https://connect.emby.media/service/servers?userId=" + credentials.ConnectUserId,
                    dataType: "json",
                    headers: {
                        "X-Application": appName + "/" + appVersion,
                        "X-Connect-UserToken": credentials.ConnectAccessToken
                    }
                }).then(function (servers) {
                    return servers.map(function (i) {
                        return {
                            ExchangeToken: i.AccessKey,
                            ConnectServerId: i.Id,
                            Id: i.SystemId,
                            Name: i.Name,
                            RemoteAddress: i.Url,
                            LocalAddress: i.LocalAddress,
                            UserLinkType: "guest" === (i.UserType || "").toLowerCase() ? "Guest" : "LinkedUser"
                        };
                    });
                }, function () {
                    return credentials.Servers.slice(0).filter(function (s) {
                        return s.ExchangeToken;
                    });
                });
            }

            return Promise.resolve([]);
        }*/

        function filterServers(servers, connectServers) {
            return servers.filter(function (server) {
                return !server.ExchangeToken || connectServers.filter(function (connectServer) {
                    return server.Id === connectServer.Id;
                }).length > 0;
            });
        }

        function findServers() {
            return new Promise(function (resolve, reject) {
                var onFinish = function (foundServers) {
                    var servers = foundServers.map(function (foundServer) {
                        var info = {
                            Id: foundServer.Id,
                            LocalAddress: convertEndpointAddressToManualAddress(foundServer) || foundServer.Address,
                            Name: foundServer.Name
                        };
                        info.LastConnectionMode = info.ManualAddress ? ConnectionMode.Manual : ConnectionMode.Local;
                        return info;
                    });
                    resolve(servers);
                };

                if (window.NativeShell && typeof window.NativeShell.findServers === 'function') {
                    window.NativeShell.findServers(1e3).then(onFinish, function () {
                        onFinish([]);
                    });
                } else {
                    resolve([]);
                }
            });
        }

        function convertEndpointAddressToManualAddress(info) {
            if (info.Address && info.EndpointAddress) {
                var address = info.EndpointAddress.split(":")[0];
                var parts = info.Address.split(":");

                if (parts.length > 1) {
                    var portString = parts[parts.length - 1];

                    if (!isNaN(parseInt(portString))) {
                        address += ":" + portString;
                    }
                }

                return normalizeAddress(address);
            }

            return null;
        }

        function getTryConnectPromise(url, connectionMode, state, resolve, reject) {
            console.log("getTryConnectPromise " + url);
            ajax({
                url: getEmbyServerUrl(url, "system/info/public"),
                timeout: defaultTimeout,
                type: "GET",
                dataType: "json"
            }).then(function (result) {
                if (!state.resolved) {
                    state.resolved = true;
                    console.log("Reconnect succeeded to " + url);
                    resolve({
                        url: url,
                        connectionMode: connectionMode,
                        data: result
                    });
                }
            }, function () {
                if (!state.resolved) {
                    console.log("Reconnect failed to " + url);

                    if (++state.rejects >= state.numAddresses) {
                        reject();
                    }
                }
            });
        }

        function tryReconnect(serverInfo) {
            var addresses = [];
            var addressesStrings = [];

            if (!serverInfo.manualAddressOnly && serverInfo.LocalAddress && -1 === addressesStrings.indexOf(serverInfo.LocalAddress)) {
                addresses.push({
                    url: serverInfo.LocalAddress,
                    mode: ConnectionMode.Local,
                    timeout: 0
                });
                addressesStrings.push(addresses[addresses.length - 1].url);
            }

            if (serverInfo.ManualAddress && -1 === addressesStrings.indexOf(serverInfo.ManualAddress)) {
                addresses.push({
                    url: serverInfo.ManualAddress,
                    mode: ConnectionMode.Manual,
                    timeout: 100
                });
                addressesStrings.push(addresses[addresses.length - 1].url);
            }

            if (!serverInfo.manualAddressOnly && serverInfo.RemoteAddress && -1 === addressesStrings.indexOf(serverInfo.RemoteAddress)) {
                addresses.push({
                    url: serverInfo.RemoteAddress,
                    mode: ConnectionMode.Remote,
                    timeout: 200
                });
                addressesStrings.push(addresses[addresses.length - 1].url);
            }

            console.log("tryReconnect: " + addressesStrings.join("|"));
            return new Promise(function (resolve, reject) {
                var state = {};
                state.numAddresses = addresses.length;
                state.rejects = 0;
                addresses.map(function (url) {
                    setTimeout(function () {
                        if (!state.resolved) {
                            getTryConnectPromise(url.url, url.mode, state, resolve, reject);
                        }
                    }, url.timeout);
                });
            });
        }

        function onSuccessfulConnection(server, systemInfo, connectionMode, serverUrl, options, resolve) {
            var credentials = credentialProvider.credentials();
            options = options || {};

            if (credentials.ConnectAccessToken && false !== options.enableAutoLogin) {
                ensureConnectUser(credentials).then(function () {
                    if (server.ExchangeToken) {
                        addAuthenticationInfoFromConnect(server, serverUrl, credentials).then(function () {
                            afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
                        }, function () {
                            afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
                        });
                    } else {
                        afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
                    }
                });
            } else {
                afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
            }
        }

        function afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, verifyLocalAuthentication, options, resolve) {
            if (options = options || {}, false === options.enableAutoLogin) {
                server.UserId = null;
                server.AccessToken = null;
            } else if (verifyLocalAuthentication && server.AccessToken && false !== options.enableAutoLogin) {
                return void validateAuthentication(server, serverUrl).then(function () {
                    afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, false, options, resolve);
                });
            }

            updateServerInfo(server, systemInfo);
            server.LastConnectionMode = connectionMode;

            if (false !== options.updateDateLastAccessed) {
                server.DateLastAccessed = new Date().getTime();
            }

            credentialProvider.addOrUpdateServer(credentials.Servers, server);
            credentialProvider.credentials(credentials);
            var result = {
                Servers: []
            };
            result.ApiClient = self._getOrAddApiClient(server, serverUrl);
            result.ApiClient.setSystemInfo(systemInfo);
            result.State = server.AccessToken && false !== options.enableAutoLogin ? "SignedIn" : "ServerSignIn";
            result.Servers.push(server);
            result.ApiClient.enableAutomaticBitrateDetection = options.enableAutomaticBitrateDetection;
            result.ApiClient.updateServerInfo(server, serverUrl);

            var resolveActions = function () {
                resolve(result);
                events.trigger(self, "connected", [result]);
            };

            if ("SignedIn" === result.State) {
                afterConnected(result.ApiClient, options);
                result.ApiClient.getCurrentUser().then(function (user) {
                    onLocalUserSignIn(server, serverUrl, user).then(resolveActions, resolveActions);
                }, resolveActions);
            } else {
                resolveActions();
            }
        }

        function getCacheKey(feature, apiClient, options) {
            options = options || {};
            var viewOnly = options.viewOnly;
            var cacheKey = "regInfo-" + apiClient.serverId();

            if (viewOnly) {
                cacheKey += "-viewonly";
            }

            return cacheKey;
        }

        function addAppInfoToConnectRequest(request) {
            request.headers = request.headers || {};
            request.headers["X-Application"] = appName + "/" + appVersion;
        }

        function exchangePin(pinInfo) {
            if (!pinInfo) {
                throw new Error("pinInfo cannot be null");
            }

            var request = {
                type: "POST",
                url: getConnectUrl("pin/authenticate"),
                data: {
                    deviceId: pinInfo.DeviceId,
                    pin: pinInfo.Pin
                },
                dataType: "json"
            };
            addAppInfoToConnectRequest(request);
            return ajax(request);
        }

        console.log("Begin ConnectionManager constructor");
        var self = this;
        this._apiClients = [];
        var connectUser;

        self.connectUser = function () {
            return connectUser;
        };

        self._minServerVersion = "3.2.33";

        self.appVersion = function () {
            return appVersion;
        };

        self.appName = function () {
            return appName;
        };

        self.capabilities = function () {
            return capabilities;
        };

        self.deviceId = function () {
            return deviceId;
        };

        self.credentialProvider = function () {
            return credentialProvider;
        };

        self.connectUserId = function () {
            return credentialProvider.credentials().ConnectUserId;
        };

        self.connectToken = function () {
            return credentialProvider.credentials().ConnectAccessToken;
        };

        self.getServerInfo = function (id) {
            return credentialProvider.credentials().Servers.filter(function (s) {
                return s.Id === id;
            })[0];
        };

        self.getLastUsedServer = function () {
            var servers = credentialProvider.credentials().Servers;
            servers.sort(function (a, b) {
                return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
            });

            if (servers.length) {
                return servers[0];
            }

            return null;
        };

        self.addApiClient = function (apiClient) {
            self._apiClients.push(apiClient);

            var existingServers = credentialProvider.credentials().Servers.filter(function (s) {
                return stringEqualsIgnoreCase(s.ManualAddress, apiClient.serverAddress()) || stringEqualsIgnoreCase(s.LocalAddress, apiClient.serverAddress()) || stringEqualsIgnoreCase(s.RemoteAddress, apiClient.serverAddress());
            });
            var existingServer = existingServers.length ? existingServers[0] : apiClient.serverInfo();

            if (existingServer.DateLastAccessed = new Date().getTime(), existingServer.LastConnectionMode = ConnectionMode.Manual, existingServer.ManualAddress = apiClient.serverAddress(), apiClient.manualAddressOnly && (existingServer.manualAddressOnly = true), apiClient.serverInfo(existingServer), apiClient.onAuthenticated = function (instance, result) {
                    return onAuthenticated(instance, result, {}, true);
                }, !existingServers.length) {
                var credentials = credentialProvider.credentials();
                credentials.Servers = [existingServer];
                credentialProvider.credentials(credentials);
            }

            events.trigger(self, "apiclientcreated", [apiClient]);
        };

        self.clearData = function () {
            console.log("connection manager clearing data");
            connectUser = null;
            var credentials = credentialProvider.credentials();
            credentials.ConnectAccessToken = null;
            credentials.ConnectUserId = null;
            credentials.Servers = [];
            credentialProvider.credentials(credentials);
        };

        self._getOrAddApiClient = function (server, serverUrl) {
            var apiClient = self.getApiClient(server.Id);

            if (!apiClient) {
                apiClient = new apiClientFactory(serverUrl, appName, appVersion, deviceName, deviceId, devicePixelRatio);

                self._apiClients.push(apiClient);

                apiClient.serverInfo(server);

                apiClient.onAuthenticated = function (instance, result) {
                    return onAuthenticated(instance, result, {}, true);
                };

                events.trigger(self, "apiclientcreated", [apiClient]);
            }

            console.log("returning instance from getOrAddApiClient");
            return apiClient;
        };

        self.getOrCreateApiClient = function (serverId) {
            var credentials = credentialProvider.credentials();
            var servers = credentials.Servers.filter(function (s) {
                return stringEqualsIgnoreCase(s.Id, serverId);
            });

            if (!servers.length) {
                throw new Error("Server not found: " + serverId);
            }

            var server = servers[0];
            return self._getOrAddApiClient(server, getServerAddress(server, server.LastConnectionMode));
        };

        self.user = function (apiClient) {
            return new Promise(function (resolve, reject) {
                function onLocalUserDone(e) {
                    var image = getImageUrl(localUser);
                    resolve({
                        localUser: localUser,
                        name: connectUser ? connectUser.Name : localUser ? localUser.Name : null,
                        imageUrl: image.url,
                        supportsImageParams: image.supportsParams,
                        connectUser: connectUser
                    });
                }

                function onEnsureConnectUserDone() {
                    if (apiClient && apiClient.getCurrentUserId()) {
                        apiClient.getCurrentUser().then(function (u) {
                            localUser = u;
                            onLocalUserDone();
                        }, onLocalUserDone);
                    } else {
                        onLocalUserDone();
                    }
                }

                var localUser;
                var credentials = credentialProvider.credentials();

                if (!credentials.ConnectUserId || !credentials.ConnectAccessToken || apiClient && apiClient.getCurrentUserId()) {
                    onEnsureConnectUserDone();
                } else {
                    ensureConnectUser(credentials).then(onEnsureConnectUserDone, onEnsureConnectUserDone);
                }
            });
        };

        self.logout = function () {
            console.log("begin connectionManager loguot");
            var promises = [];

            for (var i = 0, length = self._apiClients.length; i < length; i++) {
                var apiClient = self._apiClients[i];

                if (apiClient.accessToken()) {
                    promises.push(logoutOfServer(apiClient));
                }
            }

            return Promise.all(promises).then(function () {
                var credentials = credentialProvider.credentials();
                var servers = credentials.Servers.filter(function (u) {
                    return "Guest" !== u.UserLinkType;
                });

                for (var j = 0, numServers = servers.length; j < numServers; j++) {
                    var server = servers[j];
                    server.UserId = null;
                    server.AccessToken = null;
                    server.ExchangeToken = null;
                }

                credentials.Servers = servers;
                credentials.ConnectAccessToken = null;
                credentials.ConnectUserId = null;
                credentialProvider.credentials(credentials);

                if (connectUser) {
                    connectUser = null;
                    events.trigger(self, "connectusersignedout");
                }
            });
        };

        self.getSavedServers = function () {
            var credentials = credentialProvider.credentials();
            var servers = credentials.Servers.slice(0);
            servers.sort(function (a, b) {
                return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
            });
            return servers;
        };

        self.getAvailableServers = function () {
            console.log("Begin getAvailableServers");
            var credentials = credentialProvider.credentials();
            return Promise.all([getConnectServers(credentials), findServers()]).then(function (responses) {
                var connectServers = responses[0];
                var foundServers = responses[1];
                var servers = credentials.Servers.slice(0);
                mergeServers(credentialProvider, servers, foundServers);
                mergeServers(credentialProvider, servers, connectServers);
                servers = filterServers(servers, connectServers);
                servers.sort(function (a, b) {
                    return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
                });
                credentials.Servers = servers;
                credentialProvider.credentials(credentials);
                return servers;
            });
        };

        self.connectToServers = function (servers, options) {
            console.log("Begin connectToServers, with " + servers.length + " servers");
            var firstServer = servers.length ? servers[0] : null;

            if (firstServer) {
                return self.connectToServer(firstServer, options).then(function (result) {
                    if ("Unavailable" === result.State) {
                        result.State = "ServerSelection";
                    }

                    console.log("resolving connectToServers with result.State: " + result.State);
                    return result;
                });
            }

            return Promise.resolve({
                Servers: servers,
                State: servers.length || self.connectUser() ? "ServerSelection" : "ConnectSignIn",
                ConnectUser: self.connectUser()
            });
        };

        self.connectToServer = function (server, options) {
            console.log("begin connectToServer");
            return new Promise(function (resolve, reject) {
                options = options || {};
                tryReconnect(server).then(function (result) {
                    var serverUrl = result.url;
                    var connectionMode = result.connectionMode;
                    result = result.data;

                    if (1 === compareVersions(self.minServerVersion(), result.Version)) {
                        console.log("minServerVersion requirement not met. Server version: " + result.Version);
                        resolve({
                            State: "ServerUpdateNeeded",
                            Servers: [server]
                        });
                    } else {
                        if (server.Id && result.Id !== server.Id) {
                            console.log("http request succeeded, but found a different server Id than what was expected");
                            resolveFailure(self, resolve);
                        } else {
                            onSuccessfulConnection(server, result, connectionMode, serverUrl, options, resolve);
                        }
                    }
                }, function () {
                    resolveFailure(self, resolve);
                });
            });
        };

        self.connectToAddress = function (address, options) {
            function onFail() {
                console.log("connectToAddress " + address + " failed");
                return Promise.resolve({
                    State: "Unavailable",
                    ConnectUser: instance.connectUser()
                });
            }

            if (!address) {
                return Promise.reject();
            }

            address = normalizeAddress(address);
            var instance = this;
            var server = {
                ManualAddress: address,
                LastConnectionMode: ConnectionMode.Manual
            };
            return self.connectToServer(server, options).catch(onFail);
        };

        //To be remove
        /*self.loginToConnect = function (username, password) {
            if (username && password) {
                return ajax({
                    type: "POST",
                    url: "https://connect.emby.media/service/user/authenticate",
                    data: {
                        nameOrEmail: username,
                        rawpw: password
                    },
                    dataType: "json",
                    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                    headers: {
                        "X-Application": appName + "/" + appVersion
                    }
                }).then(function (result) {
                    var credentials = credentialProvider.credentials();
                    credentials.ConnectAccessToken = result.AccessToken;
                    credentials.ConnectUserId = result.User.Id;
                    credentialProvider.credentials(credentials);
                    onConnectUserSignIn(result.User);
                    return result;
                });
            }

            return Promise.reject();
        };

        self.signupForConnect = function (options) {
            var email = options.email;
            var username = options.username;
            var password = options.password;
            var passwordConfirm = options.passwordConfirm;

            if (!email) {
                return Promise.reject({
                    errorCode: "invalidinput"
                });
            }

            if (!username) {
                return Promise.reject({
                    errorCode: "invalidinput"
                });
            }

            if (!password) {
                return Promise.reject({
                    errorCode: "invalidinput"
                });
            }

            if (!passwordConfirm) {
                return Promise.reject({
                    errorCode: "passwordmatch"
                });
            }

            if (password !== passwordConfirm) {
                return Promise.reject({
                    errorCode: "passwordmatch"
                });
            }

            var data = {
                email: email,
                userName: username,
                rawpw: password
            };

            if (options.grecaptcha) {
                data.grecaptcha = options.grecaptcha;
            }

            return ajax({
                type: "POST",
                url: "https://connect.emby.media/service/register",
                data: data,
                dataType: "json",
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                headers: {
                    "X-Application": appName + "/" + appVersion,
                    "X-CONNECT-TOKEN": "CONNECT-REGISTER"
                }
            }).catch(function (response) {
                try {
                    return response.json();
                } catch (err) {
                    throw err;
                }
            }).then(function (result) {
                if (result && result.Status) {
                    if ("SUCCESS" === result.Status) {
                        return Promise.resolve(result);
                    }

                    return Promise.reject({
                        errorCode: result.Status
                    });
                }

                Promise.reject();
            });
        };

        self.getUserInvitations = function () {
            var connectToken = self.connectToken();

            if (!connectToken) {
                throw new Error("null connectToken");
            }

            if (!self.connectUserId()) {
                throw new Error("null connectUserId");
            }

            return ajax({
                type: "GET",
                url: "https://connect.emby.media/service/servers?userId=" + self.connectUserId() + "&status=Waiting",
                dataType: "json",
                headers: {
                    "X-Connect-UserToken": connectToken,
                    "X-Application": appName + "/" + appVersion
                }
            });
        };

        self.deleteServer = function (serverId) {
            if (!serverId) {
                throw new Error("null serverId");
            }

            var server = credentialProvider.credentials().Servers.filter(function (s) {
                return s.Id === serverId;
            });
            server = server.length ? server[0] : null;
            return new Promise(function (resolve, reject) {
                function onDone() {
                    var credentials = credentialProvider.credentials();
                    credentials.Servers = credentials.Servers.filter(function (s) {
                        return s.Id !== serverId;
                    });
                    credentialProvider.credentials(credentials);
                    resolve();
                }

                if (!server.ConnectServerId) {
                    return void onDone();
                }

                var connectToken = self.connectToken();
                var connectUserId = self.connectUserId();

                if (!connectToken || !connectUserId) {
                    return void onDone();
                }

                ajax({
                    type: "DELETE",
                    url: "https://connect.emby.media/service/serverAuthorizations?serverId=" + server.ConnectServerId + "&userId=" + connectUserId,
                    headers: {
                        "X-Connect-UserToken": connectToken,
                        "X-Application": appName + "/" + appVersion
                    }
                }).then(onDone, onDone);
            });
        };

        self.rejectServer = function (serverId) {
            var connectToken = self.connectToken();

            if (!serverId) {
                throw new Error("null serverId");
            }

            if (!connectToken) {
                throw new Error("null connectToken");
            }

            if (!self.connectUserId()) {
                throw new Error("null connectUserId");
            }

            var url = "https://connect.emby.media/service/serverAuthorizations?serverId=" + serverId + "&userId=" + self.connectUserId();
            return fetch(url, {
                method: "DELETE",
                headers: {
                    "X-Connect-UserToken": connectToken,
                    "X-Application": appName + "/" + appVersion
                }
            });
        };

        self.acceptServer = function (serverId) {
            var connectToken = self.connectToken();

            if (!serverId) {
                throw new Error("null serverId");
            }

            if (!connectToken) {
                throw new Error("null connectToken");
            }

            if (!self.connectUserId()) {
                throw new Error("null connectUserId");
            }

            return ajax({
                type: "GET",
                url: "https://connect.emby.media/service/ServerAuthorizations/accept?serverId=" + serverId + "&userId=" + self.connectUserId(),
                headers: {
                    "X-Connect-UserToken": connectToken,
                    "X-Application": appName + "/" + appVersion
                }
            });
        };

        self.resetRegistrationInfo = function (apiClient) {
            var cacheKey = getCacheKey("themes", apiClient, {
                viewOnly: true
            });
            appStorage.removeItem(cacheKey);
            cacheKey = getCacheKey("themes", apiClient, {
                viewOnly: false
            });
            appStorage.removeItem(cacheKey);
        };

        self.getRegistrationInfo = function (feature, apiClient, options) {
            var cacheKey = getCacheKey(feature, apiClient, options);
            appStorage.setItem(cacheKey, JSON.stringify({
                lastValidDate: new Date().getTime(),
                deviceId: self.deviceId()
            }));
            return Promise.resolve();
        };*/

        self.createPin = function () {
            var request = {
                type: "POST",
                url: getConnectUrl("pin"),
                data: {
                    deviceId: deviceId
                },
                dataType: "json"
            };
            addAppInfoToConnectRequest(request);
            return ajax(request);
        };

        self.getPinStatus = function (pinInfo) {
            if (!pinInfo) {
                throw new Error("pinInfo cannot be null");
            }

            var queryString = {
                deviceId: pinInfo.DeviceId,
                pin: pinInfo.Pin
            };
            var request = {
                type: "GET",
                url: getConnectUrl("pin") + "?" + paramsToString(queryString),
                dataType: "json"
            };
            addAppInfoToConnectRequest(request);
            return ajax(request);
        };

        self.exchangePin = function (pinInfo) {
            if (!pinInfo) {
                throw new Error("pinInfo cannot be null");
            }

            return exchangePin(pinInfo).then(function (result) {
                var credentials = credentialProvider.credentials();
                credentials.ConnectAccessToken = result.AccessToken;
                credentials.ConnectUserId = result.UserId;
                credentialProvider.credentials(credentials);
                return ensureConnectUser(credentials);
            });
        };
    };

    ConnectionManager.prototype.connect = function (options) {
        console.log("Begin connect");
        var instance = this;
        return instance.getAvailableServers().then(function (servers) {
            return instance.connectToServers(servers, options);
        });
    };

    ConnectionManager.prototype.isLoggedIntoConnect = function () {
        return !(!this.connectToken() || !this.connectUserId());
    };

    ConnectionManager.prototype.getApiClients = function () {
        var servers = this.getSavedServers();

        for (var i = 0, length = servers.length; i < length; i++) {
            var server = servers[i];

            if (server.Id) {
                this._getOrAddApiClient(server, getServerAddress(server, server.LastConnectionMode));
            }
        }

        return this._apiClients;
    };

    ConnectionManager.prototype.getApiClient = function (item) {
        if (!item) {
            throw new Error("item or serverId cannot be null");
        }

        if (item.ServerId) {
            item = item.ServerId;
        }

        return this._apiClients.filter(function (a) {
            var serverInfo = a.serverInfo();
            return !serverInfo || serverInfo.Id === item;
        })[0];
    };

    ConnectionManager.prototype.minServerVersion = function (val) {
        if (val) {
            this._minServerVersion = val;
        }

        return this._minServerVersion;
    };

    ConnectionManager.prototype.handleMessageReceived = function (msg) {
        var serverId = msg.ServerId;

        if (serverId) {
            var apiClient = this.getApiClient(serverId);

            if (apiClient) {
                if ("string" == typeof msg.Data) {
                    try {
                        msg.Data = JSON.parse(msg.Data);
                    } catch (err) {}
                }

                apiClient.handleMessageReceived(msg);
            }
        }
    };

    return ConnectionManager;
});
