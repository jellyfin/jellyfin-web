/* eslint-env serviceworker */
(function () {
    'use strict';

    var connectionManager;

    function getApiClient(serverId) {
        if (connectionManager) {
            return Promise.resolve(connectionManager.getApiClient(serverId));
        }
        return Promise.reject();
    }

    // TODO: support arbitrary actions from the server
    // notifications will get sent with an ID and users can mark them as read
    // the server can optionally pass actions in the request body
    // the clients would then have the option to trigger the actions on confirmation
    function executeAction(action, data, serverId) {
        return getApiClient(serverId).then(function (apiClient) {
            switch (action) {
                case 'cancel-install':
                    var id = data.id;
                    return apiClient.cancelPackageInstallation(id);
                default:
                    clients.openWindow('/');
                    return Promise.resolve();
            }
        });
    }

    self.addEventListener('notificationclick', function (event) {
        var notification = event.notification;
        notification.close();

        var data = notification.data;
        var serverId = data.serverId;
        var action = event.action;

        if (!action) {
            clients.openWindow('/');
            event.waitUntil(Promise.resolve());
            return;
        }

        event.waitUntil(executeAction(action, data, serverId));
    }, false);
})();
