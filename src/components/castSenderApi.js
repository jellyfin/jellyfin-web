define([], function() {
    'use strict';

    if (window.appMode === 'cordova' || window.appMode === 'android') {
        return {
            load: function () {
                window.chrome = window.chrome || {};
                return Promise.resolve();
            }
        };
    } else {
        var ccLoaded = false;
        return {
            load: function () {
                if (ccLoaded) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {
                    var fileref = document.createElement('script');
                    fileref.setAttribute('type', 'text/javascript');

                    fileref.onload = function () {
                        ccLoaded = true;
                        resolve();
                    };

                    fileref.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
                    document.querySelector('head').appendChild(fileref);
                });
            }
        };
    }
});
