define(['appSettings', 'loading', 'apphost', 'events', 'shell', 'globalize', 'dialogHelper', 'connectionManager', 'layoutManager', 'emby-button', 'emby-linkbutton'], function (appSettings, loading, appHost, events, shell, globalize, dialogHelper, connectionManager, layoutManager) {
    'use strict';

    function validateFeature(feature, options) {
        return Promise.resolve();
    }

    function showPremiereInfo() {
        return Promise.resolve();
    }

    return {
        validateFeature: validateFeature,
        showPremiereInfo: showPremiereInfo
    };
});