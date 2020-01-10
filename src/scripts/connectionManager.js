define('connectionManager', ["connectionManagerFactory", "apphost", "credentialprovider"], function(connectionManagerFactory, apphost, credentialProvider) {
    'use strict';

    var credentialProviderInstance = new credentialProvider();
    window.connectionManager = new connectionManagerFactory(credentialProviderInstance, apphost.appName(), apphost.appVersion(), apphost.deviceName(), apphost.deviceId(), window.capabilities, window.devicePixelRatio);

    return window.connectionManager;
});