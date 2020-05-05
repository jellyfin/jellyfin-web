define(["serversync"], function(ServerSync) {
    "use strict";

    function syncNext(connectionManager, servers, index, options, resolve, reject) {
        var length = servers.length;
        if (index >= length) return console.debug("MultiServerSync.sync complete"), void resolve();
        var server = servers[index];
        console.debug("Creating ServerSync to server: " + server.Id), (new ServerSync).sync(connectionManager, server, options).then(function() {
            console.debug("ServerSync succeeded to server: " + server.Id), syncNext(connectionManager, servers, index + 1, options, resolve, reject)
        }, function(err) {
            console.error("ServerSync failed to server: " + server.Id + ". " + err), syncNext(connectionManager, servers, index + 1, options, resolve, reject)
        })
    }

    function MultiServerSync() {}
    return MultiServerSync.prototype.sync = function(connectionManager, options) {
        return console.debug("MultiServerSync.sync starting..."), new Promise(function(resolve, reject) {
            var servers = connectionManager.getSavedServers();
            syncNext(connectionManager, servers, 0, options, resolve, reject)
        })
    }, MultiServerSync
});
