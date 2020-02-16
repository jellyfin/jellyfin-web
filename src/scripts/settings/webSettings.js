define(['appStorage', 'events'], function (appStorage, events) {
    'use strict';

    function readConfig(path, callback) {
        var file = new XMLHttpRequest();
        file.overrideMimeType("application/json");
        file.open("GET", path, true);
        file.onreadystatechange = function() {
            if (file.readyState === 4 && file.status == "200") {
                callback(file.responseText);
            }
        }

        file.send(null);
    }

    var data = {};

    function WebSettings() {
        readConfig("/config.json", function(text) {
            data = JSON.parse(text);
        });
    }

    WebSettings.prototype.getMultiserver = function () {
        return data.multiserver !== false;
    };

    return new WebSettings();
});
