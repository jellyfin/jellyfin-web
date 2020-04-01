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
        if (systemInfo.Id) {
            server.Id = systemInfo.Id;
        }

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
        console.debug("fetchWithTimeout: timeoutMs: " + timeoutMs + ", url: " + url);
        return new Promise(function (resolve, reject) {
            var timeout = setTimeout(reject, timeoutMs);
            options = options || {};
            options.credentials = "same-origin";
            fetch(url, options).then(function (response) {
                clearTimeout(timeout);
                console.debug("fetchWithTimeout: succeeded connecting to url: " + url);
                resolve(response);
            }, function (error) {
                clearTimeout(timeout);
                console.error("fetchWithTimeout: timed out connecting to url: " + url);
                reject();
            });
        });
    }

    function ajax(request) {
        if (!request) {
            throw new Error("Request cannot be null");
        }

        request.headers = request.headers || {};
        console.debug("ConnectionManager requesting url: " + request.url);
        return getFetchPromise(request).then(function (response) {
            console.debug("ConnectionManager response status: " + response.status + ", url: " + request.url);

            if (response.status < 400) {
                if ("json" === request.dataType || "application/json" === request.headers.accept) {
                    return response.json();
                }

                return response;
            }

            return Promise.reject(response);
        }, function (err) {
            console.error("ConnectionManager request failed to url: " + request.url);
            throw err;
        });
    }

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
        address = replaceAll(address, "Https:", "https:");

        return address;
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

    var defaultTimeout = 20000;
    var ConnectionMode = {
        Local: 0,
        Remote: 1,
        Manual: 2
    };

    var ConnectionManager = function (credentialProvider, appName, appVersion, deviceName, deviceId, capabilities) {

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
                console.debug("calling apiClient.ensureWebSocket");
                apiClient.ensureWebSocket();
            }
        }

        function onLocalUserSignIn(server, serverUrl, user) {
            self._getOrAddApiClient(server, serverUrl);

            var promise = self.onLocalUserSignedIn ? self.onLocalUserSignedIn.call(self, user) : Promise.resolve();
            return promise.then(function () {
                events.trigger(self, "localusersignedin", [user])
            })
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
            console.debug("getTryConnectPromise " + url);
            ajax({
                url: getEmbyServerUrl(url, "system/info/public"),
                timeout: defaultTimeout,
                type: "GET",
                dataType: "json"
            }).then(function (result) {
                if (!state.resolved) {
                    state.resolved = true;
                    console.debug("Reconnect succeeded to " + url);
                    resolve({
                        url: url,
                        connectionMode: connectionMode,
                        data: result
                    });
                }
            }, function () {
                if (!state.resolved) {
                    console.error("Reconnect failed to " + url);

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

            console.debug("tryReconnect: " + addressesStrings.join("|"));
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

            afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, true, options, resolve);
        }

        function afterConnectValidated(server, credentials, systemInfo, connectionMode, serverUrl, verifyLocalAuthentication, options, resolve) {
            options = options || {};
            if (false === options.enableAutoLogin) {
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

        console.debug("Begin ConnectionManager constructor");
        var self = this;
        this._apiClients = [];
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

            existingServer.DateLastAccessed = new Date().getTime();
            existingServer.LastConnectionMode = ConnectionMode.Manual;
            existingServer.ManualAddress = apiClient.serverAddress();
            if (apiClient.manualAddressOnly) {
                existingServer.manualAddressOnly = true;
            }
            apiClient.serverInfo(existingServer);
            apiClient.onAuthenticated = function (instance, result) {
                return onAuthenticated(instance, result, {}, true);
            };
            if (!existingServers.length) {
                var credentials = credentialProvider.credentials();
                credentials.Servers = [existingServer];
                credentialProvider.credentials(credentials);
            }

            events.trigger(self, "apiclientcreated", [apiClient]);
        };

        self.clearData = function () {
            console.debug("connection manager clearing data");
            var credentials = credentialProvider.credentials();
            credentials.Servers = [];
            credentialProvider.credentials(credentials);
        };

        self._getOrAddApiClient = function (server, serverUrl) {
            var apiClient = self.getApiClient(server.Id);

            if (!apiClient) {
                apiClient = new apiClientFactory(serverUrl, appName, appVersion, deviceName, deviceId);
                self._apiClients.push(apiClient);
                apiClient.serverInfo(server);
                apiClient.onAuthenticated = function (instance, result) {
                    return onAuthenticated(instance, result, {}, true);
                };

                events.trigger(self, "apiclientcreated", [apiClient]);
            }

            console.debug("returning instance from getOrAddApiClient");
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
                    if (apiClient && apiClient.getCurrentUserId()) {
                        apiClient.getCurrentUser().then(function (u) {
                            localUser = u;
                            var image = getImageUrl(localUser);
                            resolve({
                                localUser: localUser,
                                name: localUser ? localUser.Name : null,
                                imageUrl: image.url,
                                supportsImageParams: image.supportsParams,
                            });
                        }, onLocalUserDone);
                    }
                }
                var localUser;
                if (apiClient && apiClient.getCurrentUserId()) {
                    onLocalUserDone();
                }
            });
        };

        self.logout = function () {
            console.debug("begin connectionManager loguot");
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
            console.debug("begin getAvailableServers");
            var credentials = credentialProvider.credentials();
            return Promise.all([findServers()]).then(function (responses) {
                var foundServers = responses[0];
                var servers = credentials.Servers.slice(0);
                mergeServers(credentialProvider, servers, foundServers);
                servers.sort(function (a, b) {
                    return (b.DateLastAccessed || 0) - (a.DateLastAccessed || 0);
                });
                credentials.Servers = servers;
                credentialProvider.credentials(credentials);
                return servers;
            });
        };

        self.connectToServers = function (servers, options) {
            console.debug("begin connectToServers, with " + servers.length + " servers");
            var firstServer = servers.length ? servers[0] : null;

            if (firstServer) {
                return self.connectToServer(firstServer, options).then(function (result) {
                    if ("Unavailable" === result.State) {
                        result.State = "ServerSelection";
                    }

                    console.debug("resolving connectToServers with result.State: " + result.State);
                    return result;
                });
            }

            return Promise.resolve({
                Servers: servers,
                State: "ServerSelection"
            });
        };

        self.connectToServer = function (server, options) {
            console.debug("begin connectToServer");
            return new Promise(function (resolve, reject) {
                options = options || {};
                tryReconnect(server).then(function (result) {
                    var serverUrl = result.url;
                    var connectionMode = result.connectionMode;
                    result = result.data;

                    if (1 === compareVersions(self.minServerVersion(), result.Version)) {
                        console.debug("minServerVersion requirement not met. Server version: " + result.Version);
                        resolve({
                            State: "ServerUpdateNeeded",
                            Servers: [server]
                        });
                    } else {
                        if (server.Id && result.Id !== server.Id) {
                            console.debug("http request succeeded, but found a different server Id than what was expected");
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
                console.error("connectToAddress " + address + " failed");
                return Promise.resolve({
                    State: "Unavailable",
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
            });
        };
    };

    ConnectionManager.prototype.connect = function (options) {
        console.debug("begin connect");
        var instance = this;
        return instance.getAvailableServers().then(function (servers) {
            return instance.connectToServers(servers, options);
        });
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
