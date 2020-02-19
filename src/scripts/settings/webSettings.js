define(['appStorage', 'events'], function (appStorage, events) {
    'use strict';

    var data;

    function getConfig() {
        if (data) {
            return data;
        }

        fetch("/config.json").then(function (response) {
            data = response.json();
        })

        return data;
    }

    function WebSettings() {
        getConfig();
    }

    WebSettings.prototype.enableMultiServer = function () {
        return getConfig().multiServer || false;
    };

    return new WebSettings();
});
