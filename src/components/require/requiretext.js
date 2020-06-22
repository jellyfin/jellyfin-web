define(function () {
    'use strict';

    // hack to work around the server's auto-redirection feature
    var addRedirectPrevention = window.self.dashboardVersion != null && window.self.Dashboard && !window.self.AppInfo.isNativeApp;

    return {

        load: function (url, req, load, config) {

            if (url.indexOf('://') === -1) {
                url = config.baseUrl + url;
            }

            if (config.urlArgs) {
                url += config.urlArgs(url, url);
            }

            if (addRedirectPrevention) {
                if (url.indexOf('?') === -1) {
                    url += '?';
                } else {
                    url += '&';
                }

                url += 'r=0';
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onload = function (e) {
                load(this.response);
            };

            xhr.send();
        },

        normalize: function (name, normalize) {
            return normalize(name);
        }
    };
});
