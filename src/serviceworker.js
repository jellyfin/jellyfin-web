/* eslint-env serviceworker */

/* eslint-disable-next-line import/namespace,import/named */
import { skipWaiting, clientsClaim } from 'workbox-core';

skipWaiting();
clientsClaim();

function getApiClient(serverId) {
    return Promise.resolve(window.connectionManager.getApiClient(serverId));
}

function executeAction(action, data, serverId) {
    return getApiClient(serverId).then(function (apiClient) {
        switch (action) {
            case 'cancel-install':
                return apiClient.cancelPackageInstallation(data.id);
            case 'restart':
                return apiClient.restartServer();
            default:
                clients.openWindow('/');
                return Promise.resolve();
        }
    });
}

/* eslint-disable-next-line no-restricted-globals -- self is valid in a serviceworker environment */
self.addEventListener('notificationclick', function (event) {
    const notification = event.notification;
    notification.close();

    const data = notification.data;
    const serverId = data.serverId;
    const action = event.action;

    if (!action) {
        clients.openWindow('/');
        event.waitUntil(Promise.resolve());
        return;
    }

    event.waitUntil(executeAction(action, data, serverId));
}, false);

// this is needed by the webpack Workbox plugin
// this plugin is not fully supported in webpack v5. pecaching is disabled until version 6 of this plugin is released
/* eslint-disable-next-line no-restricted-globals,no-undef */
//workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
