/* eslint-env serviceworker */

/* eslint-disable import/namespace,import/named */
import { skipWaiting, clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
/* eslint-enable import/namespace,import/named */

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

// Do not precache files in development so live reload works as expected
/* eslint-disable-next-line no-undef -- WEBPACK_SERVE is replaced by webpack */
if (process.env.WEBPACK_SERVE) {
    // this is needed by the webpack Workbox plugin
    /* eslint-disable-next-line no-restricted-globals,no-undef */
    precacheAndRoute(self.__WB_MANIFEST);
}
